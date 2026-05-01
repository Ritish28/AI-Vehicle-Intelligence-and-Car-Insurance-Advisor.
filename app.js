/**
 * VehicleIQ — AI Car Insurance Advisor
 * Frontend Application Logic
 */

const API_BASE = "http://127.0.0.1:5000";

// ── State ─────────────────────────────────────────────────────────────────────
let vehicleData    = null;
let analysisData   = null;
let chatHistory    = [];
let gaugeChartInst = null;
let riskChartInst  = null;

// ── Screen helpers ────────────────────────────────────────────────────────────

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => {
    s.classList.remove("active", "visible");
    s.classList.add("hidden");
  });
  const el = document.getElementById(id);
  el.classList.remove("hidden");
  el.classList.add(id === "screen-landing" ? "active" : "visible");
  window.scrollTo(0, 0);
}

function goBack() {
  showScreen("screen-landing");
  vehicleData  = null;
  analysisData = null;
  chatHistory  = [];
  document.getElementById("vehicle-input").value = "";
  document.getElementById("chat-messages").innerHTML = `
    <div class="chat-msg bot">
      <div class="msg-avatar">AI</div>
      <div class="msg-bubble">
        Hello! I'm your AI Car Insurance Advisor. Ask me anything about insurance policies, coverage, claims, or your vehicle's risk profile.
      </div>
    </div>`;
}

// ── Landing helpers ───────────────────────────────────────────────────────────

function fillSample(num) {
  document.getElementById("vehicle-input").value = num;
  document.getElementById("vehicle-input").focus();
}

// ── Loader steps ──────────────────────────────────────────────────────────────

function setLoaderStep(step, text) {
  document.getElementById("loader-text").textContent = text;
  ["ls1", "ls2", "ls3"].forEach((id, i) => {
    const el = document.getElementById(id);
    el.classList.remove("active", "done");
    if (i < step - 1)  el.classList.add("done");
    if (i === step - 1) el.classList.add("active");
  });
}

// ── Main fetch + analyse flow ─────────────────────────────────────────────────

async function fetchVehicle() {
  const raw = document.getElementById("vehicle-input").value.trim().toUpperCase().replace(/\s+/g, "");

  if (!raw) {
    document.getElementById("input-error").classList.remove("hidden");
    return;
  }
  document.getElementById("input-error").classList.add("hidden");

  showScreen("screen-loading");
  setLoaderStep(1, "Fetching vehicle data…");

  // Step 1 — get vehicle
  let vData;
  try {
    const r = await fetch(`${API_BASE}/get-vehicle`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ vehicle_number: raw }),
    });
    vData = await r.json();
    if (vData._source === "fallback") {
      showNotice("Vehicle not found in live API — showing demo data.");
    }
  } catch (err) {
    // Total backend failure — build pure client-side mock
    vData = buildClientMock(raw);
    showNotice("Backend unreachable — showing offline demo data.");
  }

  await sleep(600);
  setLoaderStep(2, "Analysing risk with AI…");

  // Step 2 — analyse
  let aData;
  try {
    const r = await fetch(`${API_BASE}/analyze`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        vehicle_age:      vData.vehicle_age,
        insurance_status: vData.insurance_status,
      }),
    });
    aData = await r.json();
  } catch {
    aData = clientAnalyze(vData.vehicle_age || 5, vData.insurance_status || "Unknown");
  }

  await sleep(700);
  setLoaderStep(3, "Generating insights…");
  await sleep(600);

  vehicleData  = vData;
  analysisData = aData;

  populateDashboard(vData, aData);
  showScreen("screen-dashboard");
}

function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }

// ── Client-side fallbacks ─────────────────────────────────────────────────────

function buildClientMock(num) {
  const age = Math.floor(Math.random() * 10) + 1;
  const reg = new Date();
  reg.setFullYear(reg.getFullYear() - age);
  const models = ["Maruti Swift VXI", "Honda City ZX", "Hyundai Creta SX", "Tata Nexon EV", "Toyota Innova"];
  const fuels   = ["Petrol", "Diesel", "Petrol", "Electric", "Diesel"];
  const statuses = ["Active", "Expired", "Active", "Active", "Expired"];
  const idx = Math.floor(Math.random() * models.length);
  return {
    vehicle_number:   num,
    owner_name:       "Demo User",
    vehicle_model:    models[idx],
    registration_date: reg.toISOString().split("T")[0],
    fuel_type:        fuels[idx],
    insurance_status: statuses[idx],
    vehicle_age:      age,
    vehicle_class:    "Motor Car",
    color:            "Pearl White",
    rc_status:        "ACTIVE",
    _source:          "client-fallback",
  };
}

function clientAnalyze(age, status) {
  const expired = /expired|lapsed|inactive/i.test(status);
  let risk, prob;
  if (age < 3)       { risk = "Low";    prob = 14 + Math.floor(Math.random() * 8); }
  else if (age <= 7) { risk = "Medium"; prob = 36 + Math.floor(Math.random() * 14); }
  else               { risk = "High";   prob = 60 + Math.floor(Math.random() * 15); }
  if (expired) {
    if (risk === "Low")    { risk = "Medium"; prob += 12; }
    else if (risk === "Medium") { risk = "High"; prob += 14; }
    else prob = Math.min(prob + 7, 92);
  }

  const insights = [];
  if (age >= 8) insights.push(`Vehicle is ${age} years old — higher mechanical failure probability.`);
  if (expired)  insights.push("Insurance has lapsed, significantly increasing financial liability exposure.");
  if (age < 3)  insights.push("Newer vehicle with minimal wear — statistically lower claim likelihood.");
  if (risk === "High") insights.push("Comprehensive coverage strongly recommended to mitigate risk.");
  if (insights.length === 0) insights.push("Moderate risk profile. Standard comprehensive coverage is advisable.");

  let plan, addons, reason;
  if (risk === "Low") {
    plan = "Third-Party Liability"; addons = ["Zero Depreciation Cover", "Engine Protect"];
    reason = "Low-risk profile qualifies for basic third-party coverage. Add-ons provide extra peace of mind.";
  } else if (risk === "Medium") {
    plan = "Comprehensive Insurance"; addons = ["Zero Depreciation Cover", "Roadside Assistance", "NCB Protect"];
    reason = "Medium risk warrants full comprehensive cover to protect against own-damage and third-party claims.";
  } else {
    plan = "Comprehensive Insurance + Return to Invoice"; addons = ["Zero Depreciation Cover", "Roadside Assistance", "Engine Protect", "Key Replacement Cover"];
    reason = "High-risk vehicle requires maximum coverage. Return to Invoice protects your full investment.";
  }

  return { risk_level: risk, claim_probability: Math.min(prob, 95), insights, recommendation: { plan, addons, reason } };
}

// ── Dashboard population ──────────────────────────────────────────────────────

function populateDashboard(v, a) {
  // Header meta
  document.getElementById("dash-vehicle-num").textContent = v.vehicle_number;
  document.getElementById("dash-timestamp").textContent   = new Date().toLocaleString("en-IN", { hour12: true, hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short", year: "numeric" });

  // Vehicle info
  document.getElementById("v-model").textContent   = v.vehicle_model || "—";
  document.getElementById("v-owner").textContent   = v.owner_name || "—";
  document.getElementById("v-reg").textContent     = formatDate(v.registration_date);
  document.getElementById("v-fuel").textContent    = v.fuel_type || "—";
  document.getElementById("v-class").textContent   = v.vehicle_class || "Motor Car";
  document.getElementById("v-color").textContent   = v.color || "—";
  document.getElementById("v-age-badge").textContent = `${v.vehicle_age} yr${v.vehicle_age !== 1 ? "s" : ""} old`;

  const insuranceEl = document.getElementById("v-insurance");
  insuranceEl.textContent = v.insurance_status || "—";
  insuranceEl.style.color = /expired|lapsed/i.test(v.insurance_status) ? "var(--high)" : "var(--low)";

  const rcBadge = document.getElementById("rc-badge");
  if (/active/i.test(v.rc_status || "active")) {
    rcBadge.textContent = "RC Active";
    rcBadge.style.color = "var(--low)";
  } else {
    rcBadge.textContent = "RC Inactive";
    rcBadge.style.background = "var(--high-bg)";
    rcBadge.style.color = "var(--high)";
  }

  // Risk
  const riskLower = (a.risk_level || "medium").toLowerCase();
  const badgeEl = document.getElementById("risk-badge");
  badgeEl.textContent = a.risk_level;
  badgeEl.className = `risk-badge risk-${riskLower}`;

  document.getElementById("r-age").textContent   = `${v.vehicle_age} years`;
  document.getElementById("r-level").textContent = a.risk_level;
  document.getElementById("r-prob").textContent  = `${a.claim_probability}%`;
  document.getElementById("gauge-pct").textContent = `${a.claim_probability}%`;

  // Risk bar
  const bar = document.getElementById("risk-bar");
  bar.classList.remove("low", "medium", "high");
  bar.classList.add(riskLower);
  setTimeout(() => { bar.style.width = `${a.claim_probability}%`; }, 200);

  // Gauge chart
  renderGauge(a.claim_probability, riskLower);

  // Risk trend chart
  renderRiskChart(v.vehicle_age);

  // Insights
  const insightList = document.getElementById("insights-list");
  insightList.innerHTML = "";
  const insights = a.insights && a.insights.length ? a.insights : ["Risk assessment completed based on available vehicle data."];
  insights.forEach((txt, i) => {
    const div = document.createElement("div");
    div.className = "insight-item";
    div.style.animationDelay = `${i * 0.1}s`;
    div.innerHTML = `<span class="insight-bullet"></span><span class="insight-text">${txt}</span>`;
    insightList.appendChild(div);
  });

  // Recommendation
  const rec = a.recommendation || {};
  document.getElementById("rec-plan").textContent   = rec.plan || "—";
  document.getElementById("rec-reason").textContent = rec.reason || "—";
  const addonsList = document.getElementById("addons-list");
  addonsList.innerHTML = "";
  (rec.addons || []).forEach(addon => {
    const tag = document.createElement("span");
    tag.className = "addon-tag";
    tag.textContent = addon;
    addonsList.appendChild(tag);
  });
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return dateStr; }
}

// ── Charts ────────────────────────────────────────────────────────────────────

function renderGauge(probability, riskLevel) {
  const ctx = document.getElementById("gaugeChart").getContext("2d");
  if (gaugeChartInst) gaugeChartInst.destroy();

  const colorMap = { low: "#22c55e", medium: "#f59e0b", high: "#ef4444" };
  const color = colorMap[riskLevel] || "#3b82f6";
  const remaining = 100 - probability;

  gaugeChartInst = new Chart(ctx, {
    type: "doughnut",
    data: {
      datasets: [{
        data: [probability, remaining],
        backgroundColor: [color, "rgba(255,255,255,.05)"],
        borderWidth: 0,
        circumference: 180,
        rotation: 270,
      }],
    },
    options: {
      responsive: true,
      cutout: "78%",
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      animation: { duration: 1200, easing: "easeInOutQuart" },
    },
  });
}

function renderRiskChart(currentAge) {
  const ctx = document.getElementById("riskChart").getContext("2d");
  if (riskChartInst) riskChartInst.destroy();

  const ages  = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const probs = ages.map(a => {
    if (a < 3)  return 14 + a * 2;
    if (a <= 7) return 28 + (a - 3) * 5;
    return 48 + (a - 7) * 4;
  });

  const pointBg = ages.map(a => a === currentAge ? "#f59e0b" : "transparent");
  const pointR  = ages.map(a => a === currentAge ? 6 : 3);

  riskChartInst = new Chart(ctx, {
    type: "line",
    data: {
      labels: ages.map(a => `${a}yr`),
      datasets: [{
        label: "Claim Probability (%)",
        data: probs,
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59,130,246,.08)",
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: pointBg,
        pointBorderColor:     ages.map(a => a === currentAge ? "#f59e0b" : "rgba(59,130,246,.4)"),
        pointRadius:          pointR,
        pointHoverRadius:     6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: ctx => ` ${ctx.raw}% claim probability` },
          backgroundColor: "#0d1320",
          borderColor: "rgba(59,130,246,.3)",
          borderWidth: 1,
          titleColor: "#8b96b0",
          bodyColor: "#f0f4ff",
        },
      },
      scales: {
        x: {
          grid: { color: "rgba(255,255,255,.04)" },
          ticks: { color: "#4a5568", font: { size: 10 } },
        },
        y: {
          grid: { color: "rgba(255,255,255,.04)" },
          ticks: { color: "#4a5568", font: { size: 10 }, callback: v => `${v}%` },
          min: 0,
          max: 100,
        },
      },
      animation: { duration: 1000, easing: "easeInOutQuart" },
    },
  });
}

// ── Chatbot ───────────────────────────────────────────────────────────────────

function handleChatKey(e) {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); }
}

function sendQuick(msg) {
  document.getElementById("chat-input").value = msg;
  sendChat();
}

async function sendChat() {
  const input = document.getElementById("chat-input");
  const msg = input.value.trim();
  if (!msg) return;

  input.value = "";

  appendMessage("user", msg);
  chatHistory.push({ role: "user", content: msg });

  const typingId = appendTyping();

  const vehicleCtx = vehicleData ? {
    vehicle_model:    vehicleData.vehicle_model,
    vehicle_age:      vehicleData.vehicle_age,
    fuel_type:        vehicleData.fuel_type,
    insurance_status: vehicleData.insurance_status,
    risk_level:       analysisData?.risk_level,
  } : {};

  let reply;
  try {
    const r = await fetch(`${API_BASE}/chat`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ message: msg, vehicle_context: vehicleCtx, history: chatHistory.slice(-6) }),
    });
    const d = await r.json();
    reply = d.reply || "I'm sorry, I couldn't process that. Please try again.";
  } catch {
    reply = clientChatFallback(msg, vehicleCtx);
  }

  removeTyping(typingId);
  appendMessage("bot", reply);
  chatHistory.push({ role: "assistant", content: reply });
}

function appendMessage(role, text) {
  const wrap = document.getElementById("chat-messages");
  const div = document.createElement("div");
  div.className = `chat-msg ${role}`;
  div.innerHTML = `
    <div class="msg-avatar">${role === "bot" ? "AI" : "Me"}</div>
    <div class="msg-bubble">${escapeHtml(text)}</div>`;
  wrap.appendChild(div);
  div.scrollIntoView({ behavior: "smooth", block: "end" });
  return div;
}

function appendTyping() {
  const wrap = document.getElementById("chat-messages");
  const id   = "typing-" + Date.now();
  const div  = document.createElement("div");
  div.id = id;
  div.className = "chat-msg bot msg-typing";
  div.innerHTML = `
    <div class="msg-avatar">AI</div>
    <div class="msg-bubble">
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
    </div>`;
  wrap.appendChild(div);
  div.scrollIntoView({ behavior: "smooth", block: "end" });
  return id;
}

function removeTyping(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
}

// Client-side chat fallback (when backend unreachable)
function clientChatFallback(msg, ctx) {
  const m = msg.toLowerCase();
  const insKw = ["insurance", "policy", "premium", "claim", "cover", "idv", "ncb", "risk", "vehicle", "car", "accident", "damage", "theft", "renewal", "zero dep", "roadside", "third party", "comprehensive", "add-on", "rate", "cost", "price", "quote"];
  if (!insKw.some(k => m.includes(k))) {
    return "I am designed to answer only car insurance related queries.";
  }
  if (m.includes("ncb") || m.includes("no claim")) {
    return "No Claim Bonus (NCB) gives you a discount on renewal premium for every claim-free year — ranging from 20% to 50%.";
  }
  if (m.includes("idv")) {
    return "IDV (Insured Declared Value) is the maximum payout on total loss or theft, calculated as the manufacturer's price minus depreciation.";
  }
  if (m.includes("zero dep") || m.includes("zero depreciation")) {
    return "Zero Depreciation cover pays full repair costs without any depreciation deduction — ideal for vehicles under 5 years old.";
  }
  if (m.includes("comprehensive")) {
    return "Comprehensive insurance covers both own damage (accidents, theft, natural disasters) and third-party liability. Recommended for vehicles under 10 years.";
  }
  if (m.includes("third party")) {
    return "Third-party insurance is mandatory in India. It covers damage you cause to others, but not your own vehicle.";
  }
  if (m.includes("claim")) {
    return "To file a claim: 1) Notify your insurer within 24 hours. 2) File an FIR if needed. 3) Submit documents. 4) A surveyor will assess damage.";
  }
  if (ctx.risk_level) {
    return `Based on your vehicle's ${ctx.risk_level} risk profile, I'd recommend a ${ctx.risk_level === "Low" ? "basic third-party policy with a few add-ons" : "comprehensive plan with Zero Depreciation and Roadside Assistance"}.`;
  }
  return "That's a great insurance question! Key factors include IDV, NCB discount, add-on covers, and your driving history. What would you like to know more about?";
}

// ── Notice ────────────────────────────────────────────────────────────────────

function showNotice(text) {
  const el = document.getElementById("api-notice");
  document.getElementById("notice-text").textContent = text;
  el.classList.remove("hidden");
  setTimeout(closeNotice, 6000);
}
function closeNotice() {
  document.getElementById("api-notice").classList.add("hidden");
}

// ── Init ──────────────────────────────────────────────────────────────────────

document.getElementById("vehicle-input").addEventListener("keydown", e => {
  if (e.key === "Enter") fetchVehicle();
});

// Remove error on typing
document.getElementById("vehicle-input").addEventListener("input", () => {
  document.getElementById("input-error").classList.add("hidden");
});
