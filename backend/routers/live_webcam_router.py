from fastapi import APIRouter, UploadFile, File, Form
from fastapi.responses import JSONResponse
import cv2, numpy as np, uuid, os

import state
from core.live_session_advanced import LiveSessionAdvanced as LiveSession
from core.detector import detect_image

router = APIRouter(prefix="/live", tags=["Live Webcam"])

TEMP_DIR = "temp/live_frames"
os.makedirs(TEMP_DIR, exist_ok=True)

# 🔥 RELAXED SETTINGS (IMPORTANT)
MIN_SHARP_VAR = 40.0   # was 80 → too strict
MAX_DARK_MEAN = 20.0   # allow slightly darker frames


# ==============================
# FRAME QUALITY CHECK (RELAXED)
# ==============================
def _is_usable_frame(img: np.ndarray) -> bool:
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    sharpness = cv2.Laplacian(gray, cv2.CV_64F).var()
    brightness = gray.mean()

    # Debug (optional)
    # print(f"Sharpness: {sharpness:.2f}, Brightness: {brightness:.2f}")

    if sharpness < MIN_SHARP_VAR:
        return False

    if brightness < MAX_DARK_MEAN:
        return False

    return True


# ==============================
# START SESSION
# ==============================
@router.post("/start")
def start_live():
    session_id = str(uuid.uuid4())
    state.DRONE_SESSIONS[session_id] = LiveSession()
    return {"session_id": session_id}


# ==============================
# PROCESS FRAME
# ==============================
@router.post("/frame")
async def live_frame(
    frame: UploadFile = File(...),
    session_id: str = Form(...)
):
    session = state.DRONE_SESSIONS.get(session_id)

    if not session:
        return JSONResponse(
            status_code=400,
            content={"error": "Invalid or expired session."}
        )

    temp_path = None

    try:
        # Decode image
        img_bytes = await frame.read()
        img = cv2.imdecode(
            np.frombuffer(img_bytes, np.uint8),
            cv2.IMREAD_COLOR
        )

        if img is None:
            return JSONResponse(
                status_code=400,
                content={"error": "Invalid image frame"}
            )

        # ==============================
        # 🔥 IMPORTANT CHANGE
        # DO NOT SKIP FRAME COMPLETELY
        # ==============================
        quality_ok = _is_usable_frame(img)

        # Save frame
        temp_path = os.path.join(TEMP_DIR, f"{uuid.uuid4().hex}.jpg")
        cv2.imwrite(temp_path, img)

        try:
            result = detect_image(temp_path)
        finally:
            if temp_path and os.path.exists(temp_path):
                os.remove(temp_path)

        # Update session
        session.update(result, frame_quality_ok=quality_ok)

        # ==============================
        # RETURN LIVE RESULT
        # ==============================
        return JSONResponse(content={
            "primary_disease": result.get("primary_disease"),
            "detections": result.get("detections", []),
            "severity": result.get("severity", "NONE"),
            "quality": "ok" if quality_ok else "low",
        })

    except Exception as e:
        print("[LIVE ERROR]", e)
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )


# ==============================
# STOP SESSION
# ==============================
@router.post("/stop/{session_id}")
def stop_live(session_id: str):

    session = state.DRONE_SESSIONS.pop(session_id, None)

    if not session:
        return JSONResponse(
            status_code=404,
            content={"error": "Session not found"}
        )

    return JSONResponse(content=session.summarize())