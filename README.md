<div align="center">

# 🌿 EcoTrack AI

### Carbon Footprint Tracker & Dashboard

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Cloud%20Run-4285F4?style=for-the-badge&logo=google-cloud&logoColor=white)](https://ecotrack-ai-317275340485.asia-south1.run.app)
[![GitHub](https://img.shields.io/badge/GitHub-greenprint-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Gowtham280103/greenprint)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-3.0-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com)
[![Docker](https://img.shields.io/badge/Docker-Cloud%20Run-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://cloud.google.com/run)

> A full-stack AI-powered web app to track, visualize, and reduce your daily carbon footprint.
> **Individual project** built from scratch.

</div>

---

## 🚀 Live Demo

**[https://ecotrack-ai-317275340485.asia-south1.run.app](https://ecotrack-ai-317275340485.asia-south1.run.app)**

Deployed on Google Cloud Run — auto-scales, always available.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🎯 Daily Tracker | Log travel, electricity, food & shopping |
| 📊 Eco Score | Animated 0–100 score ring |
| 🌳 CO₂ Equivalents | Trees, flights, phone charges & more |
| 🤖 AI Suggestions | Google Gemini API + smart local fallback |
| 📉 7-Day Trend | Line chart with global average reference |
| 🥧 Breakdown Chart | Doughnut & pie charts via Chart.js |
| 🏆 Badges | Green Warrior, EV Rider, Cyclist & more |
| 🎮 Daily Challenges | 9 eco challenges with XP rewards |
| 🌙 Dark Mode | Full theme toggle with persistence |
| 📱 Responsive | Mobile, tablet & desktop ready |
| 📋 History Log | All entries with Eco Score column |

---

## 🛠️ Tech Stack

\\\
Backend   →  Python 3.11 · Flask 3.0 · Flask-CORS · Gunicorn
Frontend  →  HTML5 · CSS3 · Vanilla JavaScript · Chart.js 4
AI        →  Google Gemini API (with local fallback)
Storage   →  JSON file-based (no database required)
Deploy    →  Docker · Google Cloud Run · Cloud Build
\\\

---

## 📁 Project Structure

\\\
greenprint/
├── Dockerfile                  # Cloud Run container
├── .dockerignore
├── .gitignore
└── ecotrack/
    ├── backend/
    │   ├── app.py              # Flask API + static file serving
    │   ├── calculator.py       # Emission logic · AI suggestions · Eco Score
    │   ├── storage.py          # JSON persistence layer
    │   └── requirements.txt
    └── frontend/
        ├── index.html          # 4-page SPA
        ├── style.css           # Modern dashboard CSS + dark mode
        └── app.js              # Frontend logic + Gemini integration
\\\

---

## ⚡ Quick Start (Local)

\\\ash
# 1. Clone
git clone https://github.com/Gowtham280103/greenprint.git
cd greenprint

# 2. Install dependencies
pip install -r ecotrack/backend/requirements.txt

# 3. Run
python ecotrack/backend/app.py
\\\

Open **http://localhost:5000** in your browser.

---

## 🤖 Gemini AI Setup (Optional)

To enable real AI-generated tips, get a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey) and replace the placeholder in ecotrack/frontend/app.js:

\\\js
const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY"; // line 4
\\\

Without a key, the smart local fallback generates equally personalized insights automatically.

---

## ☁️ Deploy to Cloud Run

\\\ash
# Authenticate
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Enable APIs
gcloud services enable run.googleapis.com cloudbuild.googleapis.com

# Deploy (builds Docker image automatically)
gcloud run deploy ecotrack-ai \
  --source . \
  --region asia-south1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi
\\\

---

## 🧮 Emission Factors

All calculations use real-world data:

| Category | Source |
|---|---|
| Travel | EPA vehicle emission factors (kg CO₂/km) |
| Electricity | Global average grid intensity (0.475 kg CO₂/kWh) |
| Food | IPCC / Our World in Data dietary emissions |
| Shopping | Lifecycle assessment averages |

---

## 📊 How the Eco Score Works

\\\
Eco Score = max(0, 100 - (your_co2 / (global_avg × 2)) × 100)

Score 70–100  →  🟢 Low Impact
Score 40–69   →  🟡 Medium Impact
Score 0–39    →  🔴 High Impact

Global average: 13 kg CO₂/day
\\\

---

## 🏆 Badges

| Badge | How to Earn |
|---|---|
| 🌱 Eco Beginner | Track your first footprint |
| 📅 Week Warrior | Track 7 days in a row |
| 🌿 Green Warrior | Stay below average 3 days |
| 🦸 Eco Hero | Reach below 60% of global average |
| 🥦 Plant Powered | Log a vegan or vegetarian day |
| ⚡ EV Rider | Use an electric vehicle |
| 🚲 Cyclist | Choose bicycle or walking |
| ♻️ Minimalist | Log minimal shopping |

---

## 🤝 Contributing

This is an individual project but PRs are welcome!

1. Fork the repo
2. Create a branch: git checkout -b feature/your-feature
3. Commit: git commit -m "Add your feature"
4. Push: git push origin feature/your-feature
5. Open a Pull Request

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

<div align="center">

Built with 💚 by [Gowtham](https://github.com/Gowtham280103)

*Every small action counts — start tracking today!* 🌍

</div>
