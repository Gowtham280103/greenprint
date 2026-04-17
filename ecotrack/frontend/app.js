/* ═══════════════════════════════════════════════════════════
   EcoTrack AI — Modern Dashboard JS
   ═══════════════════════════════════════════════════════════ */

const API_BASE = window.location.hostname === "localhost" ? "http://localhost:5000/api" : "/api";
const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY"; // Replace with your key
const GLOBAL_AVG = 13.0;

/* ── State ────────────────────────────────────────────────── */
let lastResult = null;
let charts = {};

/* ── DOM ──────────────────────────────────────────────────── */
const form       = document.getElementById("eco-form");
const calcBtn    = document.getElementById("calc-btn");
const resultsPanel = document.getElementById("results-panel");
const toast      = document.getElementById("toast");

/* ── Page Loader ──────────────────────────────────────────── */
window.addEventListener("load", () => {
  setTimeout(() => {
    document.getElementById("page-loader").classList.add("hidden");
  }, 1400);
  document.getElementById("view-date").textContent =
    new Date().toLocaleDateString("en-US", { weekday:"long", year:"numeric", month:"long", day:"numeric" });
  initChallenges();
});

/* ── Sidebar Navigation ───────────────────────────────────── */
document.querySelectorAll(".nav-item").forEach(btn => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.view;
    document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("view-" + target).classList.add("active");
    closeSidebar();
    if (target === "history")   loadHistory();
    if (target === "dashboard") loadDashboard();
  });
});

/* ── Mobile sidebar ───────────────────────────────────────── */
const sidebar  = document.getElementById("sidebar");
const overlay  = document.getElementById("sidebar-overlay");
document.getElementById("menu-btn").addEventListener("click", () => {
  sidebar.classList.toggle("open");
  overlay.classList.toggle("open");
});
overlay.addEventListener("click", closeSidebar);
function closeSidebar() {
  sidebar.classList.remove("open");
  overlay.classList.remove("open");
}

/* ── Dark Mode ────────────────────────────────────────────── */
function applyTheme(dark) {
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  const icon = dark ? "☀️" : "🌙";
  const label = dark ? "Light Mode" : "Dark Mode";
  document.querySelector(".theme-icon").textContent = icon;
  document.querySelector(".theme-label").textContent = label;
  document.getElementById("theme-toggle-mobile").textContent = icon;
  localStorage.setItem("ecotrack-theme", dark ? "dark" : "light");
  // Update chart colors if charts exist
  Object.values(charts).forEach(c => { if (c) { c.options.plugins.legend.labels.color = dark ? "#a0aec0" : "#4a5568"; c.update(); } });
}

const savedTheme = localStorage.getItem("ecotrack-theme");
if (savedTheme === "dark") applyTheme(true);

document.getElementById("theme-toggle").addEventListener("click", () => {
  applyTheme(document.documentElement.getAttribute("data-theme") !== "dark");
});
document.getElementById("theme-toggle-mobile").addEventListener("click", () => {
  applyTheme(document.documentElement.getAttribute("data-theme") !== "dark");
});

/* ── Range slider sync ────────────────────────────────────── */
const elecInput = document.getElementById("electricity_kwh");
const elecRange = document.getElementById("electricity_range");
elecRange.addEventListener("input", () => { elecInput.value = elecRange.value; });
elecInput.addEventListener("input", () => { elecRange.value = Math.min(elecInput.value, 1000); });

/* ── Form Submit ──────────────────────────────────────────── */
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  setLoading(true);

  const dietRadio = form.querySelector("input[name='diet_type']:checked");
  const shopRadio = form.querySelector("input[name='shopping_habit']:checked");

  const payload = {
    travel_km:       parseFloat(form.travel_km.value) || 0,
    vehicle_type:    form.vehicle_type.value,
    electricity_kwh: parseFloat(form.electricity_kwh.value) || 0,
    diet_type:       dietRadio ? dietRadio.value : "omnivore",
    shopping_habit:  shopRadio ? shopRadio.value : "moderate",
  };

  try {
    const res = await fetch(API_BASE + "/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Server error " + res.status);
    const data = await res.json();
    lastResult = { ...data, inputs: payload };
    renderResults(data, payload);
    showToast("Footprint calculated!");
    // Trigger Gemini AI suggestions
    fetchGeminiSuggestions(payload, data.footprint);
  } catch (err) {
    console.error(err);
    showToast("Cannot reach server. Is the backend running?", true);
  } finally {
    setLoading(false);
  }
});

/* ── Render Results ───────────────────────────────────────── */
function renderResults({ footprint, suggestions }, inputs) {
  resultsPanel.hidden = false;
  resultsPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });

  const total = footprint.total_co2;
  const avg   = footprint.global_average;

  // Score hero
  document.getElementById("score-total").textContent = total.toFixed(2);

  // Eco Score (0-100, inverse of footprint vs 2x average)
  const ecoScore = Math.max(0, Math.round(100 - (total / (avg * 2)) * 100));
  animateEcoScore(ecoScore);

  // Impact badge
  const impactBadge = document.getElementById("impact-badge");
  if (total <= avg * 0.6) {
    impactBadge.textContent = "🟢 Low Impact";
    impactBadge.className = "impact-badge low";
  } else if (total <= avg) {
    impactBadge.textContent = "🟡 Medium Impact";
    impactBadge.className = "impact-badge medium";
  } else {
    impactBadge.textContent = "🔴 High Impact";
    impactBadge.className = "impact-badge high";
  }

  // Stat cards
  document.getElementById("stat-travel").textContent = footprint.travel_co2 + " kg";
  document.getElementById("stat-elec").textContent   = footprint.electricity_co2 + " kg";
  document.getElementById("stat-food").textContent   = footprint.food_co2 + " kg";
  document.getElementById("stat-shop").textContent   = footprint.shopping_co2 + " kg";

  // CO2 Equivalents
  renderEquivalents(total);

  // Breakdown chart
  renderBreakdownChart(footprint);

  // Suggestions
  renderSuggestions(suggestions);
}

/* ── Eco Score Ring Animation ─────────────────────────────── */
function animateEcoScore(score) {
  const ring = document.getElementById("eco-ring-fill");
  const num  = document.getElementById("eco-score-num");
  const circumference = 314;
  const offset = circumference - (score / 100) * circumference;
  ring.style.strokeDashoffset = offset;

  // Color ring by score
  if (score >= 70)      ring.style.stroke = "#48bb78";
  else if (score >= 40) ring.style.stroke = "#ed8936";
  else                  ring.style.stroke = "#e53e3e";

  // Animate number
  let current = 0;
  const step = score / 40;
  const timer = setInterval(() => {
    current = Math.min(current + step, score);
    num.textContent = Math.round(current);
    if (current >= score) clearInterval(timer);
  }, 25);
}

/* ── CO2 Equivalents ──────────────────────────────────────── */
function renderEquivalents(totalKg) {
  const yearlyKg = totalKg * 365;
  const equivs = [
    { icon: "🌳", val: (yearlyKg / 21).toFixed(1), lbl: "Trees to offset/yr" },
    { icon: "🚗", val: (yearlyKg / 0.192).toFixed(0) + " km", lbl: "Petrol car equiv." },
    { icon: "✈️", val: (yearlyKg / 255).toFixed(2), lbl: "Flights (NYC→LA)" },
    { icon: "📱", val: Math.round(yearlyKg / 0.07), lbl: "Phone charges" },
    { icon: "🍔", val: Math.round(yearlyKg / 3.3), lbl: "Beef burgers" },
    { icon: "💧", val: (yearlyKg * 1000 / 0.3).toFixed(0) + " L", lbl: "Water heated" },
  ];
  const grid = document.getElementById("equiv-grid");
  grid.innerHTML = equivs.map(e => `
    <div class="equiv-item">
      <div class="equiv-icon">${e.icon}</div>
      <div class="equiv-val">${e.val}</div>
      <div class="equiv-lbl">${e.lbl}</div>
    </div>`).join("");
}

/* ── Breakdown Doughnut Chart ─────────────────────────────── */
function renderBreakdownChart(fp) {
  const ctx = document.getElementById("breakdown-chart").getContext("2d");
  if (charts.breakdown) charts.breakdown.destroy();
  const dark = document.documentElement.getAttribute("data-theme") === "dark";

  charts.breakdown = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Travel", "Electricity", "Food", "Shopping"],
      datasets: [{
        data: [fp.travel_co2, fp.electricity_co2, fp.food_co2, fp.shopping_co2],
        backgroundColor: ["#4299e1","#ed8936","#48bb78","#9f7aea"],
        borderWidth: 3,
        borderColor: dark ? "#1e2535" : "#ffffff",
        hoverOffset: 10,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: "65%",
      plugins: {
        legend: {
          position: "bottom",
          labels: { padding: 16, font: { size: 12, family: "Inter" }, color: dark ? "#a0aec0" : "#4a5568" },
        },
        tooltip: {
          callbacks: { label: ctx => " " + ctx.label + ": " + ctx.parsed.toFixed(3) + " kg CO\u2082" },
        },
      },
      animation: { animateRotate: true, duration: 800 },
    },
  });
}

/* ── Suggestions ──────────────────────────────────────────── */
function renderSuggestions(suggestions) {
  const list = document.getElementById("suggestions-list");
  list.innerHTML = "";
  if (!suggestions || suggestions.length === 0) {
    list.innerHTML = '<li class="empty-state">You\'re doing great! No urgent suggestions. 🌟</li>';
    return;
  }
  suggestions.forEach((s, i) => {
    const li = document.createElement("li");
    li.className = "suggestion-item priority-" + s.priority;
    li.style.animationDelay = (i * 60) + "ms";
    const saving = s.saving_kg > 0
      ? '<div class="suggestion-saving">💚 Save ~' + s.saving_kg + ' kg CO₂/day</div>' : "";
    li.innerHTML = `
      <span class="suggestion-icon">${s.icon}</span>
      <div class="suggestion-body">
        <div class="suggestion-tip">${s.tip}</div>${saving}
      </div>
      <span class="priority-badge ${s.priority}">${s.priority}</span>`;
    list.appendChild(li);
  });
}

/* ── Gemini AI Integration ────────────────────────────────── */
async function fetchGeminiSuggestions(inputs, footprint) {
  const aiInsights = document.getElementById("ai-insights");
  const aiLoading  = document.getElementById("ai-loading");

  aiInsights.textContent = "";
  aiLoading.hidden = false;

  // If no real API key, use smart fallback
  if (!GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_GEMINI_API_KEY") {
    await new Promise(r => setTimeout(r, 1500));
    aiLoading.hidden = true;
    aiInsights.textContent = generateLocalAIInsight(inputs, footprint);
    return;
  }

  const prompt = `You are an eco-friendly AI assistant. A user has the following daily carbon footprint:
- Travel: ${footprint.travel_co2} kg CO2 (${inputs.travel_km} km by ${inputs.vehicle_type.replace("_"," ")})
- Electricity: ${footprint.electricity_co2} kg CO2 (${inputs.electricity_kwh} kWh/month)
- Food: ${footprint.food_co2} kg CO2 (${inputs.diet_type} diet)
- Shopping: ${footprint.shopping_co2} kg CO2 (${inputs.shopping_habit} habits)
- Total: ${footprint.total_co2} kg CO2/day (global average: 13 kg/day)

Give 3 specific, actionable, personalized tips to reduce their carbon footprint. Be concise, friendly, and include estimated CO2 savings. Format as plain text paragraphs.`;

  try {
    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" + GEMINI_API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );
    if (!res.ok) throw new Error("Gemini API error " + res.status);
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    aiLoading.hidden = true;
    aiInsights.textContent = text || generateLocalAIInsight(inputs, footprint);
  } catch (err) {
    console.warn("Gemini fallback:", err.message);
    aiLoading.hidden = true;
    aiInsights.textContent = generateLocalAIInsight(inputs, footprint);
  }
}

function generateLocalAIInsight(inputs, fp) {
  const total = fp.total_co2;
  const avg   = fp.global_average;
  const lines = [];

  if (total > avg) {
    lines.push("Your footprint of " + total + " kg CO\u2082/day is " + ((total/avg - 1)*100).toFixed(0) + "% above the global average. Here are your top opportunities:");
  } else {
    lines.push("Great news! Your footprint of " + total + " kg CO\u2082/day is below the global average of " + avg + " kg/day. Keep it up with these tips:");
  }

  if (fp.travel_co2 > 3) {
    const saving = (fp.travel_co2 * 2/7).toFixed(1);
    lines.push("\n\u2022 Travel accounts for " + fp.travel_co2 + " kg CO\u2082 today. Taking public transport just 2 days a week would save ~" + saving + " kg CO\u2082/day on average — that's " + (saving * 365 / 7 * 2).toFixed(0) + " kg/year.");
  }

  if (fp.food_co2 > 3) {
    lines.push("\n\u2022 Your " + inputs.diet_type.replace("_"," ") + " diet contributes " + fp.food_co2 + " kg CO\u2082/day. Trying plant-based meals 3 days a week could cut food emissions by up to 30%.");
  }

  if (fp.electricity_co2 > 2) {
    lines.push("\n\u2022 At " + inputs.electricity_kwh + " kWh/month, switching to LED lighting and unplugging idle devices could reduce electricity emissions by 15-20%, saving ~" + (fp.electricity_co2 * 0.175).toFixed(2) + " kg CO\u2082/day.");
  }

  lines.push("\n\u2022 Offsetting your yearly footprint of " + (total * 365).toFixed(0) + " kg CO\u2082 would require planting " + Math.ceil(total * 365 / 21) + " trees. Consider supporting reforestation projects!");

  return lines.join("");
}

/* ── Dashboard ────────────────────────────────────────────── */
async function loadDashboard() {
  try {
    const [histRes, weekRes] = await Promise.all([
      fetch(API_BASE + "/history"),
      fetch(API_BASE + "/weekly"),
    ]);
    const history = await histRes.json();
    const weekly  = await weekRes.json();

    // Stats
    const filled = weekly.values.filter(v => v !== null);
    const todayVal = weekly.values[weekly.values.length - 1];
    const avgVal   = filled.length ? (filled.reduce((a,b) => a+b, 0) / filled.length) : null;

    document.getElementById("dash-today").textContent  = todayVal ? todayVal.toFixed(2) : "—";
    document.getElementById("dash-avg").textContent    = avgVal   ? avgVal.toFixed(2)   : "—";
    document.getElementById("dash-trees").textContent  = avgVal   ? Math.ceil(avgVal * 365 / 21) : "—";

    // Streak
    let streak = 0;
    const vals = [...weekly.values].reverse();
    for (const v of vals) { if (v !== null) streak++; else break; }
    document.getElementById("dash-streak").textContent = streak + " day" + (streak !== 1 ? "s" : "");

    // Trend chart
    renderTrendChart(weekly);

    // Avg breakdown chart
    if (history.length > 0) {
      const last = history[history.length - 1].result;
      renderAvgBreakdownChart(last);
    }

    // Badges
    renderBadges(history, avgVal);

  } catch (err) {
    console.error(err);
    showToast("Could not load dashboard data", true);
  }
}

function renderTrendChart({ labels, values }) {
  const ctx = document.getElementById("trend-chart").getContext("2d");
  if (charts.trend) charts.trend.destroy();
  const dark = document.documentElement.getAttribute("data-theme") === "dark";
  const gridColor = dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const textColor = dark ? "#a0aec0" : "#4a5568";

  charts.trend = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Your CO\u2082 (kg/day)",
          data: values,
          borderColor: "#38a169",
          backgroundColor: "rgba(56,161,105,0.12)",
          borderWidth: 2.5,
          pointBackgroundColor: values.map(v =>
            v === null ? "transparent" : v <= GLOBAL_AVG * 0.6 ? "#48bb78" : v <= GLOBAL_AVG ? "#ed8936" : "#e53e3e"
          ),
          pointRadius: 5, pointHoverRadius: 7,
          fill: true, tension: 0.4,
          spanGaps: false,
        },
        {
          label: "Global Average",
          data: Array(labels.length).fill(GLOBAL_AVG),
          borderColor: dark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.2)",
          borderDash: [6, 4], borderWidth: 1.5,
          pointRadius: 0, fill: false,
        },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: "bottom", labels: { font: { size: 12, family: "Inter" }, color: textColor, padding: 16 } },
        tooltip: { callbacks: { label: ctx => " " + ctx.dataset.label + ": " + (ctx.parsed.y !== null ? ctx.parsed.y.toFixed(2) + " kg CO\u2082" : "No data") } },
      },
      scales: {
        y: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: textColor, font: { size: 11 } }, title: { display: true, text: "kg CO\u2082 / day", color: textColor, font: { size: 11 } } },
        x: { grid: { display: false }, ticks: { color: textColor, font: { size: 11 } } },
      },
    },
  });
}

function renderAvgBreakdownChart(fp) {
  const ctx = document.getElementById("avg-breakdown-chart").getContext("2d");
  if (charts.avgBreakdown) charts.avgBreakdown.destroy();
  const dark = document.documentElement.getAttribute("data-theme") === "dark";

  charts.avgBreakdown = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Travel", "Electricity", "Food", "Shopping"],
      datasets: [{
        data: [fp.travel_co2, fp.electricity_co2, fp.food_co2, fp.shopping_co2],
        backgroundColor: ["#4299e1","#ed8936","#48bb78","#9f7aea"],
        borderWidth: 3,
        borderColor: dark ? "#1e2535" : "#ffffff",
        hoverOffset: 8,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: "bottom", labels: { font: { size: 12, family: "Inter" }, color: dark ? "#a0aec0" : "#4a5568", padding: 14 } },
        tooltip: { callbacks: { label: ctx => " " + ctx.label + ": " + ctx.parsed.toFixed(3) + " kg CO\u2082" } },
      },
    },
  });
}

/* ── Badges ───────────────────────────────────────────────── */
const ALL_BADGES = [
  { id: "first_track",   emoji: "🌱", name: "Eco Beginner",    desc: "First footprint tracked",       check: (h) => h.length >= 1 },
  { id: "week_warrior",  emoji: "📅", name: "Week Warrior",    desc: "Tracked 7 days in a row",       check: (h) => h.length >= 7 },
  { id: "green_warrior", emoji: "🌿", name: "Green Warrior",   desc: "Below average 3 days",          check: (h) => h.filter(e => e.result.total_co2 < GLOBAL_AVG).length >= 3 },
  { id: "eco_hero",      emoji: "🦸", name: "Eco Hero",        desc: "Below 60% of average",          check: (h) => h.some(e => e.result.total_co2 <= GLOBAL_AVG * 0.6) },
  { id: "plant_based",   emoji: "🥦", name: "Plant Powered",   desc: "Logged a vegan/veg day",        check: (h) => h.some(e => ["vegan","vegetarian"].includes(e.inputs.diet_type)) },
  { id: "ev_rider",      emoji: "⚡", name: "EV Rider",        desc: "Used electric vehicle",         check: (h) => h.some(e => e.inputs.vehicle_type === "car_electric") },
  { id: "cyclist",       emoji: "🚲", name: "Cyclist",         desc: "Chose bicycle or walking",      check: (h) => h.some(e => ["bicycle","walking"].includes(e.inputs.vehicle_type)) },
  { id: "minimalist",    emoji: "♻️", name: "Minimalist",      desc: "Minimal shopping logged",       check: (h) => h.some(e => e.inputs.shopping_habit === "minimal") },
];

function renderBadges(history, avgVal) {
  const grid = document.getElementById("badges-grid");
  if (!history || history.length === 0) {
    grid.innerHTML = '<div class="empty-state">Calculate your footprint to earn badges!</div>';
    return;
  }
  grid.innerHTML = ALL_BADGES.map(b => {
    const earned = b.check(history);
    return `<div class="badge-item ${earned ? "earned" : "locked"}">
      <div class="badge-emoji">${b.emoji}</div>
      <div class="badge-name">${b.name}</div>
      <div class="badge-desc">${earned ? b.desc : "🔒 Locked"}</div>
    </div>`;
  }).join("");
}

/* ── History ──────────────────────────────────────────────── */
async function loadHistory() {
  try {
    const res = await fetch(API_BASE + "/history");
    const history = await res.json();
    renderHistoryTable(history);
  } catch (err) {
    showToast("Could not load history", true);
  }
}

function renderHistoryTable(history) {
  const wrap = document.getElementById("history-table-wrap");
  const countEl = document.getElementById("entry-count");
  countEl.textContent = history.length + " entr" + (history.length === 1 ? "y" : "ies");

  if (!history || history.length === 0) {
    wrap.innerHTML = '<p class="empty-state">No entries yet. Start tracking!</p>';
    return;
  }

  const rows = [...history].reverse().slice(0, 50);
  wrap.innerHTML = `
    <div style="overflow-x:auto">
    <table class="history-table">
      <thead><tr>
        <th>Date</th><th>Vehicle</th><th>Diet</th>
        <th>Travel</th><th>Electricity</th><th>Food</th><th>Shopping</th><th>Total</th><th>Eco Score</th>
      </tr></thead>
      <tbody>${rows.map(r => {
        const ts    = new Date(r.timestamp);
        const label = ts.toLocaleString(undefined, { dateStyle:"short", timeStyle:"short" });
        const total = r.result.total_co2;
        const cls   = total <= GLOBAL_AVG * 0.6 ? "good" : total <= GLOBAL_AVG ? "warn" : "danger";
        const score = Math.max(0, Math.round(100 - (total / (GLOBAL_AVG * 2)) * 100));
        return `<tr>
          <td>${label}</td>
          <td>${fmtVehicle(r.inputs.vehicle_type)}</td>
          <td>${fmtDiet(r.inputs.diet_type)}</td>
          <td>${r.result.travel_co2} kg</td>
          <td>${r.result.electricity_co2} kg</td>
          <td>${r.result.food_co2} kg</td>
          <td>${r.result.shopping_co2} kg</td>
          <td><span class="badge-total ${cls}">${total} kg</span></td>
          <td><strong style="color:${score>=70?"#38a169":score>=40?"#ed8936":"#e53e3e"}">${score}</strong></td>
        </tr>`;
      }).join("")}</tbody>
    </table></div>`;
}

/* ── Daily Challenges ─────────────────────────────────────── */
const CHALLENGES = [
  { id:"c1", icon:"🚲", title:"Cycle to Work",       desc:"Use a bicycle or walk for your commute today instead of driving.",          xp:50,  target:"bicycle/walking" },
  { id:"c2", icon:"🥗", title:"Meatless Monday",     desc:"Eat a fully plant-based diet for the entire day.",                          xp:40,  target:"vegan/vegetarian" },
  { id:"c3", icon:"💡", title:"Power Down Hour",      desc:"Turn off all non-essential electronics for 1 hour this evening.",          xp:30,  target:"electricity" },
  { id:"c4", icon:"🛍️", title:"Zero New Purchases",  desc:"Go a full day without buying any new non-essential items.",                 xp:35,  target:"shopping" },
  { id:"c5", icon:"🚌", title:"Public Transport Day", desc:"Use only buses, trains, or shared transport for all travel today.",        xp:45,  target:"bus/train" },
  { id:"c6", icon:"🌳", title:"Plant a Seed",         desc:"Plant a seed or sapling, or donate to a reforestation project.",           xp:60,  target:"offset" },
  { id:"c7", icon:"♻️", title:"Recycle Everything",   desc:"Sort and recycle all waste properly throughout the day.",                  xp:25,  target:"waste" },
  { id:"c8", icon:"🚿", title:"Short Shower",         desc:"Keep your shower under 5 minutes to save water and energy.",              xp:20,  target:"water" },
  { id:"c9", icon:"🍱", title:"Cook at Home",         desc:"Prepare all meals at home using local ingredients — no takeout.",          xp:35,  target:"food" },
];

function initChallenges() {
  const completed = JSON.parse(localStorage.getItem("ecotrack-challenges") || "{}");
  const grid = document.getElementById("challenges-grid");
  grid.innerHTML = CHALLENGES.map(c => {
    const done = !!completed[c.id];
    return `<div class="challenge-card ${done ? "completed" : ""}" id="card-${c.id}">
      <div class="challenge-header">
        <span class="challenge-icon">${c.icon}</span>
        <span class="challenge-xp">+${c.xp} XP</span>
      </div>
      <div class="challenge-title">${c.title}</div>
      <div class="challenge-desc">${c.desc}</div>
      <div class="challenge-progress">
        <div class="challenge-bar" style="width:${done ? 100 : 0}%"></div>
      </div>
      <button class="challenge-complete-btn" onclick="completeChallenge('${c.id}')" ${done ? "disabled" : ""}>
        ${done ? "✅ Completed!" : "Mark Complete"}
      </button>
    </div>`;
  }).join("");
}

function completeChallenge(id) {
  const completed = JSON.parse(localStorage.getItem("ecotrack-challenges") || "{}");
  completed[id] = Date.now();
  localStorage.setItem("ecotrack-challenges", JSON.stringify(completed));
  const card = document.getElementById("card-" + id);
  if (card) {
    card.classList.add("completed");
    card.querySelector(".challenge-bar").style.width = "100%";
    card.querySelector(".challenge-complete-btn").disabled = true;
    card.querySelector(".challenge-complete-btn").textContent = "Completed!";
  }
  const ch = CHALLENGES.find(c => c.id === id);
  showToast("Challenge complete! +" + (ch ? ch.xp : 0) + " XP");
}

/* ── Helpers ──────────────────────────────────────────────── */
function fmtVehicle(v) {
  const m = { car_petrol:"🚗 Petrol", car_diesel:"🚗 Diesel", car_electric:"⚡ EV",
              motorcycle:"🏍️ Moto", bus:"🚌 Bus", train:"🚆 Train", bicycle:"🚲 Bike", walking:"🚶 Walk" };
  return m[v] || v;
}
function fmtDiet(d) {
  const m = { vegan:"🌱 Vegan", vegetarian:"🥦 Veg", pescatarian:"🐟 Pesc.", omnivore:"🍽️ Omni", heavy_meat:"🥩 Heavy" };
  return m[d] || d;
}

function setLoading(on) {
  calcBtn.disabled = on;
  calcBtn.querySelector(".btn-calculate-inner").innerHTML = on
    ? '<span class="spinner"></span><span>Calculating…</span>'
    : '<span>🌍</span><span>Calculate My Footprint</span>';
}

let toastTimer = null;
function showToast(msg, isError = false) {
  toast.textContent = msg;
  toast.style.background = isError ? "#e53e3e" : "";
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3500);
}

