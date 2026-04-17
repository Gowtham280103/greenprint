"""
Simple JSON file-based storage for user entries.
Each entry is appended to data/history.json.
"""

import json
import os
from datetime import datetime, timedelta

DATA_DIR  = os.path.join(os.path.dirname(__file__), "data")
DATA_FILE = os.path.join(DATA_DIR, "history.json")


def _ensure_file():
    os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(DATA_FILE):
        with open(DATA_FILE, "w") as f:
            json.dump([], f)


def save_entry(entry: dict):
    _ensure_file()
    with open(DATA_FILE, "r") as f:
        records = json.load(f)
    records.append(entry)
    with open(DATA_FILE, "w") as f:
        json.dump(records, f, indent=2)


def get_history() -> list:
    _ensure_file()
    with open(DATA_FILE, "r") as f:
        return json.load(f)


def get_weekly_summary() -> dict:
    """
    Returns daily totals for the last 7 days.
    Days with no entry get a null value.
    """
    _ensure_file()
    with open(DATA_FILE, "r") as f:
        records = json.load(f)

    today = datetime.now().date()
    days  = [(today - timedelta(days=i)) for i in range(6, -1, -1)]

    # Group records by date (keep last entry per day)
    by_date = {}
    for rec in records:
        try:
            date_str = rec["timestamp"][:10]
            by_date[date_str] = rec["result"]["total_co2"]
        except (KeyError, TypeError):
            pass

    labels = [d.strftime("%a %d %b") for d in days]
    values = [by_date.get(str(d)) for d in days]

    return {"labels": labels, "values": values}
