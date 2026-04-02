# from fastapi import APIRouter, UploadFile, File, HTTPException
# from fastapi.responses import JSONResponse
# import uuid, os, shutil, asyncio
# from core.video_detector import detect_video

# router = APIRouter(prefix="/detect", tags=["Video Detection"])

# VIDEO_DIR = "uploads/videos"
# os.makedirs(VIDEO_DIR, exist_ok=True)

# ALLOWED_TYPES = {
#     "video/mp4",
#     "video/quicktime",
#     "video/x-msvideo",
#     "video/webm",
#     "video/x-matroska",
# }

# MAX_SIZE_MB = 200


# @router.post("/video")
# async def detect_video_api(file: UploadFile = File(...)):

#     # Validate type
#     if file.content_type not in ALLOWED_TYPES:
#         raise HTTPException(
#             status_code=400,
#             detail=f"Unsupported file type: {file.content_type}. Use MP4, MOV, AVI, or WEBM.",
#         )

#     ext      = os.path.splitext(file.filename)[-1].lower() or ".mp4"
#     filename = f"{uuid.uuid4().hex}{ext}"
#     path     = os.path.join(VIDEO_DIR, filename)

#     try:
#         # Stream to disk — avoids loading large video into memory
#         with open(path, "wb") as buffer:
#             shutil.copyfileobj(file.file, buffer)

#         # Size guard
#         size_mb = os.path.getsize(path) / (1024 * 1024)
#         if size_mb > MAX_SIZE_MB:
#             raise HTTPException(
#                 status_code=413,
#                 detail=f"Video too large ({size_mb:.1f} MB). Maximum is {MAX_SIZE_MB} MB.",
#             )

#         # Run detection in a thread (CPU-bound)
#         result = await asyncio.to_thread(detect_video, path)

#         if "error" in result:
#             raise HTTPException(status_code=422, detail=result["error"])

#         return JSONResponse(content=result)

#     except HTTPException:
#         raise

#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

#     finally:
#         # Always delete the uploaded video — nothing persists on disk
#         if os.path.exists(path):
#             os.remove(path)



from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import uuid, os, shutil, asyncio
from core.video_detector import detect_video

router = APIRouter(prefix="/detect", tags=["Video Detection"])

VIDEO_DIR = "uploads/videos"
os.makedirs(VIDEO_DIR, exist_ok=True)

ALLOWED_TYPES = {
    "video/mp4",
    "video/quicktime",
    "video/x-msvideo",
    "video/webm",
    "video/x-matroska",
}

ALLOWED_EXTENSIONS = {".mp4", ".mov", ".avi", ".webm", ".mkv"}
MAX_SIZE_MB        = 200


@router.post("/video")
async def detect_video_api(file: UploadFile = File(...)):

    # ── Validate MIME type ────────────────────────────────
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Unsupported file type: {file.content_type}. "
                "Accepted formats: MP4, MOV, AVI, WEBM."
            ),
        )

    # ── Validate extension (defense-in-depth) ────────────
    ext = os.path.splitext(file.filename or "")[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        ext = ".mp4"   # safe fallback for missing/unknown extension

    filename = f"{uuid.uuid4().hex}{ext}"
    path     = os.path.join(VIDEO_DIR, filename)

    try:
        # ── Stream to disk — avoids large in-memory buffer ──
        with open(path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # ── Size guard (post-write) ───────────────────────
        size_mb = os.path.getsize(path) / (1024 * 1024)
        if size_mb > MAX_SIZE_MB:
            raise HTTPException(
                status_code=413,
                detail=(
                    f"Video too large ({size_mb:.1f} MB). "
                    f"Maximum allowed size is {MAX_SIZE_MB} MB."
                ),
            )

        # ── Run detection in thread pool (CPU-bound) ──────
        # detect_video() handles its own internal cleanup (frames + video).
        # The outer finally below is a safety net only.
        result = await asyncio.to_thread(detect_video, path)

        if "error" in result:
            raise HTTPException(status_code=422, detail=result["error"])

        return JSONResponse(content=result)

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        # Safety net — detect_video() deletes this itself,
        # but if it crashed before reaching its own cleanup, we catch it here.
        if os.path.exists(path):
            try:
                os.remove(path)
            except Exception:
                pass