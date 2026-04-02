# ==============================
# LIVE SESSION — ADVANCED
# ==============================
# Same aggregation logic as video pipeline.
# Extra: frame quality filtering + minimum vote threshold
# to prevent fake/random detections from polluting results.
# ==============================

from collections import defaultdict
from utils.pesticide import get_pesticide_recommendation

MIN_VOTE_THRESHOLD = 1     
MIN_AVG_CONFIDENCE = 0.40   

class LiveSessionAdvanced:
    def __init__(self):
        self.disease_votes          = defaultdict(list)  # disease → [confidence, ...]
        self.infected_percents      = []
        self.infected_regions_total = 0
        self.frames_processed       = 0
        self.frames_skipped_quality = 0

    # ==============================
    # UPDATE (called per frame)
    # ==============================
    def update(self, result: dict, frame_quality_ok: bool = True):
        """
        Feed one frame's detect_image() result into the session.

        Args:
            result:            Output from detect_image()
            frame_quality_ok:  False if frame was blurry/dark (still count
                               but don't add disease votes)
        """
        self.frames_processed += 1

        if not frame_quality_ok:
            self.frames_skipped_quality += 1
            return

        pct = result.get("infected_leaf_percent", 0.0)
        self.infected_percents.append(pct)
        self.infected_regions_total += result.get("infected_regions", 0)

        for det in result.get("detections", []):
            disease = det.get("disease") or det.get("class")
            conf    = det.get("avg_confidence", 0.0)

            # Normalize: backend returns 0–100, store as 0–1 internally
            if conf > 1.0:
                conf = conf / 100.0

            if disease and conf >= MIN_AVG_CONFIDENCE:
                self.disease_votes[disease].append(conf)

    # ==============================
    # SUMMARIZE (called on stop)
    # ==============================
    def summarize(self) -> dict:

        if self.frames_processed == 0:
            return self._healthy("No frames processed.")

        if not self.disease_votes:
            return self._healthy("No disease detected across all frames.")

        # --------------------------------------------------
        # Filter out diseases that didn't appear enough times
        # Prevents a single noisy frame from driving the result
        # --------------------------------------------------
        reliable_votes = {
            disease: confs
            for disease, confs in self.disease_votes.items()
            if len(confs) >= MIN_VOTE_THRESHOLD
              and (sum(confs) / len(confs)) >= MIN_AVG_CONFIDENCE
        }

        if not reliable_votes:
            return self._healthy(
                f"Detections found but below reliability threshold "
                f"(min {MIN_VOTE_THRESHOLD} frames, min {int(MIN_AVG_CONFIDENCE*100)}% confidence)."
            )

        # --------------------------------------------------
        # Primary disease — highest average confidence
        # --------------------------------------------------
        primary_disease = max(
            reliable_votes.items(),
            key=lambda x: sum(x[1]) / len(x[1])
        )[0]

        # --------------------------------------------------
        # Infected percent — median (robust to outlier frames)
        # --------------------------------------------------
        if self.infected_percents:
            sorted_p       = sorted(self.infected_percents)
            mid            = len(sorted_p) // 2
            median_percent = round(sorted_p[mid], 2)
        else:
            median_percent = 0.0

        # --------------------------------------------------
        # Severity
        # --------------------------------------------------
        severity = self._calc_severity(median_percent)

        avg_regions = round(
            self.infected_regions_total / max(self.frames_processed, 1)
        )

        quality_frames = self.frames_processed - self.frames_skipped_quality
        severity_reason = (
            f"Analyzed {quality_frames} quality frames out of "
            f"{self.frames_processed} total. "
            f"Median infected area: {median_percent}%. "
            f"Disease confirmed across ≥{MIN_VOTE_THRESHOLD} frames."
        )

        # --------------------------------------------------
        # All diseases breakdown (only reliable ones)
        # --------------------------------------------------
        total_votes  = sum(len(v) for v in reliable_votes.values())
        all_diseases = [
            {
                "name":                  name,
                "votes":                 len(confs),
                "avg_confidence":        round(sum(confs) / len(confs) * 100, 2),
                "infected_area_percent": round(
                    (len(confs) / total_votes) * median_percent, 2
                ) if total_votes else 0,
            }
            for name, confs in sorted(
                reliable_votes.items(),
                key=lambda x: sum(x[1]) / len(x[1]),
                reverse=True,
            )
        ]

        detections = [
            {
                "disease":        d["name"],
                "votes":          d["votes"],
                "avg_confidence": d["avg_confidence"],
            }
            for d in all_diseases
        ]

        recommendation = get_pesticide_recommendation(primary_disease, severity)

        overall_conf = round(
            sum(sum(v) for v in reliable_votes.values()) /
            max(1, sum(len(v) for v in reliable_votes.values())) * 100,
            2
        )

        return {
            "detections":             detections,
            "primary_disease":        primary_disease,
            "all_diseases":           all_diseases,
            "severity":               severity,
            "severity_reason":        severity_reason,
            "infected_leaf_percent":  median_percent,
            "infected_regions":       avg_regions,
            "frames_analyzed":        quality_frames,
            "frames_skipped":         self.frames_skipped_quality,
            "total_frames":           self.frames_processed,
            "avg_confidence":         overall_conf,
            "recommendation":         recommendation,
        }

    # ==============================
    # HELPERS
    # ==============================
    def _calc_severity(self, percent: float) -> str:
        if percent > 40:   return "HIGH"
        if percent > 15:   return "MEDIUM"
        if percent > 1:    return "LOW"
        return "NONE"

    def _healthy(self, message: str) -> dict:
        return {
            "detections":             [],
            "primary_disease":        None,
            "all_diseases":           [],
            "severity":               "NONE",
            "severity_reason":        message,
            "infected_leaf_percent":  0.0,
            "infected_regions":       0,
            "frames_analyzed":        self.frames_processed - self.frames_skipped_quality,
            "frames_skipped":         self.frames_skipped_quality,
            "total_frames":           self.frames_processed,
            "avg_confidence":         0.0,
            "recommendation": {
                "type":    "healthy",
                "message": message,
            },
        }