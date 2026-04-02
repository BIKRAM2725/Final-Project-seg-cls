# ==============================
# IMPORTS
# ==============================
import cv2
import numpy as np
import os
import torch
from ultralytics import YOLO
from collections import defaultdict
from torchvision.ops import nms
from utils.pesticide import get_pesticide_recommendation

# ==============================
# MODELS (LAZY LOADED)
# ==============================
seg_model = None
cls_model = None

SEG_CONF          = 0.50
CLS_CONF          = 0.55
NMS_IOU_THRESHOLD = 0.40
MIN_CONTOUR_AREA  = 40
CROP_PAD          = 10
CROP_SIZE         = 224


def get_seg_model():
    global seg_model
    if seg_model is None:
        seg_model = YOLO("model/seg_best.pt")
    return seg_model


def get_cls_model():
    global cls_model
    if cls_model is None:
        cls_model = YOLO("model/cls_best.pt")
    return cls_model


def preprocess(img: np.ndarray) -> np.ndarray:
    """CLAHE contrast normalization in LAB space."""
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l = clahe.apply(l)
    return cv2.cvtColor(cv2.merge([l, a, b]), cv2.COLOR_LAB2BGR)


def calculate_severity(percent: float) -> str:
    if percent > 40:
        return "HIGH"
    elif percent > 15:
        return "MEDIUM"
    elif percent > 1:
        return "LOW"
    return "NONE"


def _healthy_response(message: str = "No disease detected. Crop looks healthy.") -> dict:
    return {
        "detections": [],
        "severity": "NONE",
        "severity_reason": message,
        "primary_disease": None,
        "infected_leaf_percent": 0.0,
        "infected_regions": 0,
        "overlay_image": None,
        "recommendation": {
            "type": "healthy",
            "message": message
        }
    }


def detect_image(image_path: str, debug: bool = False) -> dict:

    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Could not read image: {image_path}")

    h_img, w_img = img.shape[:2]

    seg = get_seg_model()
    cls = get_cls_model()

    img_proc = preprocess(img)
    result   = seg(img_proc, conf=SEG_CONF, verbose=False)[0]

    if result.masks is None:
        return _healthy_response()

    masks       = result.masks.data.cpu().numpy()
    classes     = result.boxes.cls.cpu().numpy()
    confidences = result.boxes.conf.cpu().numpy()

    if debug:
        print("=== RAW SEGMENTATION DETECTIONS ===")
        for i in range(len(classes)):
            print(f"  {seg.names[int(classes[i])]:<20} conf={confidences[i]:.4f}")

    # NMS
    boxes_t  = result.boxes.xyxy
    scores_t = result.boxes.conf
    keep     = nms(boxes_t, scores_t, iou_threshold=NMS_IOU_THRESHOLD).cpu().numpy()

    masks       = masks[keep]
    classes     = classes[keep]
    confidences = confidences[keep]

    # STAGE 1: pixel counts
    leaf_pixels    = 0
    disease_pixels = 0
    disease_masks  = []

    for i, mask in enumerate(masks):
        class_name = seg.names[int(classes[i])].lower()
        pixels     = int(np.sum(mask > 0.5))

        if class_name == "leaf":
            leaf_pixels += pixels
        elif class_name == "disease":
            disease_pixels += pixels
            disease_masks.append((mask, confidences[i]))

    if not disease_masks:
        return _healthy_response(message="Leaf detected but no disease found.")

    # STAGE 2: classify + count regions
    disease_votes    = defaultdict(list)
    infected_regions = 0
    debug_crops      = []
    overlay_img      = img.copy()

    for mask, seg_conf in disease_masks:
        mask_uint    = (mask * 255).astype("uint8")
        mask_resized = cv2.resize(mask_uint, (w_img, h_img))

        contours, _ = cv2.findContours(
            mask_resized, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
        )

        for cnt in contours:
            if cv2.contourArea(cnt) < MIN_CONTOUR_AREA:
                continue

            infected_regions += 1   # count every valid disease contour

            x, y, bw, bh = cv2.boundingRect(cnt)
            cv2.rectangle(overlay_img, (x, y), (x + bw, y + bh), (0, 0, 255), 2)

            y1 = max(0, y - CROP_PAD)
            y2 = min(h_img, y + bh + CROP_PAD)
            x1 = max(0, x - CROP_PAD)
            x2 = min(w_img, x + bw + CROP_PAD)

            crop = img[y1:y2, x1:x2]
            if crop.size == 0:
                continue

            crop_resized = cv2.resize(crop, (CROP_SIZE, CROP_SIZE))

            if debug:
                crop_path = f"debug_crop_{len(debug_crops)}.jpg"
                cv2.imwrite(crop_path, crop_resized)
                debug_crops.append(crop_path)

            try:
                cls_result = cls(crop_resized, verbose=False)[0]
            except Exception as e:
                if debug:
                    print(f"  [WARN] Classifier failed on crop: {e}")
                continue

            if cls_result.probs is None:
                continue

            top1_conf = float(cls_result.probs.top1conf)

            if top1_conf < CLS_CONF:
                if debug:
                    rejected = cls.names[cls_result.probs.top1].lower()
                    print(f"  [SKIP] '{rejected}' conf={top1_conf:.4f} < {CLS_CONF}")
                continue

            disease_name = cls.names[cls_result.probs.top1].lower()
            disease_votes[disease_name].append(top1_conf)

            if debug:
                print(f"  [ACCEPT] '{disease_name}' conf={top1_conf:.4f}")

    if not disease_votes:
        return _healthy_response(
            message="Disease regions found but classification confidence too low."
        )

    primary_disease = max(
        disease_votes.items(),
        key=lambda x: sum(x[1]) / len(x[1])
    )[0]

    severity_ratio   = disease_pixels / max(leaf_pixels, 1)
    infected_percent = min(round(severity_ratio * 100, 2), 100.0)
    severity         = calculate_severity(infected_percent)

    severity_reason = (
        f"{disease_pixels:,} disease pixels out of {max(leaf_pixels, 1):,} leaf pixels "
        f"({infected_percent}% of leaf area infected)"
    )

    recommendation = get_pesticide_recommendation(primary_disease, severity)

    base, ext    = os.path.splitext(image_path)
    overlay_path = f"{base}_overlay{ext}"
    cv2.imwrite(overlay_path, overlay_img)

    detections = [
        {
            "disease": name,
            "votes": len(confs),
            "avg_confidence": round(sum(confs) / len(confs) * 100, 2)
        }
        for name, confs in disease_votes.items()
    ]

    result_dict = {
        "detections":            detections,
        "infected_leaf_percent": infected_percent,
        "infected_regions":      infected_regions,
        "severity":              severity,
        "severity_reason":       severity_reason,
        "primary_disease":       primary_disease,
        "overlay_image":         overlay_path,
        "recommendation":        recommendation,
    }

    if debug:
        result_dict["debug_crops"] = debug_crops

    return result_dict