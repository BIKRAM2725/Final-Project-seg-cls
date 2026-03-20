from fastapi import APIRouter, UploadFile, File, Form, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse, JSONResponse
import cv2, numpy as np, uuid, asyncio

import state
from core.live_session import LiveSession
from core.detector import detect_image

router = APIRouter(prefix="/drone")


# ===================== PUSH STATUS =====================
async def push_status(session_id, payload):
    ws = state.WS_CLIENTS.get(session_id)
    if ws:
        await ws.send_json(payload)


# ===================== PAIR CREATE =====================
@router.post("/pair/create")
def create_pair():
    token = str(uuid.uuid4())[:8]
    session_id = str(uuid.uuid4())

    state.PAIR_TOKENS[token] = session_id
    state.DRONE_SESSIONS[session_id] = LiveSession()

    return {
        "pair_token": token,
        "session_id": session_id
    }


# ===================== PAIR ACCEPT =====================
@router.post("/pair/accept")
async def accept_pair(token: str = Form(...), device_id: str = Form(...)):

    if token not in state.PAIR_TOKENS:
        return JSONResponse(status_code=400, content={"error": "Invalid token"})

    session_id = state.PAIR_TOKENS.pop(token)

    await push_status(session_id, {
        "status": "connected",
        "device_id": device_id
    })

    return {"session_id": session_id}


# ===================== FRAME =====================
@router.post("/frame")
async def drone_frame(frame: UploadFile = File(...), session_id: str = Form(...)):

    session = state.DRONE_SESSIONS.get(session_id)

    if not session:
        return JSONResponse(status_code=400, content={"error": "Invalid session"})

    img = cv2.imdecode(
        np.frombuffer(await frame.read(), np.uint8),
        cv2.IMREAD_COLOR
    )

    temp_path = f"temp/drone_{uuid.uuid4()}.jpg"
    cv2.imwrite(temp_path, img)

    result = detect_image(temp_path)

    print("DETECTION:", result)  # 🔥 DEBUG

    detections = [{"class": "leaf", "conf": 1.0}]

    if result.get("primary_disease"):
        detections.append({
            "class": result["primary_disease"],
            "conf": 1.0
        })

    session.update(detections)

    # MJPEG frame
    ok, jpeg = cv2.imencode(".jpg", img)
    if ok:
        state.LAST_FRAMES[session_id] = jpeg.tobytes()

    # WS push
    await push_status(session_id, {
        "status": "streaming",
        "detections": detections,
        "gps": state.GPS_DATA.get(session_id)
    })

    return {"ok": True}


# ===================== GPS =====================
@router.post("/gps")
async def drone_gps(
    session_id: str = Form(...),
    lat: float = Form(...),
    lng: float = Form(...)
):

    if session_id not in state.DRONE_SESSIONS:
        return JSONResponse(status_code=400, content={"error": "Invalid session"})

    state.GPS_DATA[session_id] = {
        "lat": lat,
        "lng": lng
    }

    # 🔥 IMPORTANT: send both formats
    await push_status(session_id, {
        "status": "gps",
        "gps": state.GPS_DATA[session_id],
        "lat": lat,
        "lng": lng
    })

    return {"ok": True}


# ===================== STOP =====================
@router.post("/stop/{session_id}")
async def stop_analysis(session_id: str):

    session = state.DRONE_SESSIONS.pop(session_id, None)

    if not session:
        return JSONResponse(status_code=404, content={"error": "Session not found"})

    result = session.summarize()

    state.GPS_DATA.pop(session_id, None)
    state.LAST_FRAMES.pop(session_id, None)

    await push_status(session_id, {"status": "stopped"})

    return result


# ===================== MJPEG =====================
@router.get("/mjpeg/{session_id}")
async def mjpeg_stream(session_id: str):

    async def gen():
        while True:
            frame = state.LAST_FRAMES.get(session_id)

            if frame:
                yield (
                    b"--frame\r\n"
                    b"Content-Type: image/jpeg\r\n\r\n" +
                    frame +
                    b"\r\n"
                )

            await asyncio.sleep(0.05)

    return StreamingResponse(
        gen(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )


# ===================== WEBSOCKET =====================
@router.websocket("/ws/{session_id}")
async def ws_endpoint(ws: WebSocket, session_id: str):

    await ws.accept()
    state.WS_CLIENTS[session_id] = ws

    try:
        while True:
            await ws.receive_text()

    except WebSocketDisconnect:
        state.WS_CLIENTS.pop(session_id, None)