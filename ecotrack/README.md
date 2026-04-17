# 🌿 EcoTrack AI — Carbon Footprint Tracker

A full-stack web app that helps users track and reduce their daily carbon footprint using rule-based AI suggestions and interactive charts.

---

## 📁 File Structure

```
ecotrack/
├── backend/
│   ├── app.py           # Flask API server
│   ├── calculator.py    # Carbon footprint logic + AI suggestions
│   ├── storage.py       # JSON file-based persistence
│   ├── requirements.txt
│   └── data/
│       └── history.json # Auto-created on first run
│
└── frontend/
    ├── index.html       # Main UI
    ├── style.css        # Styles
    └── app.js           # Frontend logic + Chart.js
```

---

## 🚀 Quick Start

### 1. Install Python dependencies

```bash
cd ecotrack/backend
pip install -r requirements.txt
```

### 2. Start the backend

```bash
python app.py
```

The API will be available at `http://localhost:5000`.

### 3. Open the frontend

Open `ecotrack/frontend/index.html` directly in your browser.

> **Tip:** If you see CORS errors, use a simple local server instead:
> ```bash
> cd ecotrack/frontend
> python -m http.server 8080
> ```
> Then visit `http://localhost:8080`.

---

## 🔌 API Endpoints

| Method | Endpoint         | Description                          |
|--------|------------------|--------------------------------------|
| POST   | `/api/calculate` | Calculate footprint + get suggestions|
| GET    | `/api/history`   | Retrieve all saved entries           |
| GET    | `/api/weekly`    | Get last 7 days summary for chart    |
| GET    | `/api/health`    | Health check                         |

### POST `/api/calculate` — Request body

```json
{
  "travel_km": 20,
  "vehicle_type": "car_petrol",
  "electricity_kwh": 250,
  "diet_type": "omnivore",
  "shopping_habit": "moderate"
}
```

### Response

```json
{
  "footprint": {
    "travel_co2": 3.84,
    "electricity_co2": 3.958,
    "food_co2": 5.0,
    "shopping_co2": 1.0,
    "total_co2": 13.798,
    "global_average": 13.0,
    "vs_average_pct": 106.1
  },
  "suggestions": [
    {
      "category": "travel",
      "icon": "🚌",
      "tip": "Switch to public transport 2 days/week to save ~1.1 kg CO₂/day on average.",
      "saving_kg": 1.1,
      "priority": "high"
    }
  ]
}
```

---

## 🧮 Emission Factors

| Category    | Source                        |
|-------------|-------------------------------|
| Travel      | EPA vehicle emission factors  |
| Electricity | Global average grid (0.475 kg CO₂/kWh) |
| Food        | IPCC / Our World in Data      |
| Shopping    | Lifecycle assessment averages |

---

## 🌟 Features

- **Daily tracker** — travel, electricity, food, shopping inputs
- **Instant calculation** — breakdown by category
- **Doughnut chart** — visual breakdown via Chart.js
- **AI suggestions** — personalised, prioritised tips with CO₂ savings
- **Weekly progress** — bar chart with global average reference line
- **Entry history** — table of past entries (newest first)
- **Persistent storage** — JSON file, no database needed

---

## 🛠️ Tech Stack

- **Backend:** Python 3.8+, Flask, Flask-CORS
- **Frontend:** Vanilla HTML/CSS/JavaScript
- **Charts:** Chart.js 4
- **Storage:** JSON file (no database required)

---

## ☁️ Deployment (simple)

### Option A — PythonAnywhere (free)
1. Upload the `backend/` folder
2. Set up a Flask WSGI app pointing to `app.py`
3. Serve the `frontend/` folder as static files

### Option B — Railway / Render
1. Push to GitHub
2. Connect repo to Railway or Render
3. Set start command: `python app.py`
4. Serve frontend via any static host (Netlify, GitHub Pages)

### Option C — Docker
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY backend/ .
RUN pip install -r requirements.txt
EXPOSE 5000
CMD ["python", "app.py"]
```
