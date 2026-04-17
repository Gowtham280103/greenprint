# ── EcoTrack AI — Cloud Run Dockerfile ──────────────────────
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY ecotrack/backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend and frontend
COPY ecotrack/backend/ ./backend/
COPY ecotrack/frontend/ ./frontend/

WORKDIR /app/backend

ENV PORT=8080

EXPOSE 8080

# Use gunicorn for production
CMD exec gunicorn --bind 0.0.0.0:$PORT --workers 2 --threads 4 --timeout 60 app:app
