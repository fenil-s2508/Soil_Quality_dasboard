'use strict';

/* ═══════════════════════════════════════════════════════════
   SOIL DASHBOARD — main.js
   1. Chart (init / switch bar↔radar)
   2. Live polling every 10s
   3. Metric card updates + flash
   4. Crop recommendation fetch
   5. Clock, theme toggle, banner slider, voice assistant
═══════════════════════════════════════════════════════════ */

// ── Chart state ──────────────────────────────────────────────────
let soilChart = null;
let chartMode = 'bar';

const COLORS = {
  N:        '#7bbf5e',
  P:        '#4a86c8',
  K:        '#c8652a',
  Temp:     '#e08050',
  Humidity: '#d4a843',
  pH:       '#c8903a',
  EC:       '#9a72c8',
  Moisture: '#3d8c5c',
};
const LABELS = ['N', 'P', 'K', 'Temp', 'Humidity', 'pH', 'EC', 'Moisture'];
const KEYS   = ['N', 'P', 'K', 'Temp', 'Humidity', 'pH', 'EC', 'Moisture'];

// ── 1. Chart init ────────────────────────────────────────────────
function initChart(soil) {
  const ctx    = document.getElementById('soilChart').getContext('2d');
  const values = KEYS.map(k => +(soil[k] || 0).toFixed(2));

  const barDataset = {
    label: 'Soil Reading',
    data: values,
    backgroundColor: KEYS.map(k => COLORS[k] + '33'),
    borderColor:     KEYS.map(k => COLORS[k]),
    borderWidth: 1.5,
    borderRadius: 6,
    borderSkipped: false,
  };

  const radarDataset = {
    label: 'Soil Reading',
    data: values,
    backgroundColor: 'rgba(90,153,68,0.15)',
    borderColor: '#7bbf5e',
    borderWidth: 1.5,
    pointBackgroundColor: '#7bbf5e',
    pointRadius: 4,
    pointHoverRadius: 6,
  };

  soilChart = new Chart(ctx, {
    type: 'bar',
    data: { labels: LABELS, datasets: [barDataset] },
    options: barOptions(),
  });

  // Store both datasets for toggle
  soilChart._bar   = barDataset;
  soilChart._radar = radarDataset;
}

// ── 2. Chart options ─────────────────────────────────────────────
function barOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 600, easing: 'easeInOutQuart' },
    plugins: { legend: { display: false }, tooltip: tooltipStyle() },
    scales: {
      x: { ticks: { color: '#9a8a72', font: { family: 'DM Sans', size: 11 } }, grid: { color: 'rgba(160,120,60,0.1)' } },
      y: { beginAtZero: true, ticks: { color: '#9a8a72', font: { family: 'DM Sans', size: 11 } }, grid: { color: 'rgba(160,120,60,0.1)' } },
    },
  };
}

function radarOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 600, easing: 'easeInOutQuart' },
    plugins: { legend: { display: false }, tooltip: tooltipStyle() },
    scales: {
      r: {
        min: 0,
        ticks: { display: false },
        grid: { color: 'rgba(160,120,60,0.15)' },
        angleLines: { color: 'rgba(160,120,60,0.15)' },
        pointLabels: { color: '#9a8a72', font: { family: 'DM Sans', size: 11 } },
      },
    },
  };
}

function tooltipStyle() {
  return {
    backgroundColor: '#2b2419',
    borderColor: 'rgba(160,120,60,0.3)',
    borderWidth: 1,
    titleColor: '#d4a843',
    bodyColor: '#e8dcc8',
    padding: 10,
    cornerRadius: 8,
    titleFont: { family: 'DM Sans', size: 12 },
    bodyFont:  { family: 'DM Sans', size: 12 },
  };
}

// ── 3. Chart toggle ──────────────────────────────────────────────
function switchChart(mode) {
  if (mode === chartMode || !soilChart) return;
  chartMode = mode;

  const prevBar   = soilChart._bar;
  const prevRadar = soilChart._radar;

  document.getElementById('btnBar').classList.toggle('active',   mode === 'bar');
  document.getElementById('btnRadar').classList.toggle('active', mode === 'radar');

  soilChart.destroy();
  const ctx     = document.getElementById('soilChart').getContext('2d');
  const dataset = mode === 'bar' ? prevBar : prevRadar;

  soilChart = new Chart(ctx, {
    type: mode === 'radar' ? 'radar' : 'bar',
    data: { labels: LABELS, datasets: [dataset] },
    options: mode === 'radar' ? radarOptions() : barOptions(),
  });
  soilChart._bar   = prevBar;
  soilChart._radar = prevRadar;
}

// ── 4. Update chart data ─────────────────────────────────────────
function updateChart(soil) {
  if (!soilChart) return;
  soilChart.data.datasets[0].data = KEYS.map(k => +(soil[k] || 0).toFixed(2));
  soilChart.update('active');
}

// ── 5. Update metric cards + flash ───────────────────────────────
function updateMetricCard(id, barId, value, max) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = Number.isInteger(value) ? value : +value.toFixed(2);
  el.classList.remove('flash');
  void el.offsetWidth; // reflow to restart animation
  el.classList.add('flash');
  const bar = document.getElementById(barId);
  if (bar) bar.style.width = Math.min(value / max * 100, 100).toFixed(1) + '%';
}

function updateAllCards(soil) {
  updateMetricCard('val-ph',    'bar-ph',    soil.pH,       14);
  updateMetricCard('val-n',     'bar-n',     soil.N,        150);
  updateMetricCard('val-p',     'bar-p',     soil.P,        150);
  updateMetricCard('val-k',     'bar-k',     soil.K,        200);
  updateMetricCard('val-temp',  'bar-temp',  soil.Temp,     50);
  updateMetricCard('val-moist', 'bar-moist', soil.Moisture, 500);
  const ec  = document.getElementById('val-ec');
  const hum = document.getElementById('val-humid');
  if (ec)  ec.textContent  = (+soil.EC).toFixed(2) + ' dS/m';
  if (hum) hum.textContent = soil.Humidity + '%';
}

// ── 6. Timestamp ─────────────────────────────────────────────────
function setTimestamp() {
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const el1  = document.getElementById('lastUpdated');
  const el2  = document.getElementById('lastUpdatedBar');
  if (el1) el1.textContent = 'Updated ' + time;
  if (el2) el2.textContent = 'Today, '  + time;
}

// ── 7. Live polling every 10s ────────────────────────────────────
setInterval(() => {
  fetch('/get_soil')
    .then(r => r.json())
    .then(data => {
      const soil       = data.soil;
      const suggestion = data.suggestion;
      updateChart(soil);
      updateAllCards(soil);
      setTimestamp();
      const suggestEl = document.getElementById('smartCrop');
      if (suggestEl && suggestion) {
        suggestEl.textContent = suggestion.icon + ' ' + suggestion.name;
      }
    })
    .catch(err => console.warn('Soil fetch error:', err));
}, 10000);

// ── 8. Crop recommendation ───────────────────────────────────────
function fetchCrop(crop, btn) {
  document.querySelectorAll('.crop-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  const rec   = document.getElementById('cropRecommendation');
  const title = document.getElementById('recTitle');
  const list  = document.getElementById('recList');

  fetch('/crop/' + crop)
    .then(r => r.json())
    .then(data => {
      title.textContent = data.title || crop;
      list.innerHTML    = (data.tips || []).map(t => '<li>' + t + '</li>').join('');
      rec.classList.remove('hidden');
    })
    .catch(() => {
      title.textContent = crop;
      list.innerHTML    = '<li>Could not load recommendation.</li>';
      rec.classList.remove('hidden');
    });
}

// ── 9. Live clock ────────────────────────────────────────────────
function updateClock() {
  const now = new Date();
  const clockEl = document.getElementById('liveClock');
  const dateEl  = document.getElementById('liveDate');
  if (clockEl) clockEl.textContent = now.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit', second:'2-digit' });
  if (dateEl)  dateEl.textContent  = now.toLocaleDateString([], { weekday:'short', day:'numeric', month:'short' });
}
setInterval(updateClock, 1000);
updateClock();

// ── 10. Theme toggle ─────────────────────────────────────────────
function toggleTheme() {
  const isLight = document.body.classList.toggle('light-mode');
  const btn     = document.querySelector('.theme-toggle');
  if (btn) btn.textContent = isLight ? '🌞' : '🌙';
}

// ── 11. Banner slider ────────────────────────────────────────────
(function startBanner() {
  const slides = document.querySelectorAll('.banner-slide');
  if (!slides.length) return;
  let current = 0;
  setInterval(() => {
    slides[current].classList.remove('active');
    current = (current + 1) % slides.length;
    slides[current].classList.add('active');
  }, 3000);
})();

// ── 12. Voice assistant ──────────────────────────────────────────
function startVoiceAssistant() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { alert('Voice recognition not supported in this browser.'); return; }
  const recognition = new SR();
  recognition.lang  = 'en-US';
  recognition.start();
  recognition.onresult = function (event) {
    const command = event.results[0][0].transcript;
    alert('Voice Command: ' + command);
  };
  recognition.onerror = function (event) {
    console.warn('Voice error:', event.error);
  };
}

