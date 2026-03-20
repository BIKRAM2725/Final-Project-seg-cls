from fastapi import APIRouter, UploadFile, File
import uuid, os, shutil, asyncio
from core.video_detector import detect_video

router = APIRouter(prefix="/detect", tags=["Video Detection"])

VIDEO_DIR = "uploads/videos"
os.makedirs(VIDEO_DIR, exist_ok=True)

@router.post("/video")
async def detect_video_api(file: UploadFile = File(...)):

    path = os.path.join(VIDEO_DIR, f"{uuid.uuid4()}_{file.filename}")

    try:
        with open(path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        result = await asyncio.to_thread(detect_video, path)
        return result

    finally:
        if os.path.exists(path):
            os.remove(path)