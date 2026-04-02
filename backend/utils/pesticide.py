# ==============================
# NORMALIZE
# ==============================
def normalize(name: str) -> str:
    return "_".join(
        [
            part
            for part in name.lower()
            .replace("-", "_")
            .replace("___", "_")
            .strip()
            .split("_")
            if part
        ]
    )


# ==============================
# REMOVE PLANT NAME (SMART)
# ==============================
PLANTS = [
    "tomato", "rice", "wheat", "maize",
    "cotton", "grape", "apple", "mango",
    "groundnut", "bhindi"
]


def extract_disease(d: str) -> str:
    parts = d.split("_")

    # Remove plant names dynamically
    disease_parts = [p for p in parts if p not in PLANTS]

    if disease_parts:
        return "_".join(disease_parts)

    return d


# ==============================
# DISEASE → TYPE MAPPING
# (FOCUS ONLY ON DISEASE NAME)
# ==============================
DISEASE_TYPE = {
    # Fungal
    "early_blight": "fungal",
    "late_blight": "fungal",
    "leaf_blight": "fungal",
    "leaf_mold": "fungal",
    "powdery_mildew": "fungal",
    "septoria_leaf_spot": "fungal",
    "rust": "fungal",
    "anthracnose": "fungal",
    "brown_spot": "fungal",
    "blast": "fungal",
    "downy_mildew": "fungal",
    "leaf_spot": "fungal",
    "cercospora_leaf_spot": "fungal",

    # Bacterial
    "bacterial_blight": "bacterial",
    "bacterial_leaf_scorch": "bacterial",
    "fire_blight": "bacterial",
    "citrus_canker": "bacterial",
    "bacterial_wilt": "bacterial",
    "bacterial_spot": "bacterial",   

    # Viral
    "mosaic_virus": "viral",
    "leaf_curl_virus": "viral",
    "yellow_vein_mosaic": "viral",
    "streak_virus": "viral",
    "tungro_virus": "viral",
    "yellow_leaf_curl_virus": "viral"
}


# ==============================
# SMART MATCH FUNCTION
# ==============================
def get_disease_type(disease: str):
    d = normalize(disease)
    d = extract_disease(d)

    print(">>> DISEASE INPUT:", disease)
    print(">>> NORMALIZED:", normalize(disease))
    print(">>> EXTRACTED:", d)

    # Direct match
    if d in DISEASE_TYPE:
        return DISEASE_TYPE[d]

    # Smart match (order independent)
    for key in DISEASE_TYPE:
        if set(d.split("_")) == set(key.split("_")):
            return DISEASE_TYPE[key]

    return None


# ==============================
# PESTICIDE RULES
# ==============================
PESTICIDE = {
    "fungal": {
        "pesticide": "Mancozeb 75% WP",
        "dose": {
            "LOW":    1.5,
            "MEDIUM": 2.0,
            "HIGH":   2.5,
        },
        "unit": "g / litre",
        "interval": "7–10 days",
        "max_sprays": 3,
        "advisory": (
            "Spray in early morning or evening. Avoid spraying during rain. "
            "Rotate fungicides to prevent resistance."
        ),
        "source": "ICAR",
    },
    "bacterial": {
        "pesticide": "Copper Oxychloride 50% WP",
        "dose": {
            "LOW":    2.0,
            "MEDIUM": 2.5,
            "HIGH":   3.0,
        },
        "unit": "g / litre",
        "interval": "10–14 days",
        "max_sprays": 2,
        "advisory": (
            "Do not mix with alkaline pesticides. Wear protective gear during spraying."
        ),
        "source": "ICAR",
    },
    "viral": {
        "pesticide": None,
        "dose": None,
        "unit": None,
        "interval": None,
        "max_sprays": None,
        "advisory": (
            "No chemical pesticide is effective against viral diseases. "
            "Remove and destroy infected plants immediately. "
            "Control insect vectors (aphids, whiteflies) using "
            "Imidacloprid 17.8% SL (0.3 ml/L). "
            "Maintain field hygiene."
        ),
        "source": "ICAR",
    },
}


# ==============================
# MAIN FUNCTION
# ==============================
def get_pesticide_recommendation(disease: str, severity: str) -> dict:

    dtype = get_disease_type(disease)

    print(">>> TYPE:", dtype)

    # Unknown disease
    if not dtype:
        return {
            "type": "unknown",
            "message": f"Disease '{disease}' detected but no pesticide data available.",
        }

    rule = PESTICIDE[dtype]

    # Viral case
    if dtype == "viral":
        return {
            "type": "viral",
            "pesticide": None,
            "dose": None,
            "interval": None,
            "max_sprays": None,
            "advisory": rule["advisory"],
            "source": rule["source"],
        }

    # Dose calculation
    dose_value = rule["dose"].get(severity, rule["dose"]["MEDIUM"])

    return {
        "type": dtype,
        "pesticide": rule["pesticide"],
        "dose": f"{dose_value} {rule['unit']}",
        "dose_value": dose_value,
        "dose_unit": rule["unit"],
        "interval": rule["interval"],
        "max_sprays": rule["max_sprays"],
        "advisory": rule["advisory"],
        "source": rule["source"],
    }