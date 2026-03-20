from fastapi import APIRouter, UploadFile, File, Form
from fastapi.responses import JSONResponse
import cv2, numpy as np, uuid

import state
from core.live_session import LiveSession
from core.detector import detect_image

router = APIRouter(prefix="/live", tags=["Live Webcam"])


@router.post("/start")
def start_live():
    session_id = str(uuid.uuid4())
    state.DRONE_SESSIONS[session_id] = LiveSession()
    return {"session_id": session_id}


@router.post("/frame")
async def live_frame(frame: UploadFile = File(...), session_id: str = Form(...)):

    session = state.DRONE_SESSIONS.get(session_id)

    if not session:
        return JSONResponse(status_code=400, content={"error": "Invalid session"})

    img = cv2.imdecode(
        np.frombuffer(await frame.read(), np.uint8),
        cv2.IMREAD_COLOR
    )

    temp_path = f"temp/live_{uuid.uuid4()}.jpg"
    cv2.imwrite(temp_path, img)

    result = detect_image(temp_path)

    detections = [{"class": "leaf", "conf": 1.0}]

    if result.get("primary_disease"):
        detections.append({
            "class": result["primary_disease"],
            "conf": 1.0
        })

    session.update(detections)

    return {"detections": detections}


@router.post("/stop/{session_id}")
def stop_live(session_id: str):

    session = state.DRONE_SESSIONS.pop(session_id, None)

    if not session:
        return JSONResponse(status_code=404, content={"error": "Session not found"})

    return session.summarize()