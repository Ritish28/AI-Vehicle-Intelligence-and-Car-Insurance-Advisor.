# ◈ VehicleIQ — AI Vehicle Intelligence & Car Insurance Advisor

A production-quality insurtech web application that converts any Indian vehicle number into intelligent insurance insights using AI analysis, real-time API integration, and a premium dark dashboard.

---

## 🖥️ Screenshots

- **Landing Page** — Minimal, dark hero with vehicle number input
- **Dashboard** — Risk gauge, vehicle info card, AI insights, recommendation, chart
- **Chatbot** — Domain-restricted AI insurance advisor

---

## 🚀 Quick Start

### 1. Prerequisites
- Python 3.8+
- pip

### 2. Clone / Extract the project
```
insurance-advisor/
├── backend/
│   ├── app.py
│   └── requirements.txt
├── frontend/
│   ├── index.html
│   ├── css/style.css
│   └── js/app.js
├── start.sh
└── README.md
```

### 3. Install & Run

```bash
# Make start script executable
chmod +x start.sh

# Run everything
./start.sh
```

Or manually:

```bash
# Terminal 1 — Backend
cd backend
pip install -r requirements.txt
python app.py

# Terminal 2 — Frontend
cd frontend
python3 -m http.server 8080
```

Open **http://localhost:8080** in your browser.

---

## 🔑 API Keys (Optional but Recommended)

Create `backend/.env`:

```env
OPENAI_API_KEY=sk-...        # Enables real AI chatbot responses
ZYLA_API_KEY=your_key_here   # Enables live vehicle data (zylalabs.com)
```

**Without API keys:** The app runs completely with intelligent fallback data and a rule-based chatbot. No setup required.

**With `OPENAI_API_KEY`:** The chatbot uses GPT-3.5-turbo with domain restriction.

**With `ZYLA_API_KEY`:** Real Indian vehicle registration data is fetched from Zyla Labs API.

---

## 🏗️ Architecture

```
Frontend (HTML/CSS/JS)
        ↓  POST /get-vehicle
        ↓  POST /analyze  
        ↓  POST /chat
Backend (Flask)
        ↓              ↓
  Zyla API        OpenAI API
  (vehicle data)  (chatbot)
        ↓
  Fallback JSON Dataset
```

---

## 🧠 AI Risk Engine

| Vehicle Age     | Base Risk | Claim Probability |
|-----------------|-----------|-------------------|
| < 3 years       | Low       | 12–22%            |
| 3–7 years       | Medium    | 35–50%            |
| > 7 years       | High      | 58–75%            |

**Insurance Expired?** → Risk escalates one level, probability +10–20%

---

## 📦 API Endpoints

### POST `/get-vehicle`
```json
{ "vehicle_number": "MH12DE1433" }
```
Returns: owner_name, vehicle_model, registration_date, fuel_type, insurance_status, vehicle_age

### POST `/analyze`
```json
{ "vehicle_age": 6, "insurance_status": "Expired" }
```
Returns: risk_level, claim_probability, insights[], recommendation{}

### POST `/chat`
```json
{ "message": "What plan should I get?", "vehicle_context": {...}, "history": [] }
```
Returns: `{ "reply": "..." }`

---

## 🎨 Design System

- **Primary font:** Syne (headings, labels)
- **Body font:** DM Sans
- **Theme:** Dark (bg `#080c14`, cards `#0d1320`)
- **Accent:** Blue `#3b82f6` / Cyan `#06b6d4`
- **Risk colors:** Green / Amber / Red

---

## 🧪 Test Vehicle Numbers

| Number       | Profile                              |
|--------------|--------------------------------------|
| `MH12DE1433` | Honda City 2022, Active insurance    |
| `DL3CAF0001` | Hyundai Creta 2015, Expired insurance|
| `KA05MH2020` | Tata Nexon EV 2023, Active insurance |
| `RJ14AB1234` | Maruti Swift 2018, Expired insurance |
| Any other    | Auto-generated realistic mock data   |

---

## 🔒 Security

- API keys stored server-side only (never exposed to frontend)
- CORS enabled for localhost development
- No user data stored

---

## 📈 Future Scope

- Real ML model training on claims data
- Policy purchase integration (Razorpay)
- User accounts & history
- Mobile app (React Native)
- Aadhaar-verified vehicle lookup

---

*Built with ◈ VehicleIQ*
