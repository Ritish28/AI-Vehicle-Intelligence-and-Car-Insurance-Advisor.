"""
AI Vehicle Intelligence & Car Insurance Advisor
Flask Backend API
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json
import os
import datetime
import random

app = Flask(__name__)
CORS(app)

# ─── Config ───────────────────────────────────────────────────────────────────
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
ZYLA_API_KEY   = os.environ.get("ZYLA_API_KEY", "")

# ─── Fallback mock dataset ────────────────────────────────────────────────────
MOCK_VEHICLES = {
    "default": {
        "vehicle_number": "RJ14AB1234",
        "owner_name": "Rahul Sharma",
        "vehicle_model": "Maruti Swift VXI",
        "registration_date": "2018-05-10",
        "fuel_type": "Petrol",
        "insurance_status": "Expired",
        "chassis_number": "MA3FJEB1S00123456",
        "engine_number": "K12MN1234567",
        "vehicle_class": "Motor Car",
        "color": "Pearl White",
        "maker_model": "MARUTI SUZUKI",
        "rc_status": "ACTIVE",
    },
    "MH12DE1433": {
        "vehicle_number": "MH12DE1433",
        "owner_name": "Priya Desai",
        "vehicle_model": "Honda City ZX CVT",
        "registration_date": "2022-11-03",
        "fuel_type": "Petrol",
        "insurance_status": "Active",
        "chassis_number": "MAKGM553XNM001234",
        "engine_number": "L15Z61234567",
        "vehicle_class": "Motor Car",
        "color": "Lunar Silver",
        "maker_model": "HONDA",
        "rc_status": "ACTIVE",
    },
    "DL3CAF0001": {
        "vehicle_number": "DL3CAF0001",
        "owner_name": "Amit Verma",
        "vehicle_model": "Hyundai Creta SX Diesel",
        "registration_date": "2015-03-22",
        "fuel_type": "Diesel",
        "insurance_status": "Expired",
        "chassis_number": "MALC241BLFM123456",
        "engine_number": "D4FCDN1234567",
        "vehicle_class": "Motor Car",
        "color": "Phantom Black",
        "maker_model": "HYUNDAI",
        "rc_status": "ACTIVE",
    },
    "KA05MH2020": {
        "vehicle_number": "KA05MH2020",
        "owner_name": "Sneha Nair",
        "vehicle_model": "Tata Nexon EV Max",
        "registration_date": "2023-08-15",
        "fuel_type": "Electric",
        "insurance_status": "Active",
        "chassis_number": "MAT608651PTM12345",
        "engine_number": "ELECT1234567",
        "vehicle_class": "Motor Car",
        "color": "Daytona Grey",
        "maker_model": "TATA MOTORS",
        "rc_status": "ACTIVE",
    },
}


# ─── Helpers ──────────────────────────────────────────────────────────────────

def calculate_vehicle_age(registration_date_str: str) -> int:
    try:
        reg_date = datetime.datetime.strptime(registration_date_str, "%Y-%m-%d")
        today = datetime.datetime.now()
        age = (today - reg_date).days // 365
        return age
    except Exception:
        return 5  # default mid-range


def analyze_risk(vehicle_age: int, insurance_status: str):
    """Rule-based risk engine."""
    status = insurance_status.strip().lower()
    expired = status in ("expired", "lapsed", "inactive", "no insurance")

    # Base risk from age
    if vehicle_age < 3:
        base_risk = "Low"
        base_prob = random.randint(12, 22)
    elif vehicle_age <= 7:
        base_risk = "Medium"
        base_prob = random.randint(35, 50)
    else:
        base_risk = "High"
        base_prob = random.randint(58, 75)

    # Escalate if expired
    if expired:
        if base_risk == "Low":
            base_risk = "Medium"
            base_prob += random.randint(10, 18)
        elif base_risk == "Medium":
            base_risk = "High"
            base_prob += random.randint(12, 20)
        else:
            base_prob += random.randint(5, 10)

    base_prob = min(base_prob, 95)

    # Build insights
    insights = []
    if vehicle_age >= 8:
        insights.append(f"Vehicle is {vehicle_age} years old — higher mechanical failure probability.")
    if expired:
        insights.append("Insurance has lapsed, which significantly increases financial liability exposure.")
    if vehicle_age < 3:
        insights.append("Newer vehicle with minimal wear — statistically lower claim likelihood.")
    if base_risk == "High":
        insights.append("Comprehensive coverage strongly recommended to mitigate risk.")

    # Insurance recommendation
    if base_risk == "Low":
        plan = "Third-Party Liability"
        addons = ["Zero Depreciation Cover", "Engine Protect"]
        reason = "Low-risk profile qualifies for basic third-party coverage. Add-ons provide extra peace of mind."
    elif base_risk == "Medium":
        plan = "Comprehensive Insurance"
        addons = ["Zero Depreciation Cover", "Roadside Assistance", "NCB Protect"]
        reason = "Medium risk warrants full comprehensive cover to protect against own-damage and third-party claims."
    else:
        plan = "Comprehensive Insurance + Return to Invoice"
        addons = ["Zero Depreciation Cover", "Roadside Assistance", "Engine Protect", "Key Replacement Cover"]
        reason = "High-risk vehicle requires maximum coverage. Return to Invoice protects your full investment."

    return {
        "risk_level": base_risk,
        "claim_probability": base_prob,
        "insights": insights,
        "recommendation": {
            "plan": plan,
            "addons": addons,
            "reason": reason,
        },
    }


# ─── Routes ───────────────────────────────────────────────────────────────────

@app.route("/get-vehicle", methods=["POST"])
def get_vehicle():
    data = request.get_json(silent=True) or {}
    vehicle_number = data.get("vehicle_number", "").strip().upper().replace(" ", "")

    if not vehicle_number:
        return jsonify({"error": "Vehicle number is required"}), 400

    # Try Zyla API first
    vehicle_data = None
    source = "api"

    if ZYLA_API_KEY:
        try:
            url = "https://zylalabs.com/api/156/india+vehicle+registration+data+api/5798/get+vehicle+info"
            headers = {"Authorization": f"Bearer {ZYLA_API_KEY}"}
            params = {"vehicle_number": vehicle_number}
            resp = requests.get(url, headers=headers, params=params, timeout=8)
            if resp.status_code == 200:
                raw = resp.json()
                # normalise Zyla fields → our schema
                vehicle_data = {
                    "vehicle_number": vehicle_number,
                    "owner_name":        raw.get("owner_name") or raw.get("ownerName") or "N/A",
                    "vehicle_model":     raw.get("vehicle_model") or raw.get("vehicleModel") or raw.get("model") or "N/A",
                    "registration_date": raw.get("registration_date") or raw.get("registrationDate") or "2018-01-01",
                    "fuel_type":         raw.get("fuel_type") or raw.get("fuelType") or "Petrol",
                    "insurance_status":  raw.get("insurance_status") or raw.get("insuranceStatus") or "Unknown",
                    "chassis_number":    raw.get("chassis_number") or raw.get("chassisNumber") or "N/A",
                    "engine_number":     raw.get("engine_number") or raw.get("engineNumber") or "N/A",
                    "vehicle_class":     raw.get("vehicle_class") or raw.get("vehicleClass") or "Motor Car",
                    "color":             raw.get("color") or raw.get("vehicleColor") or "N/A",
                    "maker_model":       raw.get("maker_model") or raw.get("makerModel") or "N/A",
                    "rc_status":         raw.get("rc_status") or raw.get("rcStatus") or "ACTIVE",
                }
        except Exception as e:
            app.logger.warning(f"Zyla API error: {e}")

    # Fallback to local dataset
    if not vehicle_data:
        source = "fallback"
        vehicle_data = MOCK_VEHICLES.get(vehicle_number, MOCK_VEHICLES["default"]).copy()
        vehicle_data["vehicle_number"] = vehicle_number  # echo back what was entered

    # Compute vehicle age
    vehicle_data["vehicle_age"] = calculate_vehicle_age(vehicle_data["registration_date"])
    vehicle_data["_source"] = source

    return jsonify(vehicle_data)


@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.get_json(silent=True) or {}
    vehicle_age     = data.get("vehicle_age", 5)
    insurance_status = data.get("insurance_status", "Unknown")

    result = analyze_risk(vehicle_age, insurance_status)
    return jsonify(result)


@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json(silent=True) or {}
    user_message  = data.get("message", "").strip()
    vehicle_ctx   = data.get("vehicle_context", {})
    history       = data.get("history", [])

    if not user_message:
        return jsonify({"reply": "Please enter a message."}), 400

    # ── OpenAI path ───────────────────────────────────────────────────────────
    if OPENAI_API_KEY:
        try:
            system_prompt = (
                "You are an AI Car Insurance Advisor embedded in an insurtech dashboard. "
                "You ONLY answer queries related to car insurance, vehicle risk, policy types, premiums, "
                "add-ons, claims, and related financial advice. "
                "If a query is unrelated to car insurance, respond exactly: "
                "'I am designed to answer only car insurance related queries.' "
                "Keep answers concise, professional, and helpful. "
                "Avoid jargon. "
            )
            if vehicle_ctx:
                system_prompt += (
                    f"\nCurrent vehicle context: "
                    f"Model={vehicle_ctx.get('vehicle_model','N/A')}, "
                    f"Age={vehicle_ctx.get('vehicle_age','N/A')} years, "
                    f"Fuel={vehicle_ctx.get('fuel_type','N/A')}, "
                    f"Insurance={vehicle_ctx.get('insurance_status','N/A')}, "
                    f"Risk={vehicle_ctx.get('risk_level','N/A')}."
                )

            messages = [{"role": "system", "content": system_prompt}]
            for h in history[-6:]:  # last 3 turns
                messages.append({"role": h["role"], "content": h["content"]})
            messages.append({"role": "user", "content": user_message})

            resp = requests.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {OPENAI_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "gpt-3.5-turbo",
                    "messages": messages,
                    "max_tokens": 300,
                    "temperature": 0.7,
                },
                timeout=15,
            )
            reply = resp.json()["choices"][0]["message"]["content"].strip()
            return jsonify({"reply": reply})

        except Exception as e:
            app.logger.warning(f"OpenAI error: {e}")

    # ── Rule-based fallback chatbot ───────────────────────────────────────────
    msg_lower = user_message.lower()
    insurance_keywords = [
        "insurance", "policy", "premium", "claim", "cover", "coverage",
        "third party", "comprehensive", "add-on", "addon", "deductible",
        "idv", "ncb", "no claim", "renewal", "risk", "vehicle", "car",
        "accident", "damage", "theft", "flood", "depreciation", "roadside",
        "zero dep", "engine protect", "rate", "cost", "price", "quote",
    ]
    is_relevant = any(kw in msg_lower for kw in insurance_keywords)

    if not is_relevant:
        return jsonify({"reply": "I am designed to answer only car insurance related queries."})

    # Simple canned responses
    if "ncb" in msg_lower or "no claim bonus" in msg_lower:
        reply = ("No Claim Bonus (NCB) is a discount on your renewal premium for every claim-free year. "
                 "It can range from 20% (after 1 year) up to 50% (after 5 consecutive claim-free years).")
    elif "idv" in msg_lower:
        reply = ("Insured Declared Value (IDV) is the maximum sum your insurer will pay on a total loss or theft. "
                 "It's calculated as the manufacturer's listed price minus depreciation based on vehicle age.")
    elif "zero dep" in msg_lower or "zero depreciation" in msg_lower:
        reply = ("Zero Depreciation cover means your insurer pays the full repair/replacement cost without "
                 "deducting depreciation on parts. Highly recommended for vehicles under 5 years old.")
    elif "comprehensive" in msg_lower:
        reply = ("Comprehensive insurance covers both own damage (accident, fire, theft, natural disasters) "
                 "and third-party liability. It's broader and recommended for vehicles less than 10 years old.")
    elif "third party" in msg_lower:
        reply = ("Third-party liability insurance is mandatory in India. It covers damages you cause to "
                 "another person's vehicle or property, but does NOT cover your own vehicle's damage.")
    elif "claim" in msg_lower:
        reply = ("To file a claim: 1) Inform your insurer within 24 hours of the incident. "
                 "2) File an FIR if required. 3) Submit documents (RC, DL, policy copy, repair estimate). "
                 "4) A surveyor will assess the damage before settlement.")
    elif "renewal" in msg_lower:
        reply = ("You should renew your policy before it lapses. A lapsed policy means loss of NCB "
                 "and increased financial risk. Most insurers allow online renewal in under 5 minutes.")
    elif "premium" in msg_lower or "cost" in msg_lower or "price" in msg_lower:
        vage = vehicle_ctx.get("vehicle_age", "")
        risk = vehicle_ctx.get("risk_level", "")
        base = "Your premium depends on IDV, vehicle age, location, and add-ons chosen."
        if vage and risk:
            base += f" For a {vage}-year-old vehicle with {risk} risk, expect a comprehensive premium in the ₹8,000–₹25,000 range annually."
        reply = base
    elif "risk" in msg_lower:
        risk = vehicle_ctx.get("risk_level", "")
        if risk:
            reply = (f"Your vehicle has been assessed as {risk} risk. "
                     "Risk is calculated based on vehicle age, insurance status, fuel type, and usage patterns.")
        else:
            reply = ("Risk level is determined by vehicle age, insurance status, make/model, and claim history. "
                     "Older vehicles with lapsed insurance carry the highest risk scores.")
    else:
        reply = ("That's a great insurance question! The key factors for car insurance in India are: "
                 "IDV (market value), NCB discount, add-on covers, and your driving history. "
                 "Would you like details on any specific aspect?")

    return jsonify({"reply": reply})


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "version": "1.0.0"})


if __name__ == "__main__":
    app.run(debug=True, port=5000)
