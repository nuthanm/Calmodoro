// Calmodoro – Background Service Worker
// Manages timer state, badge updates, alarms, and session lifecycle.

const DEFAULT_SETTINGS = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsBeforeLongBreak: 4,
  autoStartBreak: false,
  autoStartWork: false,
  doNotDisturb: false,
  breakWindowMode: 'popup'
};

const ALARM_SESSION_END = 'sessionEnd';
const ALARM_BADGE_TICK = 'badgeTick';

// ---------------------------------------------------------------------------
// Alarm handlers
// ---------------------------------------------------------------------------

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_SESSION_END) {
    await handleSessionEnd();
  } else if (alarm.name === ALARM_BADGE_TICK) {
    await updateBadge();
    await scheduleNextBadgeTick();
  }
});

// ---------------------------------------------------------------------------
// Message handler (from popup / settings / break page)
// ---------------------------------------------------------------------------

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  handleMessage(message).then(sendResponse).catch((err) => {
    console.error('Message handling error:', err);
    sendResponse({ error: String(err) });
  });
  return true; // async response
});

async function handleMessage(message) {
  switch (message.action) {
    case 'start':           return startTimer();
    case 'pause':           return pauseTimer();
    case 'resume':          return resumeTimer();
    case 'reset':           return resetTimer();
    case 'setMode':         return setMode(message.mode);
    case 'getState':        return getTimerState();
    case 'startBreak':      return startBreakTimer();
    case 'skipBreak':       return skipBreak();
    case 'settingsUpdated': return onSettingsUpdated();
    default:
      return { error: `Unknown action: ${message.action}` };
  }
}

// ---------------------------------------------------------------------------
// Timer operations
// ---------------------------------------------------------------------------

async function startTimer() {
  const { mode = 'work', settings: savedSettings } = await chrome.storage.local.get(['mode', 'settings']);
  const settings = { ...DEFAULT_SETTINGS, ...(savedSettings || {}) };
  const durationMs = modeDuration(mode, settings);
  const endTime = Date.now() + durationMs;

  await chrome.alarms.clearAll();
  await chrome.storage.local.set({ state: 'running', endTime, remainingMs: null });

  chrome.alarms.create(ALARM_SESSION_END, { when: endTime });
  await scheduleNextBadgeTick();
  await updateBadge();
  return getTimerState();
}

async function pauseTimer() {
  const { state, endTime } = await chrome.storage.local.get(['state', 'endTime']);
  if (state !== 'running') return getTimerState();

  const remainingMs = Math.max(0, endTime - Date.now());
  await chrome.alarms.clearAll();
  await chrome.storage.local.set({ state: 'paused', remainingMs, endTime: null });

  chrome.action.setBadgeText({ text: '⏸' });
  chrome.action.setBadgeBackgroundColor({ color: '#888888' });
  return getTimerState();
}

async function resumeTimer() {
  const { state, remainingMs } = await chrome.storage.local.get(['state', 'remainingMs']);
  if (state !== 'paused') return getTimerState();

  const endTime = Date.now() + remainingMs;
  await chrome.alarms.clearAll();
  await chrome.storage.local.set({ state: 'running', endTime, remainingMs: null });

  chrome.alarms.create(ALARM_SESSION_END, { when: endTime });
  await scheduleNextBadgeTick();
  await updateBadge();
  return getTimerState();
}

async function resetTimer() {
  await chrome.alarms.clearAll();
  await chrome.storage.local.set({ state: 'idle', endTime: null, remainingMs: null, mode: 'work' });
  chrome.action.setBadgeText({ text: '' });
  return getTimerState();
}

async function setMode(mode) {
  await chrome.alarms.clearAll();
  await chrome.storage.local.set({ state: 'idle', mode, endTime: null, remainingMs: null });
  chrome.action.setBadgeText({ text: '' });
  return getTimerState();
}

async function startBreakTimer() {
  const { mode = 'shortBreak', settings: savedSettings } = await chrome.storage.local.get(['mode', 'settings']);
  const settings = { ...DEFAULT_SETTINGS, ...(savedSettings || {}) };
  const durationMs = modeDuration(mode, settings);
  const endTime = Date.now() + durationMs;

  await chrome.alarms.clearAll();
  await chrome.storage.local.set({ state: 'break', endTime, remainingMs: null });

  chrome.alarms.create(ALARM_SESSION_END, { when: endTime });
  await scheduleNextBadgeTick();
  await updateBadge();
  return getTimerState();
}

async function skipBreak() {
  await chrome.alarms.clearAll();
  await chrome.storage.local.set({ state: 'idle', mode: 'work', endTime: null, remainingMs: null });
  chrome.action.setBadgeText({ text: '' });
  return getTimerState();
}

async function onSettingsUpdated() {
  // If idle, reset remaining time to new duration
  const { state, mode } = await chrome.storage.local.get(['state', 'mode']);
  if (state === 'idle') {
    await chrome.storage.local.set({ remainingMs: null });
  }
  return getTimerState();
}

// ---------------------------------------------------------------------------
// Session completion
// ---------------------------------------------------------------------------

async function handleSessionEnd() {
  const {
    mode = 'work',
    sessionCount: count = 0,
    settings: savedSettings,
    state
  } = await chrome.storage.local.get(['mode', 'sessionCount', 'settings', 'state']);

  const settings = { ...DEFAULT_SETTINGS, ...(savedSettings || {}) };

  let nextMode;
  let newSessionCount = count;

  if (mode === 'work') {
    newSessionCount = count + 1;
    if (newSessionCount % settings.sessionsBeforeLongBreak === 0) {
      nextMode = 'longBreak';
    } else {
      nextMode = 'shortBreak';
    }
  } else {
    // Break ended → back to work
    nextMode = 'work';
  }

  await chrome.storage.local.set({
    state: 'break_pending',
    mode: nextMode,
    sessionCount: newSessionCount,
    endTime: null,
    remainingMs: null
  });

  chrome.action.setBadgeText({ text: '' });

  if (!settings.doNotDisturb) {
    const isWorkEnd = mode === 'work';
    showNotification(isWorkEnd, nextMode);

    if (isWorkEnd) {
      // Open break animation window
      await openBreakWindow(settings.breakWindowMode);
    }
  }

  // Auto-start next session if configured
  if (mode !== 'work' && settings.autoStartWork) {
    await chrome.storage.local.set({ state: 'idle', mode: 'work' });
    await startTimer();
  } else if (mode === 'work' && settings.autoStartBreak && !settings.doNotDisturb) {
    await startBreakTimer();
  }
}

function showNotification(isWorkEnd, nextMode) {
  const breakLabel = nextMode === 'longBreak' ? 'long break' : 'short break';
  chrome.notifications.create({
    type: 'basic',
    iconUrl: chrome.runtime.getURL('icons/icon48.png'),
    title: isWorkEnd ? '🍅 Focus session complete!' : '⏰ Break over – back to work!',
    message: isWorkEnd
      ? `Time for a ${breakLabel}. Great work!`
      : 'Ready for the next focus session?',
    silent: false
  });
}

/**
 * Opens the break page using the user's preferred window placement mode.
 * Falls back to a centered popup-sized window if positioning information is unavailable.
 * @param {'popup' | 'fullWindow' | 'sideLeft' | 'sideRight'} mode
 */
async function openBreakWindow(mode = 'popup') {
  const breakUrl = chrome.runtime.getURL('break.html');
  const popupWidth = 520;
  const popupHeight = 640;
  const minSideWidth = 360;
  const sideWidthRatio = 0.45;

  if (mode === 'fullWindow') {
    await chrome.windows.create({
      url: breakUrl,
      type: 'popup',
      state: 'maximized',
      focused: true
    });
    return;
  }

  if (mode === 'sideLeft' || mode === 'sideRight') {
    try {
      const lastFocused = await chrome.windows.getLastFocused();
      const referenceWidth = Number(lastFocused.width) || popupWidth;
      const sideWidth = Math.max(minSideWidth, Math.floor(referenceWidth * sideWidthRatio));

      await chrome.windows.create({
        url: breakUrl,
        type: 'popup',
        focused: true,
        width: sideWidth,
        height: Number(lastFocused.height) || popupHeight,
        top: Number(lastFocused.top) || 0,
        left: mode === 'sideLeft'
          ? Number(lastFocused.left) || 0
          : Math.max(0, (Number(lastFocused.left) || 0) + referenceWidth - sideWidth)
      });
      return;
    } catch (err) {
      console.warn(`Unable to place side break window (${mode}), falling back to popup mode.`, err);
      // Fall through to default popup options.
    }
  }

  await chrome.windows.create({
    url: breakUrl,
    type: 'popup',
    width: popupWidth,
    height: popupHeight,
    focused: true
  });
}

// ---------------------------------------------------------------------------
// Badge helpers
// ---------------------------------------------------------------------------

async function updateBadge() {
  const { state, endTime } = await chrome.storage.local.get(['state', 'endTime']);

  if (state !== 'running' && state !== 'break') {
    return;
  }
  if (!endTime) return;

  const remaining = Math.max(0, endTime - Date.now());
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  const text = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const color = state === 'break' ? '#43a047' : '#e53935';
  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color });
}

async function scheduleNextBadgeTick() {
  const { state, endTime } = await chrome.storage.local.get(['state', 'endTime']);
  if ((state !== 'running' && state !== 'break') || !endTime) return;

  const remaining = endTime - Date.now();
  if (remaining <= 0) return;

  // Chrome 120+ supports a minimum alarm delay of 30 seconds (0.5 minutes)
  chrome.alarms.create(ALARM_BADGE_TICK, { delayInMinutes: 0.5 });
}

// ---------------------------------------------------------------------------
// State reader
// ---------------------------------------------------------------------------

async function getTimerState() {
  const data = await chrome.storage.local.get([
    'state', 'mode', 'endTime', 'remainingMs', 'sessionCount', 'settings'
  ]);

  const settings = { ...DEFAULT_SETTINGS, ...(data.settings || {}) };
  const state = data.state || 'idle';
  const mode = data.mode || 'work';

  let remainingMs;
  if (state === 'running' || state === 'break') {
    remainingMs = data.endTime ? Math.max(0, data.endTime - Date.now()) : modeDuration(mode, settings);
  } else if (state === 'paused') {
    remainingMs = data.remainingMs != null ? data.remainingMs : modeDuration(mode, settings);
  } else {
    remainingMs = modeDuration(mode, settings);
  }

  return { state, mode, remainingMs, sessionCount: data.sessionCount || 0, settings };
}

function modeDuration(mode, settings) {
  switch (mode) {
    case 'shortBreak': return settings.shortBreakDuration * 60 * 1000;
    case 'longBreak':  return settings.longBreakDuration  * 60 * 1000;
    default:           return settings.workDuration        * 60 * 1000;
  }
}
