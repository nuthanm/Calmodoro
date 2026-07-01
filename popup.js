// Calmodoro – Popup Script

const CIRCUMFERENCE = 2 * Math.PI * 96;
const { MODE_COLORS, mergeSettings } = CalmodoroSettings;

const MODE_LABELS = {
  work: 'Focus',
  shortBreak: 'Short Break',
  longBreak: 'Long Break'
};

const MODE_CSS = {
  work:       { color: '#E07A5F', soft: 'rgba(224,122,95,0.12)' },
  shortBreak: { color: '#7C9A82', soft: 'rgba(124,154,130,0.14)' },
  longBreak:  { color: '#6BA3BE', soft: 'rgba(107,163,190,0.14)' }
};

let pollInterval = null;

document.addEventListener('DOMContentLoaded', async () => {
  await loadAndRender();

  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => switchMode(tab.dataset.mode));
  });

  document.getElementById('start-btn').addEventListener('click', handleStartPause);
  document.getElementById('reset-btn').addEventListener('click', async () => {
    renderState(await sendMsg({ action: 'reset' }));
  });

  document.getElementById('settings-btn').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
  });

  document.getElementById('stats-btn').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('stats.html') });
  });

  document.getElementById('dnd-toggle').addEventListener('change', async (e) => {
    const settings = await getSettings();
    settings.doNotDisturb = e.target.checked;
    await chrome.storage.local.set({ settings });
    try { await sendMsg({ action: 'settingsUpdated' }); } catch (_) { /* ignore */ }
  });

  pollInterval = setInterval(poll, 1000);
});

window.addEventListener('unload', () => {
  if (pollInterval) clearInterval(pollInterval);
});

async function poll() {
  try {
    const state = await sendMsg({ action: 'getState' });
    renderState(state);
    syncBadge(state);
  } catch (_) { /* service worker restart */ }
}

async function loadAndRender() {
  const state = await sendMsg({ action: 'getState' });
  renderState(state);
  const data = await chrome.storage.local.get('settings');
  document.getElementById('dnd-toggle').checked = mergeSettings(data.settings).doNotDisturb;
}

function renderState(state) {
  if (!state || state.error) return;

  const { mode, remainingMs, sessionCount, settings = {}, state: timerState, stats = {}, scheduleActive } = state;
  const totalMs = modeTotalMs(mode, settings);

  applyModeTheme(mode);

  const mm = String(Math.floor(remainingMs / 60000)).padStart(2, '0');
  const ss = String(Math.floor((remainingMs % 60000) / 1000)).padStart(2, '0');
  document.getElementById('timer-display').textContent = `${mm}:${ss}`;
  document.getElementById('timer-label').textContent = MODE_LABELS[mode] || 'Focus';

  const progress = totalMs > 0 ? 1 - remainingMs / totalMs : 0;
  const ring = document.getElementById('ring-progress');
  ring.style.strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  document.querySelectorAll('.tab').forEach((tab) => {
    const isActive = tab.dataset.mode === mode;
    tab.classList.toggle('active', isActive);
    tab.setAttribute('aria-selected', isActive);
  });

  const startBtn = document.getElementById('start-btn');
  if (timerState === 'running' || timerState === 'break') {
    startBtn.textContent = 'Pause';
  } else if (timerState === 'paused') {
    startBtn.textContent = 'Resume';
  } else {
    startBtn.textContent = mode === 'work' ? 'Start Focus' : 'Start Break';
  }

  const dotsEl = document.getElementById('session-dots');
  const total = settings.sessionsBeforeLongBreak || 4;
  const done = sessionCount % total;
  dotsEl.innerHTML = '';
  for (let i = 0; i < total; i++) {
    const dot = document.createElement('span');
    dot.className = `dot${i < done ? ' done' : ''}`;
    dotsEl.appendChild(dot);
  }

  document.getElementById('stat-focus').textContent = stats.focusCompleted || 0;
  document.getElementById('stat-breaks').textContent = stats.breaksAccepted || 0;
  document.getElementById('stat-skipped').textContent =
    (stats.breaksSkipped || 0) + (stats.remindersSkipped || 0);
  document.getElementById('stat-eyes').textContent = stats.reminderBlink || 0;

  document.getElementById('schedule-banner').classList.toggle('hidden', scheduleActive !== false);
}

function applyModeTheme(mode) {
  const theme = MODE_CSS[mode] || MODE_CSS.work;
  document.documentElement.style.setProperty('--mode-color', theme.color);
  document.documentElement.style.setProperty('--mode-soft', theme.soft);
}

function syncBadge(state) {
  if (!state || state.error) return;
  const { state: timerState, remainingMs, mode } = state;

  if (timerState === 'running' || timerState === 'break') {
    chrome.action.setBadgeText({ text: CalmodoroTimerUtils.formatBadgeCountdown(remainingMs) });
    chrome.action.setBadgeBackgroundColor({ color: MODE_COLORS[mode] || MODE_COLORS.work });
  } else if (timerState === 'paused') {
    chrome.action.setBadgeText({ text: '⏸' });
    chrome.action.setBadgeBackgroundColor({ color: '#9A948D' });
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

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
  if (next.scheduleBlocked) {
    document.getElementById('schedule-banner').classList.remove('hidden');
  }
  renderState(next);
}

async function switchMode(mode) {
  renderState(await sendMsg({ action: 'setMode', mode }));
}

function sendMsg(msg) {
  return chrome.runtime.sendMessage(msg);
}

async function getSettings() {
  const data = await chrome.storage.local.get('settings');
  return mergeSettings(data.settings);
}

function modeTotalMs(mode, settings) {
  return CalmodoroSchedule.modeDurationMs(mode, mergeSettings(settings));
}
