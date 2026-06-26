// Calmodoro – Break Page Script
// Displays break countdown, runs Lottie animation (loops during break period),
// and handles skip / start-break actions.

const BREAK_TIPS = {
  shortBreak: [
    '🧘 Stand up and stretch your arms overhead',
    '👁️ Look 20 ft away for 20 seconds to rest your eyes',
    '💧 Drink a glass of water'
  ],
  longBreak: [
    '🚶 Take a short walk outside',
    '🥗 Grab a healthy snack or meal',
    '🎵 Listen to calming music for a few minutes',
    '🌬️ Try 4-7-8 breathing: inhale 4s, hold 7s, exhale 8s'
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

  // Tips
  const tips    = BREAK_TIPS[mode] || BREAK_TIPS.shortBreak;
  const tipsEl  = document.getElementById('break-tips');
  tipsEl.innerHTML = tips.map((t) => `<li>${t}</li>`).join('');
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
