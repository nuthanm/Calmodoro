// Calmodoro – Break Page Script
// Displays break countdown, runs Lottie animation (loops during break period),
// and handles skip / start-break actions.

/* ── Wellness card data ──────────────────────────────── */
const SVG_HYDRATE = `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M32 8 C32 8 16 28 16 38 a16 16 0 0 0 32 0 C48 28 32 8 32 8Z" fill="#29b6f6" opacity=".25"/>
  <path d="M32 14 C32 14 19 31 19 39 a13 13 0 0 0 26 0 C45 31 32 14 32 14Z" fill="#29b6f6" opacity=".55"/>
  <path d="M32 20 C32 20 22 34 22 40 a10 10 0 0 0 20 0 C42 34 32 20 32 20Z" fill="#29b6f6"/>
  <ellipse cx="27" cy="38" rx="3" ry="5" fill="white" opacity=".35" transform="rotate(-20 27 38)"/>
</svg>`;

// SVG_BLINK: original artwork created for Calmodoro – no third-party attribution required.
const SVG_BLINK = `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" role="img">
  <title>Boy and girl with blinking eyes</title>

  <!-- ── Boy (left, centered ~16,34) ── -->
  <!-- face -->
  <circle cx="16" cy="34" r="13" fill="#FFD5A8"/>
  <!-- hair cap with spiky top -->
  <path d="M4 28 Q5 14 16 13 Q27 14 28 28 Q24 18 20 20 Q19 14 16 13 Q13 14 12 20 Q8 18 4 28Z" fill="#6B3A2A"/>
  <!-- spikes -->
  <path d="M9 20 Q7 13 11 16Z" fill="#6B3A2A"/>
  <path d="M16 13 Q15 8 17 11Z" fill="#6B3A2A"/>
  <path d="M23 20 Q25 13 21 16Z" fill="#6B3A2A"/>
  <!-- blinking eyes (downward arcs = closed happy) -->
  <path d="M9 31 Q12.5 27 16 31" stroke="#3D2B1F" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M16 31 Q19.5 27 23 31" stroke="#3D2B1F" stroke-width="2" fill="none" stroke-linecap="round"/>
  <!-- rosy cheeks -->
  <ellipse cx="7"  cy="38" rx="3.5" ry="2" fill="#FF9999" opacity=".55"/>
  <ellipse cx="25" cy="38" rx="3.5" ry="2" fill="#FF9999" opacity=".55"/>
  <!-- smile -->
  <path d="M11 41 Q16 46 21 41" stroke="#C07060" stroke-width="1.8" fill="none" stroke-linecap="round"/>

  <!-- ── Girl (right, centered ~48,34) ── -->
  <!-- face -->
  <circle cx="48" cy="34" r="13" fill="#FFD5A8"/>
  <!-- hair cap -->
  <path d="M36 28 Q37 14 48 13 Q59 14 60 28 Q56 18 52 20 Q51 14 48 13 Q45 14 44 20 Q40 18 36 28Z" fill="#A0522D"/>
  <!-- pigtails -->
  <circle cx="36" cy="37" r="5" fill="#A0522D"/>
  <circle cx="60" cy="37" r="5" fill="#A0522D"/>
  <!-- hair bow -->
  <path d="M44 13 Q46 9 48 12 Q46 15 44 13Z" fill="#E91E63"/>
  <path d="M52 13 Q50 9 48 12 Q50 15 52 13Z" fill="#E91E63"/>
  <circle cx="48" cy="12" r="2" fill="#AD1457"/>
  <!-- eyelashes (grouped for shared style) -->
  <g stroke="#3D2B1F" stroke-width="1.2" stroke-linecap="round">
    <line x1="41" y1="28" x2="40" y2="25"/>
    <line x1="44" y1="27" x2="44" y2="24"/>
    <line x1="47" y1="27" x2="47" y2="24"/>
    <line x1="51" y1="27" x2="51" y2="24"/>
    <line x1="54" y1="27" x2="54" y2="24"/>
  </g>
  <!-- blinking eyes -->
  <path d="M41 31 Q44.5 27 48 31" stroke="#3D2B1F" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M48 31 Q51.5 27 55 31" stroke="#3D2B1F" stroke-width="2" fill="none" stroke-linecap="round"/>
  <!-- rosy cheeks -->
  <ellipse cx="39" cy="38" rx="3.5" ry="2" fill="#FF9999" opacity=".55"/>
  <ellipse cx="57" cy="38" rx="3.5" ry="2" fill="#FF9999" opacity=".55"/>
  <!-- smile -->
  <path d="M43 41 Q48 46 53 41" stroke="#C07060" stroke-width="1.8" fill="none" stroke-linecap="round"/>
</svg>`;

const SVG_STRETCH = `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- head -->
  <circle cx="32" cy="11" r="6" fill="#a5d6a7"/>
  <!-- body -->
  <line x1="32" y1="17" x2="32" y2="38" stroke="#a5d6a7" stroke-width="3" stroke-linecap="round"/>
  <!-- arms raised -->
  <line x1="32" y1="24" x2="14" y2="16" stroke="#a5d6a7" stroke-width="3" stroke-linecap="round"/>
  <line x1="32" y1="24" x2="50" y2="16" stroke="#a5d6a7" stroke-width="3" stroke-linecap="round"/>
  <!-- hands -->
  <circle cx="13" cy="15" r="2.5" fill="#a5d6a7"/>
  <circle cx="51" cy="15" r="2.5" fill="#a5d6a7"/>
  <!-- legs -->
  <line x1="32" y1="38" x2="22" y2="54" stroke="#a5d6a7" stroke-width="3" stroke-linecap="round"/>
  <line x1="32" y1="38" x2="42" y2="54" stroke="#a5d6a7" stroke-width="3" stroke-linecap="round"/>
  <!-- feet -->
  <circle cx="21" cy="55" r="2.5" fill="#a5d6a7"/>
  <circle cx="43" cy="55" r="2.5" fill="#a5d6a7"/>
  <!-- motion arcs -->
  <path d="M10 20 Q8 12 13 8" stroke="#a5d6a7" stroke-width="1.5" fill="none" opacity=".5" stroke-dasharray="2 2"/>
  <path d="M54 20 Q56 12 51 8" stroke="#a5d6a7" stroke-width="1.5" fill="none" opacity=".5" stroke-dasharray="2 2"/>
</svg>`;

const SVG_WALK = `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- head -->
  <circle cx="36" cy="10" r="6" fill="#ffcc80"/>
  <!-- body -->
  <line x1="36" y1="16" x2="34" y2="34" stroke="#ffcc80" stroke-width="3" stroke-linecap="round"/>
  <!-- arms swing -->
  <line x1="34" y1="24" x2="20" y2="20" stroke="#ffcc80" stroke-width="3" stroke-linecap="round"/>
  <line x1="34" y1="24" x2="46" y2="30" stroke="#ffcc80" stroke-width="3" stroke-linecap="round"/>
  <circle cx="19" cy="19" r="2.5" fill="#ffcc80"/>
  <circle cx="47" cy="31" r="2.5" fill="#ffcc80"/>
  <!-- legs stride -->
  <line x1="34" y1="34" x2="22" y2="52" stroke="#ffcc80" stroke-width="3" stroke-linecap="round"/>
  <line x1="34" y1="34" x2="44" y2="50" stroke="#ffcc80" stroke-width="3" stroke-linecap="round"/>
  <circle cx="21" cy="53" r="2.5" fill="#ffcc80"/>
  <circle cx="45" cy="51" r="2.5" fill="#ffcc80"/>
  <!-- motion lines -->
  <line x1="10" y1="34" x2="16" y2="34" stroke="#ffcc80" stroke-width="1.5" stroke-linecap="round" opacity=".5"/>
  <line x1="8"  y1="38" x2="15" y2="38" stroke="#ffcc80" stroke-width="1.5" stroke-linecap="round" opacity=".35"/>
</svg>`;

const SVG_EAT = `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- plate -->
  <ellipse cx="32" cy="44" rx="22" ry="6" fill="#37474f" opacity=".4"/>
  <circle cx="32" cy="38" r="18" fill="#455a64" opacity=".3"/>
  <circle cx="32" cy="38" r="14" fill="#546e7a" opacity=".4"/>
  <!-- salad leaves -->
  <ellipse cx="26" cy="34" rx="6" ry="4" fill="#66bb6a" transform="rotate(-20 26 34)"/>
  <ellipse cx="38" cy="34" rx="6" ry="4" fill="#4caf50" transform="rotate(20 38 34)"/>
  <ellipse cx="32" cy="31" rx="5" ry="3.5" fill="#81c784"/>
  <!-- fork -->
  <line x1="16" y1="20" x2="16" y2="50" stroke="#90a4ae" stroke-width="2" stroke-linecap="round"/>
  <line x1="13" y1="20" x2="13" y2="28" stroke="#90a4ae" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="16" y1="20" x2="16" y2="28" stroke="#90a4ae" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="19" y1="20" x2="19" y2="28" stroke="#90a4ae" stroke-width="1.5" stroke-linecap="round"/>
</svg>`;

const SVG_BREATHE = `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="32" cy="32" r="20" fill="#ce93d8" opacity=".12"/>
  <circle cx="32" cy="32" r="14" fill="#ce93d8" opacity=".2"/>
  <circle cx="32" cy="32" r="8"  fill="#ce93d8" opacity=".4"/>
  <circle cx="32" cy="32" r="4"  fill="#ce93d8" opacity=".9"/>
  <!-- breath arcs -->
  <path d="M32 8 Q44 8 50 18" stroke="#ce93d8" stroke-width="1.5" fill="none" opacity=".5" stroke-linecap="round"/>
  <path d="M32 8 Q20 8 14 18" stroke="#ce93d8" stroke-width="1.5" fill="none" opacity=".5" stroke-linecap="round"/>
</svg>`;

const BREAK_CARDS = {
  shortBreak: [
    { svg: SVG_HYDRATE, title: 'Hydrate',  desc: 'Drink a glass of water' },
    { svg: SVG_BLINK,   title: 'Blink',    desc: 'Look 20 ft away for 20 s' },
    { svg: SVG_STRETCH, title: 'Stretch',  desc: 'Stand up, arms overhead' }
  ],
  longBreak: [
    { svg: SVG_WALK,    title: 'Walk',     desc: 'Take a short walk outside' },
    { svg: SVG_EAT,     title: 'Eat',      desc: 'Grab a healthy snack' },
    { svg: SVG_BREATHE, title: 'Breathe',  desc: '4-7-8: inhale, hold, exhale' }
  ]
};

// Lottie animation source paths (relative to extension root)
const ANIM_SOURCES = {
  shortBreak: 'lottie/animations/stretch.json',
  longBreak:  'lottie/animations/water.json'
};

let breakMode      = 'shortBreak';
let breakDurationMs = 5 * 60 * 1000;
let breakStartTime  = null;
let breakEndTime    = null;
let breakRunning    = false;
let countdownTimer  = null;
let lottieAnim      = null;

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', async () => {
  const state = await getState();

  breakMode        = state.mode || 'shortBreak';
  breakDurationMs  = state.remainingMs || durationFromSettings(breakMode, state.settings);

  applyModeUI(breakMode, state.settings);
  updateCountdownDisplay(breakDurationMs);

  // Load Lottie animation (non-blocking)
  loadLottieAnimation(breakMode);

  // Buttons
  document.getElementById('start-break-btn').addEventListener('click', startBreak);
  document.getElementById('skip-btn').addEventListener('click', skipBreak);

  // If auto-start is on, kick off automatically
  if (state.settings && state.settings.autoStartBreak) {
    startBreak();
  }
});

window.addEventListener('unload', () => {
  if (countdownTimer) clearInterval(countdownTimer);
  stopLottie();
});

// ---------------------------------------------------------------------------
// Break lifecycle
// ---------------------------------------------------------------------------

function startBreak() {
  if (breakRunning) return;
  breakRunning = true;

  breakStartTime = Date.now();
  breakEndTime   = breakStartTime + breakDurationMs;

  document.getElementById('start-break-btn').disabled = true;

  // Tell background to track break time (for badge)
  sendMsg({ action: 'startBreak' });

  // Start Lottie loop
  playLottie();

  // Start countdown
  countdownTimer = setInterval(tick, 500);
}

function tick() {
  const remaining = Math.max(0, breakEndTime - Date.now());
  updateCountdownDisplay(remaining);

  if (remaining <= 0) {
    clearInterval(countdownTimer);
    stopLottie();
    onBreakEnd();
  }
}

function onBreakEnd() {
  breakRunning = false;
  document.getElementById('countdown-time').textContent = '00:00';
  document.getElementById('break-heading').textContent = '✓ Break complete!';
  document.getElementById('break-sub').textContent     = 'Ready to focus again?';

  // Auto-close window after 3 seconds
  setTimeout(() => window.close(), 3000);
}

async function skipBreak() {
  if (countdownTimer) clearInterval(countdownTimer);
  stopLottie();
  await sendMsg({ action: 'skipBreak' });
  window.close();
}

// ---------------------------------------------------------------------------
// UI helpers
// ---------------------------------------------------------------------------

function applyModeUI(mode, settings) {
  const isLong = mode === 'longBreak';

  // Body class for color theme
  if (isLong) document.body.classList.add('long-break');

  // Badge label
  document.getElementById('break-badge').textContent = isLong ? 'Long Break' : 'Short Break';
  if (isLong) document.getElementById('break-badge').classList.add('long');

  // Heading
  document.getElementById('break-heading').textContent = isLong
    ? 'Time for a long break!'
    : 'Time to recharge!';

  // Break-specific icon
  document.getElementById('anim-icon').textContent = isLong ? '🛋️' : '🧘';

  // Wellness cards
  const cards   = BREAK_CARDS[mode] || BREAK_CARDS.shortBreak;
  const tipsEl  = document.getElementById('break-tips');
  tipsEl.innerHTML = cards.map(({ svg, title, desc }) => `
    <div class="wellness-card">
      <div class="wellness-icon" aria-hidden="true">${svg}</div>
      <div class="wellness-title">${title}</div>
      <div class="wellness-desc">${desc}</div>
    </div>`).join('');
}

function updateCountdownDisplay(ms) {
  const mm = String(Math.floor(ms / 60000)).padStart(2, '0');
  const ss = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0');
  document.getElementById('countdown-time').textContent = `${mm}:${ss}`;
}

// ---------------------------------------------------------------------------
// Lottie integration
// ---------------------------------------------------------------------------

async function loadLottieAnimation(mode) {
  // lottie-web must be included as lottie/lottie.min.js
  if (typeof lottie === 'undefined') return;

  const animPath = chrome.runtime.getURL(ANIM_SOURCES[mode] || ANIM_SOURCES.shortBreak);

  try {
    lottieAnim = lottie.loadAnimation({
      container: document.getElementById('lottie-container'),
      renderer:  'svg',
      loop:      true,
      autoplay:  false,
      path:      animPath
    });

    lottieAnim.addEventListener('DOMLoaded', () => {
      // Hide CSS fallback, show Lottie
      document.getElementById('lottie-container').classList.add('loaded');
      document.getElementById('css-anim').style.display = 'none';
      // Only play during break period; will be started in playLottie()
    });

    lottieAnim.addEventListener('error', () => {
      // Lottie failed; CSS fallback remains visible
      lottieAnim = null;
    });
  } catch (e) {
    lottieAnim = null;
  }
}

function playLottie() {
  if (lottieAnim) {
    // Loop animation only during break period
    lottieAnim.loop = true;
    lottieAnim.play();
  }
}

function stopLottie() {
  if (lottieAnim) {
    lottieAnim.stop();
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getState() {
  return chrome.runtime.sendMessage({ action: 'getState' });
}

function sendMsg(msg) {
  return chrome.runtime.sendMessage(msg);
}

function durationFromSettings(mode, settings = {}) {
  switch (mode) {
    case 'shortBreak': return (settings.shortBreakDuration || 5)  * 60000;
    case 'longBreak':  return (settings.longBreakDuration  || 15) * 60000;
    default:           return (settings.workDuration       || 25) * 60000;
  }
}
