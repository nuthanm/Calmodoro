// Calmodoro – Break Page (triptych + countdown)

const MOVE_TIPS = {
  stretch: 'Reach up, roll shoulders — undo desk posture.',
  walk: 'Take a short walk — even 2 minutes boosts circulation.'
};

let breakMode = 'shortBreak';
let breakDurationMs = 5 * 60 * 1000;
let breakEndTime = null;
let breakRunning = false;
let countdownTimer = null;

document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('anim-hydrate').innerHTML = svgHydrate();
  document.getElementById('anim-blink').innerHTML = svgBlink();
  showMove('stretch');

  document.querySelectorAll('#move-toggle button').forEach((btn) => {
    btn.addEventListener('click', () => showMove(btn.dataset.anim));
  });

  const state = await sendMsg({ action: 'getState' });
  breakMode = state.mode || 'shortBreak';
  breakDurationMs = state.remainingMs || durationFromSettings(breakMode, state.settings);

  applyModeUI(breakMode);
  updateCountdownDisplay(breakDurationMs);

  document.getElementById('accept-btn').addEventListener('click', acceptBreak);
  document.getElementById('skip-btn').addEventListener('click', skipBreak);

  document.getElementById('sound-btn').addEventListener('click', function () {
    this.textContent = this.textContent === '🔕' ? '🔔' : '🔕';
  });

  if (state.settings?.autoStartBreak) {
    acceptBreak();
  }
});

window.addEventListener('unload', () => {
  if (countdownTimer) clearInterval(countdownTimer);
});

function showMove(type) {
  document.getElementById('anim-move').innerHTML = type === 'walk' ? svgWalk() : svgStretch();
  document.getElementById('move-tip').textContent = MOVE_TIPS[type];
  document.querySelectorAll('#move-toggle button').forEach((b) => {
    b.classList.toggle('active', b.dataset.anim === type);
  });
}

function applyModeUI(mode) {
  const isLong = mode === 'longBreak';
  if (isLong) document.body.classList.add('long-break');

  document.getElementById('break-badge').textContent = isLong ? 'Long Break' : 'Short Break';
  document.getElementById('break-heading').textContent = isLong
    ? 'Time for a long break!'
    : 'Time to recharge';
  document.getElementById('break-sub').textContent = isLong
    ? 'Walk · Eat mindfully · Breathe deeply'
    : 'Hydrate · Rest your eyes · Move your body';

  if (isLong) showMove('walk');
}

async function acceptBreak() {
  if (breakRunning) return;
  breakRunning = true;
  breakEndTime = Date.now() + breakDurationMs;
  document.getElementById('accept-btn').disabled = true;

  await sendMsg({ action: 'acceptBreak' });
  countdownTimer = setInterval(tick, 500);
}

function tick() {
  const remaining = Math.max(0, breakEndTime - Date.now());
  updateCountdownDisplay(remaining);
  if (remaining <= 0) {
    clearInterval(countdownTimer);
    onBreakEnd();
  }
}

function onBreakEnd() {
  breakRunning = false;
  document.getElementById('countdown-time').textContent = '00:00';
  document.getElementById('break-heading').textContent = 'Break complete!';
  document.getElementById('break-sub').textContent = 'Ready to focus again?';
  setTimeout(() => window.close(), 3000);
}

async function skipBreak() {
  if (countdownTimer) clearInterval(countdownTimer);
  await sendMsg({ action: 'skipBreak' });
  window.close();
}

function updateCountdownDisplay(ms) {
  const mm = String(Math.floor(ms / 60000)).padStart(2, '0');
  const ss = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0');
  document.getElementById('countdown-time').textContent = `${mm}:${ss}`;
}

function sendMsg(msg) {
  return chrome.runtime.sendMessage(msg);
}

function durationFromSettings(mode, settings = {}) {
  switch (mode) {
    case 'shortBreak': return (settings.shortBreakDuration || 5) * 60000;
    case 'longBreak':  return (settings.longBreakDuration || 15) * 60000;
    default:           return (settings.workDuration || 25) * 60000;
  }
}
