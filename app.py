import requests
from flask import Flask, render_template, jsonify

app = Flask(__name__, static_folder='static', template_folder='templates')

# Channel A (Temp, Humidity, Moisture)
CHANNEL_A_ID   = 3376341
READ_API_KEY_A = "7J1331JJXUSAF2QV"
URL_A = (
    f"https://api.thingspeak.com/channels/{CHANNEL_A_ID}/feeds.json"
    f"?api_key={READ_API_KEY_A}&results=1"
)

# Channel B (pH, EC, N, P, K)
CHANNEL_B_ID   = 2966571
READ_API_KEY_B = "V7S0QDPMIPXN7WWT"
URL_B = (
    f"https://api.thingspeak.com/channels/{CHANNEL_B_ID}/feeds.json"
    f"?api_key={READ_API_KEY_B}&results=1"
)

CROP_DATA = {
    "rice":       {"title": "Rice",       "icon": "🌾", "tips": ["Maintain N: 80–100 mg/kg", "Target pH: 6.0–7.0", "Keep humidity at 70–80%"]},
    "wheat":      {"title": "Wheat",      "icon": "🌿", "tips": ["Reduce soil moisture", "Add potassium (K) fertilizer", "Target pH: 6.0–7.5"]},
    "maize":      {"title": "Maize",      "icon": "🌽", "tips": ["Apply balanced NPK", "Keep humidity at 60–70%", "Target pH: 6.0–7.0"]},
    "chickpea":   {"title": "Chickpea",   "icon": "🫘", "tips": ["Keep soil relatively dry", "Increase phosphorus (P)", "Target pH: 7.0–8.0"]},
    "papaya":     {"title": "Papaya",     "icon": "🍈", "tips": ["Add organic compost", "Apply balanced NPK", "Target pH: 6.0–6.5"]},
    "cotton":     {"title": "Cotton",     "icon": "☁️", "tips": ["Deep soil required", "High Potassium (K)", "Target pH: 5.5–7.5"]},
    "coffee":     {"title": "Coffee",     "icon": "☕", "tips": ["High humidity needed", "Acidic soil preferred", "Target pH: 5.0–6.0"]},
    "potato":     {"title": "Potato",     "icon": "🥔", "tips": ["Loose, loamy soil", "High potassium needed", "Target pH: 4.8–6.5"]},
    "tomato":     {"title": "Tomato",     "icon": "🍅", "tips": ["Needs calcium supplement", "Even watering essential", "Target pH: 6.0–6.8"]},
    "banana":     {"title": "Banana",     "icon": "🍌", "tips": ["Very high nitrogen needed", "Stable moisture required", "Target pH: 5.5–7.5"]},
    "mango":      {"title": "Mango",      "icon": "🥭", "tips": ["Well-drained soil needed", "Dry period for flowering", "Target pH: 5.5–7.0"]},
    "grapes":     {"title": "Grapes",     "icon": "🍇", "tips": ["Good drainage essential", "Pruning is key", "Target pH: 6.5–7.5"]},
    "watermelon": {"title": "Watermelon", "icon": "🍉", "tips": ["Sandy soil preferred", "High temp (>25°C) needed", "Target pH: 6.0–7.0"]},
    "onion":      {"title": "Onion",      "icon": "🧅", "tips": ["Nitrogen in early stage", "Low moisture at late stage", "Target pH: 6.0–7.0"]},
}

FALLBACK_SOIL = {"N":64,"P":69,"K":109,"Temp":29.3,"Humidity":32.7,"pH":7.45,"EC":1.1,"Moisture":327}

def fetch_latest(url):
    r = requests.get(url, timeout=5)
    r.raise_for_status()
    return r.json()["feeds"][0]

def field(latest, key, fallback=0.0):
    val = latest.get(key)
    try: return round(float(val), 2) if val not in (None, "") else fallback
    except: return fallback

def fetch_latest_soil():
    try:
        latest_a = fetch_latest(URL_A)
        latest_b = fetch_latest(URL_B)

        return {
            # Channel A
            "Temp":     field(latest_a, "field1"),
            "Humidity": field(latest_a, "field2"),
            "Moisture": field(latest_a, "field3"),

            # Channel B
            "pH": field(latest_b, "field3"),
            "EC": field(latest_b, "field4"),
            "N":  field(latest_b, "field5"),
            "P":  field(latest_b, "field6"),
            "K":  field(latest_b, "field7"),
        }
    except Exception as e:
        print(f"ThingSpeak error: {e}")
        return FALLBACK_SOIL.copy()

def get_suggestion(soil):
    n, ph = soil["N"], soil["pH"]
    if n > 85 and 6.0 <= ph <= 7.0:   return {"name":"Rice",     "icon":"🌾"}
    elif ph < 5.8:                      return {"name":"Coffee",   "icon":"☕"}
    elif ph > 7.5:                      return {"name":"Chickpea", "icon":"🫘"}
    elif n < 40 and 6.0 <= ph <= 7.0:  return {"name":"Onion",    "icon":"🧅"}
    elif n > 50 and 6.0 <= ph <= 7.0:  return {"name":"Maize",    "icon":"🌽"}
    elif 6.0 <= ph <= 7.5:             return {"name":"Wheat",    "icon":"🌿"}
    else:                               return {"name":"Papaya",   "icon":"🍈"}

@app.route("/")
def index():
    soil       = fetch_latest_soil()
    suggestion = get_suggestion(soil)
    crop_icons = {k: v["icon"] for k, v in CROP_DATA.items()}
    return render_template("index.html",
        crops=list(CROP_DATA.keys()), crop_icons=crop_icons,
        soil=soil, suggestion=suggestion)

@app.route("/get_soil")
def get_soil_json():
    soil = fetch_latest_soil()
    return jsonify({"soil": soil, "suggestion": get_suggestion(soil)})

@app.route("/crop/<crop>")
def recommend_crop(crop):
    data = CROP_DATA.get(crop.lower())
    if data: return jsonify({"title": data["title"], "tips": data["tips"]})
    return jsonify({"title": crop.capitalize(), "tips": ["Soil is optimal for this crop."]})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080, debug=True)
