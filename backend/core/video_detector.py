# ==============================
# VIDEO DETECTOR
# ==============================
# Pipeline:
#   1. Sample every Nth frame from the video
#   2. Run detect_image() on each sampled frame
#   3. Aggregate: disease votes, pixel counts, severity across frames
#   4. Compute final primary disease, severity, infected_percent
#   5. Clean up all temp files
# ==============================

import cv2
import uuid
import os
from collections import defaultdict
from core.detector import detect_image
from utils.pesticide import get_pesticide_recommendation

TEMP_DIR    = "temp"
FRAME_SKIP  = 5       # Process 1 out of every N frames
MIN_FRAMES  = 3       # Minimum frames needed for a reliable result

os.makedirs(TEMP_DIR, exist_ok=True)


# ==============================
# SEVERITY MERGE
# ==============================
SEVERITY_RANK = {"NONE": 0, "LOW": 1, "MEDIUM": 2, "HIGH": 3}
SEVERITY_LABEL = {0: "NONE", 1: "LOW", 2: "MEDIUM", 3: "HIGH"}


def _merge_severity(severities: list[str]) -> str:
    """
    Take the median severity across all frames — avoids single-frame outliers
    skewing the result. Falls back to max if fewer than MIN_FRAMES sampled.
    """
    if not severities:
        return "NONE"

    ranks = sorted([SEVERITY_RANK.get(s, 0) for s in severities])

    if len(ranks) < MIN_FRAMES:
        return SEVERITY_LABEL[max(ranks)]

    # Median
    mid = len(ranks) // 2
    return SEVERITY_LABEL[ranks[mid]]


def _calculate_severity_from_percent(percent: float) -> str:
    if percent > 40:
        return "HIGH"
    elif percent > 15:
        return "MEDIUM"
    elif percent > 1:
        return "LOW"
    return "NONE"


# ==============================
# MAIN VIDEO DETECTION
# ==============================
def detect_video(video_path: str, debug: bool = False) -> dict:
    """
    Runs disease detection across sampled frames of a video.

    Args:
        video_path: Path to the uploaded video file.
        debug:      If True, prints per-frame results.

    Returns:
        Aggregated result dict compatible with the image detection schema.
    """
    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        return _error_response("Cannot open video file.")

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps          = cap.get(cv2.CAP_PROP_FPS) or 25

    if debug:
        print(f"Video: {total_frames} frames @ {fps:.1f} fps")

    # --------------------------------------------------
    # Aggregation buckets
    # --------------------------------------------------
    disease_votes      = defaultdict(list)   # disease_name → [avg_confidence, ...]
    infected_percents  = []                  # per-frame infected_leaf_percent
    severity_per_frame = []                  # per-frame severity
    infected_regions_total = 0               # sum of infected contour regions
    frames_processed   = 0
    temp_paths         = []

    frame_idx = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        frame_idx += 1

        # Sample every FRAME_SKIP-th frame
        if frame_idx % FRAME_SKIP != 0:
            continue

        # Save frame to temp file
        temp_path = os.path.join(TEMP_DIR, f"vframe_{uuid.uuid4().hex}.jpg")
        temp_paths.append(temp_path)
        cv2.imwrite(temp_path, frame)

        try:
            result = detect_image(temp_path)
        except Exception as e:
            if debug:
                print(f"  [WARN] Frame {frame_idx} failed: {e}")
            continue
        finally:
            # Delete temp frame immediately after detection
            if os.path.exists(temp_path):
                os.remove(temp_path)
                temp_paths.remove(temp_path)

        frames_processed += 1

        # Skip healthy frames for vote counting but still record percent
        pct = result.get("infected_leaf_percent", 0.0)
        infected_percents.append(pct)
        severity_per_frame.append(result.get("severity", "NONE"))
        infected_regions_total += result.get("infected_regions", 0)

        if debug:
            print(
                f"  Frame {frame_idx:4d} | disease={result.get('primary_disease')} "
                f"| sev={result.get('severity')} | {pct}%"
            )

        # Collect disease votes from this frame
        for det in result.get("detections", []):
            disease_votes[det["disease"]].append(det["avg_confidence"])

    cap.release()

    # Clean up any remaining temp files (safety net)
    for p in temp_paths:
        if os.path.exists(p):
            os.remove(p)

    # --------------------------------------------------
    # No frames analyzed
    # --------------------------------------------------
    if frames_processed == 0:
        return _healthy_response("No processable frames found in video.")

    # --------------------------------------------------
    # No disease detected across all frames
    # --------------------------------------------------
    if not disease_votes:
        return _healthy_response("No disease detected across all video frames.")

    # --------------------------------------------------
    # Primary disease: highest average confidence across frames
    # --------------------------------------------------
    primary_disease = max(
        disease_votes.items(),
        key=lambda x: sum(x[1]) / len(x[1])
    )[0]

    # --------------------------------------------------
    # Infected percent: median across frames (robust to outliers)
    # --------------------------------------------------
    sorted_percents = sorted(infected_percents)
    mid = len(sorted_percents) // 2
    median_percent = round(sorted_percents[mid], 2)

    severity = _calculate_severity_from_percent(median_percent)

    # Average infected regions per frame
    avg_infected_regions = round(infected_regions_total / max(frames_processed, 1))

    severity_reason = (
        f"Analyzed {frames_processed} frames (1 per {FRAME_SKIP}). "
        f"Median infected area: {median_percent}% across sampled frames."
    )

    # --------------------------------------------------
    # All diseases breakdown
    # --------------------------------------------------
    total_votes = sum(len(v) for v in disease_votes.values())
    all_diseases = [
        {
            "name": name,
            "votes": len(confs),
            "avg_confidence": round(sum(confs) / len(confs), 2),
            "infected_area_percent": round(
                (len(confs) / total_votes) * median_percent, 2
            ),
        }
        for name, confs in sorted(
            disease_votes.items(),
            key=lambda x: sum(x[1]) / len(x[1]),
            reverse=True,
        )
    ]

    detections = [
        {
            "disease": d["name"],
            "votes": d["votes"],
            "avg_confidence": d["avg_confidence"],
        }
        for d in all_diseases
    ]

    recommendation = get_pesticide_recommendation(primary_disease, severity)

    return {
        "detections":             detections,
        "primary_disease":        primary_disease,
        "all_diseases":           all_diseases,
        "severity":               severity,
        "severity_reason":        severity_reason,
        "infected_leaf_percent":  median_percent,
        "infected_regions":       avg_infected_regions,
        "frames_analyzed":        frames_processed,
        "total_frames":           total_frames,
        "recommendation":         recommendation,
    }


# ==============================
# HELPERS
# ==============================
def _healthy_response(message: str) -> dict:
    return {
        "detections":            [],
        "primary_disease":       None,
        "all_diseases":          [],
        "severity":              "NONE",
        "severity_reason":       message,
        "infected_leaf_percent": 0.0,
        "infected_regions":      0,
        "frames_analyzed":       0,
        "total_frames":          0,
        "recommendation": {
            "type":    "healthy",
            "message": message,
        },
    }


def _error_response(message: str) -> dict:
    return {"error": message}