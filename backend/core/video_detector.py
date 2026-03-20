import cv2
import uuid
import os
from core.detector import detect_image

TEMP_DIR = "temp"
os.makedirs(TEMP_DIR, exist_ok=True)

def detect_video(video_path):

    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        return {"error": "Cannot open video"}

    disease_counts = {}
    frames = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        frames += 1

        # 🔥 better sampling
        if frames % 5 != 0:
            continue

        temp_path = os.path.join(TEMP_DIR, f"frame_{uuid.uuid4()}.jpg")
        cv2.imwrite(temp_path, frame)

        result = detect_image(temp_path)

        # cleanup temp
        if os.path.exists(temp_path):
            os.remove(temp_path)

        disease = result.get("primary_disease")

        if disease:
            disease_counts[disease] = disease_counts.get(disease, 0) + 1

    cap.release()

    if not disease_counts:
        return {
            "primary_disease": None,
            "severity": "NONE"
        }

    primary = max(disease_counts, key=disease_counts.get)

    return {
        "primary_disease": primary,
        "confidence": disease_counts[primary]
    }