from collections import defaultdict, deque
from utils.pesticide import get_pesticide_recommendation

CONF_TH = 0.32
FRAME_RATIO_TH = 0.02

class LiveSession:
    def __init__(self):
        self.total_frames = 0
        self.leaf_frames = 0
        self.stats = defaultdict(int)

    def update(self, detections):
        self.total_frames += 1

        unique = set()

        for d in detections:
            cls = d["class"]

            if cls in unique:
                continue

            unique.add(cls)

            if cls == "leaf":
                self.leaf_frames += 1

            else:
                self.stats[cls] += 1

    def summarize(self):

        if self.leaf_frames == 0:
            return {
                "primary_disease": None,
                "severity": "NONE",
                "message": "No leaf detected"
            }

        if not self.stats:
            return {
                "primary_disease": None,
                "severity": "NONE",
                "message": "Healthy leaf"
            }

        primary = max(self.stats, key=self.stats.get)

        ratio = self.stats[primary] / self.leaf_frames

        if ratio > 0.35:
            severity = "HIGH"
        elif ratio > 0.12:
            severity = "MEDIUM"
        else:
            severity = "LOW"

        return {
            "primary_disease": primary,
            "severity": severity,
            "infection_ratio": round(ratio * 100, 2),
            "recommendation": get_pesticide_recommendation(primary, severity)
        }