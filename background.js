// Calmodoro – Background Service Worker
importScripts(
  'timerUtils.js',
  'settingsDefaults.js',
  'scheduleUtils.js',
  'statsUtils.js'
);

const { DEFAULT_SETTINGS, MODE_COLORS, mergeSettings } = CalmodoroSettings;

const ALARM_SESSION_END = 'sessionEnd';
const ALARM_BADGE_TICK = 'badgeTick';
const ALARM_SCHEDULE_CHECK = 'scheduleCheck';
const REMINDER_TYPES = ['blink', 'water', 'stretch'];

const REMINDER_META = {
  blink:   { title: 'Rest your eyes', message: 'Look 20 feet away for 20 seconds', emoji: '👁' },
  water:   { title: 'Stay hydrated', message: 'Drink a glass of water', emoji: '💧' },
  stretch: { title: 'Stretch break', message: 'Stand up and stretch your body', emoji: '🧘' }
};

let recoveryHandled = false;

// ---------------------------------------------------------------------------
// Startup & alarms
// ---------------------------------------------------------------------------

chrome.runtime.onStartup.addListener(() => { recoverFromOffline(); });
chrome.runtime.onInstalled.addListener(() => {
  recoverFromOffline();
  rescheduleMicroReminders();
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_SESSION_END) {
    await handleSessionEnd();
  } else if (alarm.name === ALARM_BADGE_TICK) {
    await updateBadge();
    await scheduleNextBadgeTick();
  } else if (alarm.name === ALARM_SCHEDULE_CHECK) {
    await rescheduleMicroReminders();
    chrome.alarms.create(ALARM_SCHEDULE_CHECK, { delayInMinutes: 30 });
  } else if (alarm.name.startsWith('reminder_')) {
    const kind = alarm.name.replace('reminder_', '');
    await fireMicroReminder(kind);
  }
});

recoverFromOffline();
rescheduleMicroReminders();
chrome.alarms.create(ALARM_SCHEDULE_CHECK, { delayInMinutes: 30 });

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  handleMessage(message).then(sendResponse).catch((err) => {
    console.error('Message handling error:', err);
    sendResponse({ error: String(err) });
  });
  return true;
});

async function handleMessage(message) {
  switch (message.action) {
    case 'start':              return startTimer();
    case 'pause':              return pauseTimer();
    case 'resume':             return resumeTimer();
    case 'reset':              return resetTimer();
    case 'setMode':            return setMode(message.mode);
    case 'getState':           return getTimerState();
    case 'getStats':           return CalmodoroStats.getSummary();
    case 'startBreak':         return startBreakTimer();
    case 'skipBreak':          return skipBreak();
    case 'acceptBreak':        return acceptBreak();
    case 'acceptReminder':     return acceptReminder(message.kind);
    case 'skipReminder':       return skipReminder(message.kind);
    case 'recoveryAccept':     return recoveryAccept();
    case 'recoverySkip':       return recoverySkip();
    case 'settingsUpdated':    return onSettingsUpdated();
    default:
      return { error: `Unknown action: ${message.action}` };
  }
}

// ---------------------------------------------------------------------------
// Settings helper
// ---------------------------------------------------------------------------

async function getSettings() {
  const { settings: saved } = await chrome.storage.local.get('settings');
  return mergeSettings(saved);
}

// ---------------------------------------------------------------------------
// Timer operations
// ---------------------------------------------------------------------------

async function startTimer() {
  const settings = await getSettings();
  if (!CalmodoroSchedule.isScheduleActive(settings)) {
    return { ...await getTimerState(), scheduleBlocked: true };
  }

  const { mode = 'work' } = await chrome.storage.local.get('mode');
  const durationMs = CalmodoroSchedule.modeDurationMs(mode, settings);
  const endTime = Date.now() + durationMs;

  await clearSessionAlarms();
  await chrome.storage.local.set({ state: 'running', endTime, remainingMs: null });

  chrome.alarms.create(ALARM_SESSION_END, { when: endTime });
  await startBadgeTicker();
  return getTimerState();
}

async function pauseTimer() {
  const { state, endTime } = await chrome.storage.local.get(['state', 'endTime']);
  if (state !== 'running' && state !== 'break') return getTimerState();

  const remainingMs = Math.max(0, endTime - Date.now());
  await clearSessionAlarms();
  await stopBadgeTicker();
  await chrome.storage.local.set({ state: 'paused', remainingMs, endTime: null });

  chrome.action.setBadgeText({ text: '⏸' });
  chrome.action.setBadgeBackgroundColor({ color: '#9A948D' });
  return getTimerState();
}

async function resumeTimer() {
  const settings = await getSettings();
  if (!CalmodoroSchedule.isScheduleActive(settings)) {
    return { ...await getTimerState(), scheduleBlocked: true };
  }

  const { state, remainingMs } = await chrome.storage.local.get(['state', 'remainingMs']);
  if (state !== 'paused') return getTimerState();

  const endTime = Date.now() + remainingMs;
  await clearSessionAlarms();
  const newState = (await chrome.storage.local.get('mode')).mode === 'work' ? 'running' : 'break';
  await chrome.storage.local.set({ state: newState, endTime, remainingMs: null });

  chrome.alarms.create(ALARM_SESSION_END, { when: endTime });
  await startBadgeTicker();
  return getTimerState();
}

async function resetTimer() {
  await clearSessionAlarms();
  await stopBadgeTicker();
  await chrome.storage.local.set({ state: 'idle', endTime: null, remainingMs: null, mode: 'work' });
  chrome.action.setBadgeText({ text: '' });
  return getTimerState();
}

async function setMode(mode) {
  await clearSessionAlarms();
  await stopBadgeTicker();
  await chrome.storage.local.set({ state: 'idle', mode, endTime: null, remainingMs: null });
  chrome.action.setBadgeText({ text: '' });
  return getTimerState();
}

async function startBreakTimer() {
  const settings = await getSettings();
  const { mode = 'shortBreak' } = await chrome.storage.local.get('mode');
  const durationMs = CalmodoroSchedule.modeDurationMs(mode, settings);
  const endTime = Date.now() + durationMs;

  await clearSessionAlarms();
  await chrome.storage.local.set({ state: 'break', endTime, remainingMs: null });

  chrome.alarms.create(ALARM_SESSION_END, { when: endTime });
  await startBadgeTicker();
  return getTimerState();
}

async function acceptBreak() {
  await CalmodoroStats.record('breaksAccepted');
  return startBreakTimer();
}

async function skipBreak() {
  await CalmodoroStats.record('breaksSkipped');
  await clearSessionAlarms();
  await stopBadgeTicker();
  await chrome.storage.local.set({ state: 'idle', mode: 'work', endTime: null, remainingMs: null });

  const settings = await getSettings();
  if (settings.autoStartWork && CalmodoroSchedule.isScheduleActive(settings)) {
    return startTimer();
  }
  chrome.action.setBadgeText({ text: '' });
  return getTimerState();
}

async function onSettingsUpdated() {
  await rescheduleMicroReminders();
  const { state } = await chrome.storage.local.get('state');
  if (state === 'idle') {
    await chrome.storage.local.set({ remainingMs: null });
  }
  return getTimerState();
}

async function clearSessionAlarms() {
  await chrome.alarms.clear(ALARM_SESSION_END);
  await chrome.alarms.clear(ALARM_BADGE_TICK);
}

// ---------------------------------------------------------------------------
// Session completion
// ---------------------------------------------------------------------------

async function handleSessionEnd() {
  const {
    mode = 'work',
    sessionCount: count = 0,
    settings: savedSettings
  } = await chrome.storage.local.get(['mode', 'sessionCount', 'settings']);

  const settings = mergeSettings(savedSettings);

  let nextMode;
  let newSessionCount = count;

  if (mode === 'work') {
    await CalmodoroStats.record('focusCompleted');
    newSessionCount = count + 1;
    nextMode = newSessionCount % settings.sessionsBeforeLongBreak === 0
      ? 'longBreak'
      : 'shortBreak';
  } else {
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
  await stopBadgeTicker();

  if (!settings.doNotDisturb) {
    const isWorkEnd = mode === 'work';
    showSessionNotification(isWorkEnd, nextMode);

    if (isWorkEnd) {
      await openOverlayWindow(settings.breakWindowMode, 'break.html');
    }
  }

  if (mode !== 'work' && settings.autoStartWork && CalmodoroSchedule.isScheduleActive(settings)) {
    await chrome.storage.local.set({ state: 'idle', mode: 'work' });
    await startTimer();
  } else if (mode === 'work' && settings.autoStartBreak && !settings.doNotDisturb) {
    await acceptBreak();
  }
}

function showSessionNotification(isWorkEnd, nextMode) {
  const breakLabel = nextMode === 'longBreak' ? 'long break' : 'short break';
  chrome.notifications.create(`session-${Date.now()}`, {
    type: 'basic',
    iconUrl: chrome.runtime.getURL('icons/icon48.png'),
    title: isWorkEnd ? 'Focus session complete!' : 'Break over – back to work!',
    message: isWorkEnd
      ? `Time for a ${breakLabel}. Hydrate, blink, stretch.`
      : 'Ready for the next focus session?',
    silent: false
  });
}

// ---------------------------------------------------------------------------
// Micro-reminders
// ---------------------------------------------------------------------------

async function rescheduleMicroReminders() {
  for (const kind of REMINDER_TYPES) {
    await chrome.alarms.clear(`reminder_${kind}`);
  }

  const settings = await getSettings();
  if (!CalmodoroSchedule.isScheduleActive(settings)) return;

  for (const kind of REMINDER_TYPES) {
    const cfg = settings.microReminders?.[kind];
    if (!cfg?.enabled) continue;
    const interval = Math.max(1, cfg.intervalMin || 20);
    chrome.alarms.create(`reminder_${kind}`, { delayInMinutes: interval, periodInMinutes: interval });
  }
}

async function fireMicroReminder(kind) {
  const settings = await getSettings();
  if (settings.doNotDisturb || !CalmodoroSchedule.isScheduleActive(settings)) {
    return;
  }

  const meta = REMINDER_META[kind];
  if (!meta) return;

  if (settings.reminderWindowMode === 'notification') {
    chrome.notifications.create(`reminder-${kind}-${Date.now()}`, {
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon48.png'),
      title: meta.title,
      message: meta.message,
      silent: !settings.soundEnabled
    });
    return;
  }

  const mode = settings.reminderWindowMode === 'halfRight' ? 'sideRight' : 'toast';
  await openOverlayWindow(mode, `toast.html?kind=${kind}`);
}

async function acceptReminder(kind) {
  await CalmodoroStats.record('reminderAccepted', { kind });
  return getTimerState();
}

async function skipReminder(kind) {
  await CalmodoroStats.record('remindersSkipped', { kind });
  return getTimerState();
}

// ---------------------------------------------------------------------------
// Window placement
// ---------------------------------------------------------------------------

async function openOverlayWindow(mode = 'popup', page = 'break.html') {
  const url = chrome.runtime.getURL(page);
  const popupWidth = 520;
  const popupHeight = 640;
  const minSideWidth = 360;
  const halfRatio = 0.5;

  if (mode === 'fullWindow') {
    await chrome.windows.create({ url, type: 'popup', state: 'maximized', focused: true });
    return;
  }

  if (mode === 'toast') {
    await chrome.windows.create({
      url,
      type: 'popup',
      width: 340,
      height: 160,
      focused: true
    });
    return;
  }

  try {
    const lastFocused = await chrome.windows.getLastFocused();
    const refW = lastFocused.width > 0 ? lastFocused.width : popupWidth;
    const refH = lastFocused.height > 0 ? lastFocused.height : popupHeight;
    const refTop = Number.isFinite(lastFocused.top) ? lastFocused.top : 0;
    const refLeft = Number.isFinite(lastFocused.left) ? lastFocused.left : 0;

    if (mode === 'sideLeft' || mode === 'sideRight') {
      const sideW = Math.max(minSideWidth, Math.floor(refW * halfRatio));
      await chrome.windows.create({
        url, type: 'popup', focused: true,
        width: sideW, height: refH, top: refTop,
        left: mode === 'sideLeft' ? refLeft : Math.max(0, refLeft + refW - sideW)
      });
      return;
    }

    if (mode === 'sideTop' || mode === 'sideBottom') {
      const sideH = Math.max(280, Math.floor(refH * halfRatio));
      await chrome.windows.create({
        url, type: 'popup', focused: true,
        width: refW, height: sideH, left: refLeft,
        top: mode === 'sideTop' ? refTop : refTop + refH - sideH
      });
      return;
    }
  } catch (err) {
    console.warn('Window placement failed, using popup fallback.', err);
  }

  await chrome.windows.create({
    url, type: 'popup', width: popupWidth, height: popupHeight, focused: true
  });
}

// ---------------------------------------------------------------------------
// Offline recovery
// ---------------------------------------------------------------------------

async function recoverFromOffline() {
  if (recoveryHandled) return;
  recoveryHandled = true;

  const { state, endTime, mode, settings: saved } = await chrome.storage.local.get(
    ['state', 'endTime', 'mode', 'settings']
  );
  const settings = mergeSettings(saved);

  if ((state !== 'running' && state !== 'break') || !endTime) return;
  if (endTime >= Date.now()) return;

  const behavior = settings.offlineBehavior || 'ask';

  if (behavior === 'reset') {
    await resetTimer();
    return;
  }

  if (behavior === 'resume') {
    if (state === 'running') {
      await handleSessionEnd();
    } else {
      await chrome.storage.local.set({ state: 'idle', mode: 'work' });
      if (settings.autoStartWork) await startTimer();
    }
    return;
  }

  // ask (default)
  await CalmodoroStats.record('breaksMissed', { reason: 'offline', mode });
  await clearSessionAlarms();
  await stopBadgeTicker();
  await chrome.storage.local.set({
    state: 'recovery_pending',
    endTime: null,
    remainingMs: null,
    recoveryMode: mode
  });
  chrome.action.setBadgeText({ text: '!' });
  chrome.action.setBadgeBackgroundColor({ color: '#D4A574' });

  if (!settings.doNotDisturb) {
    await openOverlayWindow('popup', 'recovery.html');
  }
}

async function recoveryAccept() {
  const { recoveryMode = 'shortBreak' } = await chrome.storage.local.get('recoveryMode');
  await chrome.storage.local.set({ state: 'break_pending', mode: recoveryMode });
  const settings = await getSettings();
  await openOverlayWindow(settings.breakWindowMode, 'break.html');
  return getTimerState();
}

async function recoverySkip() {
  await CalmodoroStats.record('breaksSkipped', { reason: 'recovery' });
  await resetTimer();
  return getTimerState();
}

// ---------------------------------------------------------------------------
// Badge — toolbar icon countdown (runs via offscreen doc + alarm fallback)
// ---------------------------------------------------------------------------

async function hasOffscreenDocument() {
  if (!chrome.runtime.getContexts) return false;
  const contexts = await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'] });
  return contexts.length > 0;
}

async function startBadgeTicker() {
  await updateBadge();
  await scheduleNextBadgeTick();

  try {
    if (await hasOffscreenDocument()) {
      chrome.runtime.sendMessage({ action: 'startBadgeTicker' }).catch(() => {});
      return;
    }
    await chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: ['LOCAL_STORAGE'],
      justification: 'Update the toolbar icon badge every second while the Pomodoro timer runs'
    });
  } catch (err) {
    console.warn('Offscreen badge ticker unavailable; using 30 s alarm fallback.', err);
  }
}

async function stopBadgeTicker() {
  await chrome.alarms.clear(ALARM_BADGE_TICK);
  try {
    if (await hasOffscreenDocument()) {
      chrome.runtime.sendMessage({ action: 'stopBadgeTicker' }).catch(() => {});
      await chrome.offscreen.closeDocument();
    }
  } catch (_) { /* offscreen may already be closed */ }
}

async function updateBadge() {
  const { state, endTime, mode = 'work' } = await chrome.storage.local.get(['state', 'endTime', 'mode']);

  if (state !== 'running' && state !== 'break') return;
  if (!endTime) return;

  const remaining = Math.max(0, endTime - Date.now());
  chrome.action.setBadgeText({ text: CalmodoroTimerUtils.formatBadgeCountdown(remaining) });
  chrome.action.setBadgeBackgroundColor({
    color: state === 'break' ? MODE_COLORS.shortBreak : MODE_COLORS[mode] || MODE_COLORS.work
  });
}

async function scheduleNextBadgeTick() {
  const { state, endTime } = await chrome.storage.local.get(['state', 'endTime']);
  if ((state !== 'running' && state !== 'break') || !endTime) return;
  if (endTime - Date.now() <= 0) return;
  chrome.alarms.create(ALARM_BADGE_TICK, { delayInMinutes: 0.5 });
}

// ---------------------------------------------------------------------------
// State reader
// ---------------------------------------------------------------------------

async function getTimerState() {
  const data = await chrome.storage.local.get([
    'state', 'mode', 'endTime', 'remainingMs', 'sessionCount', 'settings'
  ]);

  const settings = mergeSettings(data.settings);
  const state = data.state || 'idle';
  const mode = data.mode || 'work';

  let remainingMs;
  if (state === 'running' || state === 'break') {
    remainingMs = data.endTime
      ? Math.max(0, data.endTime - Date.now())
      : CalmodoroSchedule.modeDurationMs(mode, settings);
  } else if (state === 'paused') {
    remainingMs = data.remainingMs != null
      ? data.remainingMs
      : CalmodoroSchedule.modeDurationMs(mode, settings);
  } else {
    remainingMs = CalmodoroSchedule.modeDurationMs(mode, settings);
  }

  const stats = await CalmodoroStats.getSummary();

  return {
    state,
    mode,
    remainingMs,
    sessionCount: data.sessionCount || 0,
    settings,
    stats,
    scheduleActive: CalmodoroSchedule.isScheduleActive(settings)
  };
}

// Resume icon badge ticker if a session was already running when the worker woke up.
(async function initBadgeTickerOnLoad() {
  const { state, endTime } = await chrome.storage.local.get(['state', 'endTime']);
  if ((state === 'running' || state === 'break') && endTime && endTime > Date.now()) {
    await startBadgeTicker();
  }
})();
