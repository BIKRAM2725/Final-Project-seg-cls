import cv2
import numpy as np
import os
from ultralytics import YOLO
from collections import Counter
from utils.pesticide import get_pesticide_recommendation

seg_model = YOLO("model/seg_best.pt")
cls_model = YOLO("model/cls_best.pt")

CONF = 0.30


def calculate_severity(percent):

    if percent > 40:
        return "HIGH"
    elif percent > 15:
        return "MEDIUM"
    elif percent > 1:
        return "LOW"

    return "NONE"


def detect_image(image_path):

    img = cv2.imread(image_path)

    if img is None:
        raise ValueError("Invalid image")

    result = seg_model(img, conf=CONF, verbose=False)[0]

    if result.masks is None:
        return {
            "detections": [],
            "severity": "NONE",
            "primary_disease": None,
            "infected_leaf_percent": 0,
            "recommendation": {
                "type": "healthy",
                "message": "No disease detected"
            }
        }

    masks = result.masks.data.cpu().numpy()
    classes = result.boxes.cls.cpu().numpy()

    leaf_pixels = 0
    disease_pixels = 0
    disease_predictions = []
    debug_crops = []

    for i, mask in enumerate(masks):

        class_name = seg_model.names[int(classes[i])].lower()

        pixels = int(np.sum(mask > 0.5))

        if class_name == "leaf":
            leaf_pixels += pixels

        elif class_name == "disease":

            disease_pixels += pixels

            mask_uint = (mask * 255).astype("uint8")

            contours, _ = cv2.findContours(
                mask_uint,
                cv2.RETR_EXTERNAL,
                cv2.CHAIN_APPROX_SIMPLE
            )

            for cnt in contours:

                if cv2.contourArea(cnt) < 40:
                    continue

                x, y, w, h = cv2.boundingRect(cnt)

                # Draw detection box
                cv2.rectangle(img, (x,y), (x+w,y+h), (0,0,255), 2)

                # Add padding for better crop
                pad = 10
                y1 = max(0, y-pad)
                y2 = y+h+pad
                x1 = max(0, x-pad)
                x2 = x+w+pad

                crop = img[y1:y2, x1:x2]

                if crop.size == 0:
                    continue

                crop = cv2.resize(crop, (224, 224))

                # Save crop image for debugging
                crop_path = f"debug_crop_{len(debug_crops)}.jpg"
                cv2.imwrite(crop_path, crop)
                debug_crops.append(crop_path)

                try:
                    res = cls_model(crop, verbose=False)[0]
                except:
                    continue

                if res.probs is None:
                    continue

                label = res.probs.top1
                disease = cls_model.names[label].lower()

                disease_predictions.append(disease)

    if not disease_predictions:
        return {
            "detections": [],
            "severity": "NONE",
            "primary_disease": None,
            "infected_leaf_percent": 0,
            "recommendation": {
                "type": "healthy",
                "message": "No disease detected"
            }
        }

    severity_ratio = disease_pixels / max(leaf_pixels, 1)

    # FIX infection >100% bug
    infected_percent = min(round(severity_ratio * 100, 2), 100)

    severity = calculate_severity(infected_percent)

    primary_disease = Counter(disease_predictions).most_common(1)[0][0]

    recommendation = get_pesticide_recommendation(primary_disease, severity)

    base, ext = os.path.splitext(image_path)
    overlay_path = f"{base}_overlay{ext}"

    cv2.imwrite(overlay_path, img)

    return {
        "detections": disease_predictions,
        "infected_leaf_percent": infected_percent,
        "severity": severity,
        "primary_disease": primary_disease,
        "overlay_image": overlay_path,
        "debug_crops": debug_crops,
        "recommendation": recommendation
    }