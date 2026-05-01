#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────
# VehicleIQ — Start Script
# ─────────────────────────────────────────────────────────

set -e

echo ""
echo "◈  VehicleIQ — AI Car Insurance Advisor"
echo "─────────────────────────────────────────"
echo ""

# Optional: load env vars from .env if present
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
  echo "✔  Loaded .env"
fi

# Install Python deps
echo "→  Installing Python dependencies..."
cd backend
pip install -r requirements.txt -q
echo "✔  Dependencies ready"

# Start Flask in background
echo "→  Starting Flask backend on port 5000..."
python app.py &
FLASK_PID=$!
echo "✔  Backend running (PID $FLASK_PID)"

cd ..

# Serve frontend
echo "→  Serving frontend on port 8080..."
echo ""
echo "─────────────────────────────────────────"
echo "  App ready →  http://localhost:8080"
echo "  Backend  →  http://localhost:5000"
echo "─────────────────────────────────────────"
echo ""
echo "  OPTIONAL API KEYS (set in backend/.env):"
echo "  OPENAI_API_KEY  — enables real AI chatbot"
echo "  ZYLA_API_KEY    — enables live vehicle lookup"
echo ""
echo "  Without keys, the app runs with smart fallback data."
echo "─────────────────────────────────────────"
echo ""

# Serve frontend with Python's built-in server
cd frontend
python3 -m http.server 8080

# Cleanup on exit
trap "kill $FLASK_PID 2>/dev/null; echo 'Servers stopped.'" EXIT
