import os
import uuid
import shutil
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from core.detector import detect_image

router = APIRouter(prefix="/detect")

BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "..", "uploads", "images")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/jpg", "image/webp"}


@router.post("/image")
async def detect_single_image(file: UploadFile = File(...)):

    # Validate file type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}. Use JPG, PNG, or WEBP."
        )

    # Save uploaded file with unique name
    ext       = os.path.splitext(file.filename)[-1].lower() or ".jpg"
    unique_id = uuid.uuid4().hex
    filename  = f"{unique_id}{ext}"
    path      = os.path.join(UPLOAD_DIR, filename)

    try:
        with open(path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Run detection
        result = detect_image(path)

    except Exception as e:
        # Clean up on error
        if os.path.exists(path):
            os.remove(path)
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        # Always delete the original uploaded file
        if os.path.exists(path):
            os.remove(path)

    # -------------------------------------------------------
    # Clean up server-side image files after reading them
    # (overlay + leaf_clean are saved during detection)
    # We read them into base64 and delete them, so nothing
    # persists on the server beyond this request.
    # -------------------------------------------------------
    import base64

    def read_and_delete(img_path: str) -> str | None:
        """Read an image file as base64 string, then delete it."""
        if not img_path or not os.path.exists(img_path):
            return None
        with open(img_path, "rb") as f:
            data = base64.b64encode(f.read()).decode("utf-8")
        os.remove(img_path)
        return data

    overlay_b64    = read_and_delete(result.get("overlay_image"))
    leaf_clean_b64 = read_and_delete(result.get("leaf_clean_image"))

    # Replace file paths with base64 strings (or None)
    result["overlay_image"]    = overlay_b64
    result["leaf_clean_image"] = leaf_clean_b64

    return JSONResponse(content=result)