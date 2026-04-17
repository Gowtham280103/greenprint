# ─────────────────────────────────────────────
# Carbon Footprint Calculator
# All emission factors are in kg CO2 per unit
# Sources: EPA, IPCC, Our World in Data
# ─────────────────────────────────────────────

# kg CO2 per km
VEHICLE_FACTORS = {
    "car_petrol":   0.192,
    "car_diesel":   0.171,
    "car_electric": 0.053,
    "motorcycle":   0.114,
    "bus":          0.089,
    "train":        0.041,
    "bicycle":      0.0,
    "walking":      0.0,
}

# kg CO2 per kWh (global average grid)
ELECTRICITY_FACTOR = 0.475

# kg CO2 per day for diet type
DIET_FACTORS = {
    "vegan":        1.5,
    "vegetarian":   2.5,
    "pescatarian":  3.4,
    "omnivore":     5.0,
    "heavy_meat":   7.2,
}

# kg CO2 per shopping category per month
SHOPPING_FACTORS = {
    "minimal":   10.0,
    "moderate":  30.0,
    "frequent":  60.0,
    "excessive": 100.0,
}

# Global average for reference (kg CO2 per day)
GLOBAL_AVERAGE_DAILY = 13.0


def calculate_footprint(data: dict) -> dict:
    """
    Calculate daily carbon footprint from user inputs.
    Returns a breakdown dict with totals in kg CO2.
    """
    # --- Travel ---
    travel_km = float(data.get("travel_km", 0))
    vehicle = data.get("vehicle_type", "car_petrol")
    factor = VEHICLE_FACTORS.get(vehicle, VEHICLE_FACTORS["car_petrol"])
    travel_co2 = travel_km * factor

    # --- Electricity ---
    # Input is monthly kWh; convert to daily
    electricity_kwh_monthly = float(data.get("electricity_kwh", 0))
    electricity_co2 = (electricity_kwh_monthly / 30) * ELECTRICITY_FACTOR

    # --- Food ---
    diet = data.get("diet_type", "omnivore")
    food_co2 = DIET_FACTORS.get(diet, DIET_FACTORS["omnivore"])

    # --- Shopping ---
    # Input is monthly category; convert to daily
    shopping = data.get("shopping_habit", "moderate")
    shopping_co2 = SHOPPING_FACTORS.get(shopping, SHOPPING_FACTORS["moderate"]) / 30

    total = travel_co2 + electricity_co2 + food_co2 + shopping_co2

    return {
        "travel_co2":      round(travel_co2, 3),
        "electricity_co2": round(electricity_co2, 3),
        "food_co2":        round(food_co2, 3),
        "shopping_co2":    round(shopping_co2, 3),
        "total_co2":       round(total, 3),
        "global_average":  GLOBAL_AVERAGE_DAILY,
        "vs_average_pct":  round((total / GLOBAL_AVERAGE_DAILY) * 100, 1),
    }


def generate_suggestions(data: dict, result: dict) -> list:
    """
    Rule-based + AI-style personalised suggestions.
    Returns a list of suggestion strings ordered by impact.
    """
    suggestions = []
    travel_co2      = result["travel_co2"]
    electricity_co2 = result["electricity_co2"]
    food_co2        = result["food_co2"]
    shopping_co2    = result["shopping_co2"]
    total           = result["total_co2"]

    vehicle  = data.get("vehicle_type", "car_petrol")
    travel_km = float(data.get("travel_km", 0))
    diet     = data.get("diet_type", "omnivore")
    shopping = data.get("shopping_habit", "moderate")
    electricity_kwh = float(data.get("electricity_kwh", 0))

    # ── Travel suggestions ──────────────────────────────────────────────
    if vehicle in ("car_petrol", "car_diesel") and travel_km > 10:
        saving_2days = travel_co2 * (2 / 7)
        suggestions.append({
            "category": "travel",
            "icon": "🚌",
            "tip": f"Switch to public transport 2 days/week to save ~{saving_2days:.1f} kg CO₂/day on average.",
            "saving_kg": round(saving_2days, 2),
            "priority": "high" if travel_co2 > 3 else "medium",
        })

    if vehicle in ("car_petrol", "car_diesel") and travel_km <= 5:
        suggestions.append({
            "category": "travel",
            "icon": "🚲",
            "tip": f"Your {travel_km} km trip is perfect for cycling or walking — zero emissions!",
            "saving_kg": round(travel_co2, 2),
            "priority": "high",
        })

    if vehicle == "car_petrol":
        ev_saving = travel_km * (VEHICLE_FACTORS["car_petrol"] - VEHICLE_FACTORS["car_electric"])
        suggestions.append({
            "category": "travel",
            "icon": "⚡",
            "tip": f"Switching to an electric vehicle could save ~{ev_saving:.2f} kg CO₂ per day ({travel_km} km).",
            "saving_kg": round(ev_saving, 2),
            "priority": "medium",
        })

    if vehicle in ("car_petrol", "car_diesel", "motorcycle") and travel_km > 20:
        suggestions.append({
            "category": "travel",
            "icon": "🤝",
            "tip": "Carpooling with just one colleague halves your travel emissions instantly.",
            "saving_kg": round(travel_co2 * 0.5, 2),
            "priority": "medium",
        })

    # ── Electricity suggestions ──────────────────────────────────────────
    if electricity_kwh > 300:
        saving = (electricity_kwh - 250) / 30 * ELECTRICITY_FACTOR
        suggestions.append({
            "category": "electricity",
            "icon": "💡",
            "tip": f"Reducing monthly usage from {electricity_kwh:.0f} to 250 kWh saves ~{saving:.2f} kg CO₂/day. Start with LED bulbs and smart power strips.",
            "saving_kg": round(saving, 2),
            "priority": "high",
        })

    if electricity_kwh > 100:
        suggestions.append({
            "category": "electricity",
            "icon": "☀️",
            "tip": "Installing rooftop solar panels can offset 60–80% of your electricity emissions over time.",
            "saving_kg": round(electricity_co2 * 0.7, 2),
            "priority": "medium",
        })

    suggestions.append({
        "category": "electricity",
        "icon": "🌡️",
        "tip": "Setting your thermostat 1°C lower in winter saves ~5% on heating energy.",
        "saving_kg": round(electricity_co2 * 0.05, 2),
        "priority": "low",
    })

    # ── Food suggestions ─────────────────────────────────────────────────
    if diet == "heavy_meat":
        saving = DIET_FACTORS["heavy_meat"] - DIET_FACTORS["omnivore"]
        suggestions.append({
            "category": "food",
            "icon": "🥗",
            "tip": f"Cutting red meat to 3 times/week could save ~{saving:.1f} kg CO₂/day — that's {saving*365:.0f} kg/year!",
            "saving_kg": round(saving, 2),
            "priority": "high",
        })

    if diet in ("omnivore", "heavy_meat"):
        saving = food_co2 - DIET_FACTORS["vegetarian"]
        suggestions.append({
            "category": "food",
            "icon": "🌱",
            "tip": f"Going vegetarian saves ~{saving:.1f} kg CO₂/day. Try 'Meatless Mondays' as a first step.",
            "saving_kg": round(saving, 2),
            "priority": "medium",
        })

    if diet in ("omnivore", "heavy_meat", "pescatarian"):
        suggestions.append({
            "category": "food",
            "icon": "🛒",
            "tip": "Buying local and seasonal produce reduces food transport emissions by up to 11%.",
            "saving_kg": round(food_co2 * 0.11, 2),
            "priority": "low",
        })

    # ── Shopping suggestions ─────────────────────────────────────────────
    if shopping in ("frequent", "excessive"):
        saving = (SHOPPING_FACTORS[shopping] - SHOPPING_FACTORS["moderate"]) / 30
        suggestions.append({
            "category": "shopping",
            "icon": "♻️",
            "tip": f"Reducing to moderate shopping habits saves ~{saving:.2f} kg CO₂/day. Consider second-hand or repair first.",
            "saving_kg": round(saving, 2),
            "priority": "high" if shopping == "excessive" else "medium",
        })

    suggestions.append({
        "category": "shopping",
        "icon": "👕",
        "tip": "Buying one fewer new clothing item per month saves ~3 kg CO₂ on average.",
        "saving_kg": 3.0,
        "priority": "low",
    })

    # ── General tips ─────────────────────────────────────────────────────
    if total > GLOBAL_AVERAGE_DAILY:
        suggestions.append({
            "category": "general",
            "icon": "🌍",
            "tip": f"Your footprint is {result['vs_average_pct']}% of the global average. Small daily changes compound into big yearly savings.",
            "saving_kg": 0,
            "priority": "info",
        })

    # Sort: high → medium → low → info
    priority_order = {"high": 0, "medium": 1, "low": 2, "info": 3}
    suggestions.sort(key=lambda s: priority_order.get(s["priority"], 4))

    return suggestions


def compute_eco_score(total_co2: float) -> int:
    """
    Eco Score 0-100. Higher is better (lower footprint).
    100 = zero emissions, 0 = 2x global average or more.
    """
    GLOBAL_AVG = 13.0
    score = max(0, round(100 - (total_co2 / (GLOBAL_AVG * 2)) * 100))
    return score
