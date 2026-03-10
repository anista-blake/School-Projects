from flask import Blueprint, request, jsonify, current_app
from ..utils import current_user_id
import os
import requests
from flask_cors import cross_origin
from pymongo import MongoClient

api_bp = Blueprint("api", __name__, url_prefix="/api")

def favorites_entries():
    uri = current_app.config.get("MONGO_URI")
    client = MongoClient(uri, tz_aware=True)
    db_recipe = client["Recipes"]
    return db_recipe["Favorites"]

@api_bp.route("/recipe", methods=["GET"])
@cross_origin(origin="http://localhost:3000")
def api_recipes():
    diet = request.args.get("diet", "")
    time = request.args.get("maxReadyTime", "")
    mealType = request.args.get("type", "")  
    nutrient = request.args.get("nutrient", "")
    cycle = request.args.get("cycle", "")
    
    api_key = current_app.config.get("SPOONACULAR_KEY") or None
    if not api_key:
        api_key = os.environ.get("SPOONACULAR_KEY")
    if not api_key:
        return jsonify({"error": "Missing API key"}), 500
        
    url = f"https://api.spoonacular.com/recipes/complexSearch?number=12&addRecipeInformation=true&addRecipeNutrition=true&sort=random&apiKey={api_key}"
    
    if diet: url += f"&diet={diet}"
    if time: url += f"&maxReadyTime={time}"
    if mealType: url += f"&type={mealType}"

    # Nutrient thresholds logic
    nutrient_thresholds = {
        "protein": 15, "fiber": 8, "iron": 10, "magnesium": 60,
    }
    cycle_adjustments = {
        "menstrual": { "iron": 12, "magnesium": 80, "protein": 15 },
        "follicular": {},
        "ovulation": { "zinc": 10, "protein": 12 },
        "luteal": { "fiber": 8, "magnesium": 80 }
    }

    if cycle.lower() in cycle_adjustments:
        for key, val in cycle_adjustments[cycle.lower()].items():
            nutrient_thresholds[key] = val

    if nutrient.lower() in nutrient_thresholds:
        threshold = nutrient_thresholds[nutrient.lower()]
        url += f"&min{nutrient.capitalize()}={threshold}"

    try:
        r = requests.get(url)
        r.raise_for_status()
        data = r.json()
        return jsonify(data.get("results", []))
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@api_bp.route("/recipe/get-favorites", methods=["GET"])
def get_favorites():
    uid = current_user_id()
    if not uid:
        return jsonify({"error": "auth required"}), 401
    
    doc = favorites_entries().find_one(
        {"user_id": uid},
        {"_id": 0, "recipes": 1}
    )

    # === FIXED BUG  ===
    # If the user has no favorites yet, 'doc' will be None.
    # We must check for that before using .get()
    if doc is None:
        return jsonify([]) 
    # =======================

    return jsonify(doc.get("recipes", []))
    
@api_bp.route("/recipe/add-favorite", methods=["POST"])
def update_favorites():
    uid = current_user_id()
    if not uid:
        return jsonify({"error": "auth required"}), 401
    
    data = request.get_json(silent=True) or {}
    fav = data
    
    try:
        favorites_entries().update_one(
            {"user_id": uid},
            {"$addToSet": { "recipes": fav}},
            upsert=True
        )
        return jsonify({"ok": True}), 201
    except Exception as e:
        print("🔥 SERVER ERROR:", e)
        return jsonify({"error": str(e)}), 500
    
@api_bp.route("/recipe/remove-favorite", methods=["POST"])
def remove_favorite():
    uid = current_user_id()
    if not uid:
        return jsonify({"error": "auth required"}), 401

    data = request.get_json(silent=True) or {}
    fav = data

    try:
        favorites_entries().update_one(
            {"user_id": uid},
            {"$pull": {"recipes": {"id": fav["id"]}}}
        )
        return jsonify({"ok": True}), 201
    except Exception as e:
        print("🔥 SERVER ERROR:", e)
        return jsonify({"error": str(e)}), 500