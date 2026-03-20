import os, uuid, shutil
from fastapi import APIRouter, UploadFile, File
from core.detector import detect_image

router = APIRouter(prefix="/detect")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "..", "uploads", "images")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/image")
async def detect_single_image(file: UploadFile = File(...)):

    path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}_{file.filename}")

    with open(path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    result = detect_image(path)

    os.remove(path)

    return result