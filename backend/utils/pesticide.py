def normalize(name):

    name = name.lower().strip()

    # Remove plant name like tomato___
    if "___" in name:
        name = name.split("___")[1]

    return name


DISEASE_TYPE = {

    "late_blight": "fungal",
    "leaf_mold": "fungal",
    "septoria_leaf_spot": "fungal"
}


PESTICIDE = {

    "fungal": {

        "pesticide": "Mancozeb 75% WP",

        "dose": {
            "LOW": 1.5,
            "MEDIUM": 2.0,
            "HIGH": 2.5
        },

        "interval": "7–10 days",

        "max_sprays": 3,

        "source": "ICAR"
    }
}


def get_pesticide_recommendation(disease, severity):

    disease = normalize(disease)

    dtype = DISEASE_TYPE.get(disease)

    if not dtype:
        return {
            "type": "healthy",
            "message": "No pesticide required"
        }

    rule = PESTICIDE[dtype]

    dose = rule["dose"][severity]

    return {

        "type": dtype,

        "pesticide": rule["pesticide"],

        "dose": f"{dose} g / litre",

        "interval": rule["interval"],

        "max_sprays": rule["max_sprays"],

        "source": rule["source"]
    }