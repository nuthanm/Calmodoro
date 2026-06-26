// Calmodoro – Popup Script
// Drives the timer display, badge updates (while popup is open), and button interactions.

const CIRCUMFERENCE = 2 * Math.PI * 96; // r = 96 → ≈ 603.2

const MODE_COLORS = {
  work:       '#e53935',
  shortBreak: '#43a047',
  longBreak:  '#1e88e5'
};

const MODE_LABELS = {
  work:       'Focus',
  shortBreak: 'Short Break',
  longBreak:  'Long Break'
};

let pollInterval = null;
let lastState    = null;

// ---------------------------------------------------------------------------
// Initialise
// ---------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', async () => {
  await loadAndRender();

  // Mode tab clicks
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => switchMode(tab.dataset.mode));
  });

  // Start / Pause / Resume
  document.getElementById('start-btn').addEventListener('click', handleStartPause);

  // Reset
  document.getElementById('reset-btn').addEventListener('click', async () => {
    const state = await sendMsg({ action: 'reset' });
    renderState(state);
  });

  // Settings
  document.getElementById('settings-btn').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
  });

  // DND toggle
  document.getElementById('dnd-toggle').addEventListener('change', async (e) => {
    const settings = await getSettings();
    settings.doNotDisturb = e.target.checked;
    await chrome.storage.local.set({ settings });
  });

  // Poll every second for live countdown + badge update
  pollInterval = setInterval(poll, 1000);
});

window.addEventListener('unload', () => {
  if (pollInterval) clearInterval(pollInterval);
});

// ---------------------------------------------------------------------------
// Polling
// ---------------------------------------------------------------------------

async function poll() {
  try {
    const state = await sendMsg({ action: 'getState' });
    renderState(state);
    syncBadge(state);
  } catch (_) {
    // Service worker may have restarted; it will recover on next tick.
  }
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

async function loadAndRender() {
  try {
    const state = await sendMsg({ action: 'getState' });
    renderState(state);

    // Restore DND checkbox from storage
    const data = await chrome.storage.local.get('settings');
    const dnd = (data.settings || {}).doNotDisturb || false;
    document.getElementById('dnd-toggle').checked = dnd;
  } catch (e) {
    console.error('Failed to load state:', e);
  }
}

function renderState(state) {
  if (!state || state.error) return;
  lastState = state;

  const { mode, remainingMs, sessionCount, settings = {}, state: timerState } = state;
  const totalMs = modeTotalMs(mode, settings);

  // Time display
  const mm  = String(Math.floor(remainingMs / 60000)).padStart(2, '0');
  const ss  = String(Math.floor((remainingMs % 60000) / 1000)).padStart(2, '0');
  document.getElementById('timer-display').textContent = `${mm}:${ss}`;
  document.getElementById('timer-label').textContent   = MODE_LABELS[mode] || 'Focus';

  // Progress ring
  const progress = totalMs > 0 ? 1 - remainingMs / totalMs : 0;
  const offset   = CIRCUMFERENCE * (1 - progress);
  const ring     = document.getElementById('ring-progress');
  ring.style.strokeDashoffset = offset;
  ring.style.stroke           = MODE_COLORS[mode] || MODE_COLORS.work;

  // Active tab
  document.querySelectorAll('.tab').forEach((tab) => {
    const isActive = tab.dataset.mode === mode;
    tab.classList.toggle('active', isActive);
    tab.setAttribute('aria-selected', isActive);
  });

  // Primary button label
  const startBtn = document.getElementById('start-btn');
  startBtn.style.background = MODE_COLORS[mode] || MODE_COLORS.work;
  if (timerState === 'running' || timerState === 'break') {
    startBtn.textContent = 'Pause';
  } else if (timerState === 'paused') {
    startBtn.textContent = 'Resume';
  } else {
    startBtn.textContent = 'Start';
  }

  // Session dots
  const dotsEl  = document.getElementById('session-dots');
  const total   = settings.sessionsBeforeLongBreak || 4;
  const done    = sessionCount % total;
  dotsEl.innerHTML = '';
  for (let i = 0; i < total; i++) {
    const dot = document.createElement('span');
    dot.className = `dot${i < done ? ' done' : ''}`;
    if (i < done) dot.style.background = MODE_COLORS[mode];
    dotsEl.appendChild(dot);
  }
}

// ---------------------------------------------------------------------------
// Badge sync (second-level precision while popup is open)
// ---------------------------------------------------------------------------

function syncBadge(state) {
  if (!state || state.error) return;
  const { state: timerState, remainingMs, mode } = state;

  if (timerState === 'running' || timerState === 'break') {
    const mm  = String(Math.floor(remainingMs / 60000)).padStart(2, '0');
    const ss  = String(Math.floor((remainingMs % 60000) / 1000)).padStart(2, '0');
    chrome.action.setBadgeText({ text: `${mm}:${ss}` });
    chrome.action.setBadgeBackgroundColor({ color: MODE_COLORS[mode] || '#e53935' });
  } else if (timerState === 'paused') {
    chrome.action.setBadgeText({ text: '⏸' });
    chrome.action.setBadgeBackgroundColor({ color: '#888888' });
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

async function handleStartPause() {
  const state = await sendMsg({ action: 'getState' });
  let next;
  if (state.state === 'running' || state.state === 'break') {
    next = await sendMsg({ action: 'pause' });
  } else if (state.state === 'paused') {
    next = await sendMsg({ action: 'resume' });
  } else {
    next = await sendMsg({ action: 'start' });
  }
  renderState(next);
}

async function switchMode(mode) {
  const state = await sendMsg({ action: 'setMode', mode });
  renderState(state);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sendMsg(msg) {
  return chrome.runtime.sendMessage(msg);
}

async function getSettings() {
  const data = await chrome.storage.local.get('settings');
  return { ...defaultSettings(), ...(data.settings || {}) };
}

function defaultSettings() {
  return {
    workDuration: 25, shortBreakDuration: 5, longBreakDuration: 15,
    sessionsBeforeLongBreak: 4, autoStartBreak: false, autoStartWork: false,
    doNotDisturb: false, breakWindowMode: 'popup'
  };
}

function modeTotalMs(mode, settings) {
  switch (mode) {
    case 'shortBreak': return (settings.shortBreakDuration || 5)  * 60000;
    case 'longBreak':  return (settings.longBreakDuration  || 15) * 60000;
    default:           return (settings.workDuration       || 25) * 60000;
  }
}
