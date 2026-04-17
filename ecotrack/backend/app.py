from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import json
import os
from datetime import datetime
from calculator import calculate_footprint, generate_suggestions, compute_eco_score
from storage import save_entry, get_history, get_weekly_summary

FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend")

app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path="")
CORS(app)


@app.route("/api/calculate", methods=["POST"])
def calculate():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    result      = calculate_footprint(data)
    suggestions = generate_suggestions(data, result)
    eco_score   = compute_eco_score(result["total_co2"])

    entry = {
        "timestamp": datetime.now().isoformat(),
        "inputs":    data,
        "result":    result,
        "eco_score": eco_score,
    }
    save_entry(entry)

    return jsonify({
        "footprint":   result,
        "suggestions": suggestions,
        "eco_score":   eco_score,
    })


@app.route("/api/history", methods=["GET"])
def history():
    return jsonify(get_history())


@app.route("/api/weekly", methods=["GET"])
def weekly():
    return jsonify(get_weekly_summary())


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "version": "2.0"})


# ── Serve frontend ─────────────────────────────────────────
@app.route("/")
def index():
    return send_from_directory(FRONTEND_DIR, "index.html")

@app.route("/<path:filename>")
def static_files(filename):
    return send_from_directory(FRONTEND_DIR, filename)


if __name__ == "__main__":
    app.run(debug=True, port=5000)
