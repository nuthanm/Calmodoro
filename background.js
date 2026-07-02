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
const ALARM_SCHEDULE_RESUME = 'scheduleResume';
const REMINDER_TYPES = ['blink', 'water', 'stretch'];

const REMINDER_META = {
  blink:   { title: 'Rest your eyes', message: 'Look 20 feet away for 20 seconds', emoji: '👁' },
  water:   { title: 'Stay hydrated', message: 'Drink a glass of water', emoji: '💧' },
  stretch: { title: 'Stretch break', message: 'Stand up and stretch your body', emoji: '🧘' }
};

let recoveryHandled = false;

function getBadgeApi() {
  // Some Chromium builds expose badge APIs via `browserAction` instead of `action`.
  return chrome.action || chrome.browserAction || null;
}

function setBadgeTextSafe(text) {
  const api = getBadgeApi();
  if (!api?.setBadgeText) return;
  try { api.setBadgeText({ text: String(text ?? '') }); } catch (_) {}
}

function setBadgeBackgroundColorSafe(color) {
  const api = getBadgeApi();
  if (!api?.setBadgeBackgroundColor) return;
  try { api.setBadgeBackgroundColor({ color }); } catch (_) {}
}

// ---------------------------------------------------------------------------
// Startup & alarms
// ---------------------------------------------------------------------------

chrome.runtime.onStartup.addListener(() => {
  recoverFromOffline();
  maybeAutoStartFocus();
});
chrome.runtime.onInstalled.addListener(() => {
  recoverFromOffline();
  rescheduleMicroReminders();
  maybeAutoStartFocus();
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_SESSION_END) {
    await handleSessionEnd();
  } else if (alarm.name === ALARM_BADGE_TICK) {
    await enforceSchedule();
    await updateBadge();
    await scheduleNextBadgeTick();
  } else if (alarm.name === ALARM_SCHEDULE_RESUME) {
    await enforceSchedule();
  } else if (alarm.name === ALARM_SCHEDULE_CHECK) {
    await rescheduleMicroReminders();
    await enforceSchedule();
    await maybeAutoStartFocus();
  } else if (alarm.name.startsWith('reminder_')) {
    const kind = alarm.name.replace('reminder_', '');
    await fireMicroReminder(kind);
  }
});

recoverFromOffline();
rescheduleMicroReminders();
maybeAutoStartFocus();
chrome.alarms.create(ALARM_SCHEDULE_CHECK, { periodInMinutes: 1 });

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
    case 'getState':
      await enforceSchedule();
      return getTimerState();
    case 'badgeTick':
      await enforceSchedule();
      await updateBadge();
      return { ok: true };
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
  await chrome.storage.local.set({ state: 'paused', remainingMs, endTime: null, pausedBySchedule: false });

  setBadgeTextSafe('⏸');
  setBadgeBackgroundColorSafe('#9A948D');
  return getTimerState();
}

function buildToastPage({
  kind = 'schedule',
  title,
  message,
  icon = '%E2%84%B9%EF%B8%8F',
  variant = 'ok',
  autocloseMs = 0
} = {}) {
  const t = encodeURIComponent(title || 'Calmodoro');
  const m = encodeURIComponent(message || '');
  return `toast.html?kind=${kind}&variant=${variant}&title=${t}&message=${m}&icon=${icon}&autocloseMs=${encodeURIComponent(String(autocloseMs))}`;
}

function showSystemNotification({ title, message, silent = false } = {}) {
  try {
    chrome.notifications.create(`alert-${Date.now()}`, {
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon48.png'),
      title: title || 'Calmodoro',
      message: message || '',
      requireInteraction: true,
      priority: 2,
      silent
    });
  } catch (_) { /* ignore */ }
}

async function showUserAlert({
  title,
  message,
  icon = '%E2%84%B9%EF%B8%8F',
  kind = 'schedule',
  variant = 'ok',
  autocloseMs = 0,
  silent = false
} = {}) {
  const safeTitle = title || 'Calmodoro';
  const safeMessage = message || '';
  let popupShown = false;

  try {
    await openOverlayWindow(
      'alert',
      buildToastPage({ kind, title: safeTitle, message: safeMessage, icon, variant, autocloseMs })
    );
    popupShown = true;
  } catch (_) { /* fall through to notification */ }

  if (!popupShown) {
    showSystemNotification({ title: safeTitle, message: safeMessage, silent });
  }
}

async function showScheduleAlert({ title, message, autocloseMs = 5000 } = {}) {
  const safeTitle = title || 'Calmodoro';
  const safeMessage = message || '';
  let popupShown = false;

  try {
    await openOverlayWindow(
      'toast',
      buildToastPage({
        kind: 'schedule',
        title: safeTitle,
        message: safeMessage,
        variant: 'ok',
        autocloseMs
      })
    );
    popupShown = true;
  } catch (_) { /* fall through to notification */ }

  if (!popupShown) {
    showSystemNotification({ title: safeTitle, message: safeMessage });
  }
}

async function enforceSchedule() {
  const settings = await getSettings();
  const status = CalmodoroSchedule.getScheduleStatus(settings);
  const stored = await chrome.storage.local.get(['state', 'endTime', 'remainingMs', 'pausedBySchedule', 'scheduleActiveLast']);
  const lastActive = stored.scheduleActiveLast;
  await chrome.storage.local.set({ scheduleActiveLast: status.active });

  // Transition inactive -> active: auto-resume if we were paused by schedule.
  if (status.active) {
    await chrome.alarms.clear(ALARM_SCHEDULE_RESUME);
    if (stored.state === 'paused' && stored.pausedBySchedule && stored.remainingMs != null) {
      const endTime = Date.now() + stored.remainingMs;
      await clearSessionAlarms();
      const newState = (await chrome.storage.local.get('mode')).mode === 'work' ? 'running' : 'break';
      await chrome.storage.local.set({ state: newState, endTime, remainingMs: null, pausedBySchedule: false });
      chrome.alarms.create(ALARM_SESSION_END, { when: endTime });
      await startBadgeTicker();

      // Always show on auto-resume from schedule pause (RDP may hide windows; notification fallback will still work).
      if (!settings.doNotDisturb) {
        await showScheduleAlert({
          title: 'Welcome back!!',
          message: 'Hope you had a great time and healthy scan.',
          autocloseMs: 3500
        });
      }
    }
    return;
  }

  // Active -> inactive: pause any running session.
  if ((stored.state !== 'running' && stored.state !== 'break') || !stored.endTime) return;

  const remainingMs = Math.max(0, stored.endTime - Date.now());
  await clearSessionAlarms();
  await stopBadgeTicker();
  await chrome.storage.local.set({ state: 'paused', remainingMs, endTime: null, pausedBySchedule: true });

  setBadgeTextSafe('⏸');
  setBadgeBackgroundColorSafe('#9A948D');

  // Ensure we wake up right when schedule resumes (even if SW is asleep).
  if (Number.isFinite(status.resumeAtMs) && status.resumeAtMs && status.resumeAtMs > Date.now()) {
    chrome.alarms.create(ALARM_SCHEDULE_RESUME, { when: status.resumeAtMs });
  }

  // Show a compact toast once when schedule first pauses an active session.
  if (!settings.doNotDisturb && !stored.pausedBySchedule) {
    await showScheduleAlert({
      title: status.reason === 'lunch' ? 'Lunch break' : 'Outside active hours',
      message: status.message || 'Timer paused by schedule.',
      autocloseMs: 5000
    });
  }
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
  await chrome.storage.local.set({ state: newState, endTime, remainingMs: null, pausedBySchedule: false });

  chrome.alarms.create(ALARM_SESSION_END, { when: endTime });
  await startBadgeTicker();
  return getTimerState();
}

async function resetTimer() {
  await clearSessionAlarms();
  await stopBadgeTicker();
  await chrome.storage.local.set({ state: 'idle', endTime: null, remainingMs: null, mode: 'work', pausedBySchedule: false });
  setBadgeTextSafe('');
  return getTimerState();
}

async function setMode(mode) {
  await clearSessionAlarms();
  await stopBadgeTicker();
  await chrome.storage.local.set({ state: 'idle', mode, endTime: null, remainingMs: null, pausedBySchedule: false });
  setBadgeTextSafe('');
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
  setBadgeTextSafe('');
  return getTimerState();
}

async function onSettingsUpdated() {
  await rescheduleMicroReminders();
  const { state } = await chrome.storage.local.get('state');
  if (state === 'idle') {
    await chrome.storage.local.set({ remainingMs: null });
    await maybeAutoStartFocus();
  }
  return getTimerState();
}

async function maybeAutoStartFocus() {
  const settings = await getSettings();
  if (!settings.autoStartWork) return;

  const { state } = await chrome.storage.local.get('state');
  if (state !== 'idle') return;
  if (!CalmodoroSchedule.isScheduleActive(settings)) return;

  await startTimer();
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

  setBadgeTextSafe('');
  await stopBadgeTicker();

  if (!settings.doNotDisturb) {
    const isWorkEnd = mode === 'work';
    const breakLabel = nextMode === 'longBreak' ? 'long break' : 'short break';

    if (isWorkEnd) {
      await openOverlayWindow(settings.breakWindowMode, 'break.html');
    } else {
      await showUserAlert({
        kind: 'schedule',
        icon: '%E2%9C%85',
        title: 'Break over – back to work!',
        message: 'Ready for the next focus session?'
      });
    }

    showSessionNotification(isWorkEnd, nextMode, breakLabel);
  }

  if (mode !== 'work' && settings.autoStartWork && CalmodoroSchedule.isScheduleActive(settings)) {
    await chrome.storage.local.set({ state: 'idle', mode: 'work' });
    await startTimer();
  } else if (mode === 'work' && settings.autoStartBreak && !settings.doNotDisturb) {
    await acceptBreak();
  }
}

function showSessionNotification(isWorkEnd, nextMode, breakLabel = 'short break') {
  showSystemNotification({
    title: isWorkEnd ? 'Focus session complete!' : 'Break over – back to work!',
    message: isWorkEnd
      ? `Time for a ${breakLabel}. Hydrate, blink, stretch.`
      : 'Ready for the next focus session?'
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

  const mode = settings.reminderWindowMode === 'halfRight'
    ? 'sideRight'
    : settings.reminderWindowMode === 'toast'
      ? 'toast'
      : 'alert';

  try {
    await openOverlayWindow(mode, `toast.html?kind=${kind}`);
  } catch (_) {
    showSystemNotification({
      title: meta.title,
      message: meta.message,
      silent: !settings.soundEnabled
    });
    return;
  }

  if (settings.reminderWindowMode === 'notification') {
    showSystemNotification({
      title: meta.title,
      message: meta.message,
      silent: !settings.soundEnabled
    });
  }
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

async function getWindowAnchor() {
  try {
    const lastFocused = await chrome.windows.getLastFocused();
    return {
      width: lastFocused.width > 0 ? lastFocused.width : 1920,
      height: lastFocused.height > 0 ? lastFocused.height : 1080,
      top: Number.isFinite(lastFocused.top) ? lastFocused.top : 0,
      left: Number.isFinite(lastFocused.left) ? lastFocused.left : 0
    };
  } catch (_) {
    return { width: 1920, height: 1080, top: 0, left: 0 };
  }
}

async function createAttentionWindow(createOptions) {
  const win = await chrome.windows.create(createOptions);
  if (win?.id != null) {
    try {
      await chrome.windows.update(win.id, { focused: true, drawAttention: true });
    } catch (_) { /* best effort */ }
  }
  return win;
}

async function openOverlayWindow(mode = 'popup', page = 'break.html') {
  if (!page || typeof page !== 'string') return;
  const url = chrome.runtime.getURL(page);
  if (!url || typeof url !== 'string') return;
  const popupWidth = 520;
  const popupHeight = 640;
  const minSideWidth = 360;
  const halfRatio = 0.5;

  if (mode === 'fullWindow') {
    await createAttentionWindow({ url, type: 'popup', state: 'maximized', focused: true });
    return;
  }

  if (mode === 'alert') {
    const width = 420;
    const height = 220;
    const anchor = await getWindowAnchor();
    await createAttentionWindow({
      url,
      type: 'popup',
      width,
      height,
      focused: true,
      left: Math.max(0, anchor.left + Math.floor((anchor.width - width) / 2)),
      top: Math.max(0, anchor.top + Math.floor((anchor.height - height) / 2))
    });
    return;
  }

  if (mode === 'toast') {
    const margin = 16;
    const width = 340;
    const height = 160;
    const anchor = await getWindowAnchor();
    await createAttentionWindow({
      url,
      type: 'popup',
      width,
      height,
      focused: true,
      left: Math.max(0, anchor.left + anchor.width - width - margin),
      top: Math.max(0, anchor.top + anchor.height - height - margin)
    });
    return;
  }

  try {
    const anchor = await getWindowAnchor();
    const refW = anchor.width;
    const refH = anchor.height;
    const refTop = anchor.top;
    const refLeft = anchor.left;

    if (mode === 'sideLeft' || mode === 'sideRight') {
      const sideW = Math.max(minSideWidth, Math.floor(refW * halfRatio));
      await createAttentionWindow({
        url, type: 'popup', focused: true,
        width: sideW, height: refH, top: refTop,
        left: mode === 'sideLeft' ? refLeft : Math.max(0, refLeft + refW - sideW)
      });
      return;
    }

    if (mode === 'sideTop' || mode === 'sideBottom') {
      const sideH = Math.max(280, Math.floor(refH * halfRatio));
      await createAttentionWindow({
        url, type: 'popup', focused: true,
        width: refW, height: sideH, left: refLeft,
        top: mode === 'sideTop' ? refTop : refTop + refH - sideH
      });
      return;
    }
  } catch (err) {
    console.warn('Window placement failed, using popup fallback.', err);
  }

  await createAttentionWindow({
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
  setBadgeTextSafe('!');
  setBadgeBackgroundColorSafe('#D4A574');

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
  // Alarm fallback (service worker may sleep). Offscreen doc provides true 1s ticks.
  await scheduleNextBadgeTick();

  try {
    if (await hasOffscreenDocument()) {
      chrome.runtime.sendMessage({ action: 'startBadgeTicker' }).catch(() => {});
      return;
    }

    const Reason = chrome.offscreen?.Reason || {};
    const chosenReason =
      Reason.BLOBS ||
      Reason.LOCAL_STORAGE ||
      Reason.DOM_SCRAPING ||
      'DOM_SCRAPING';

    await chrome.offscreen.createDocument({
      url: 'offscreen.html',
      // Feature-detect a supported reason across Chrome versions.
      reasons: [chosenReason],
      justification: 'Keep the toolbar badge countdown accurate every second while the timer runs'
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
  setBadgeTextSafe(CalmodoroTimerUtils.formatBadgeCountdown(remaining));
  setBadgeBackgroundColorSafe(
    state === 'break' ? MODE_COLORS.shortBreak : MODE_COLORS[mode] || MODE_COLORS.work
  );
}

async function scheduleNextBadgeTick() {
  const { state, endTime } = await chrome.storage.local.get(['state', 'endTime']);
  if ((state !== 'running' && state !== 'break') || !endTime) return;
  if (endTime - Date.now() <= 0) return;
  // Best-effort fallback only; for true live updates we rely on offscreen.js.
  chrome.alarms.create(ALARM_BADGE_TICK, { delayInMinutes: 0.1 });
}

// ---------------------------------------------------------------------------
// State reader
// ---------------------------------------------------------------------------

async function getTimerState() {
  const data = await chrome.storage.local.get([
    'state', 'mode', 'endTime', 'remainingMs', 'sessionCount', 'settings', 'pausedBySchedule'
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

  const scheduleStatus = CalmodoroSchedule.getScheduleStatus(settings);

  return {
    state,
    mode,
    endTime: data.endTime || null,
    remainingMs,
    sessionCount: data.sessionCount || 0,
    settings,
    stats,
    scheduleActive: scheduleStatus.active,
    scheduleStatus,
    pausedBySchedule: !!data.pausedBySchedule
  };
}

// Resume icon badge ticker if a session was already running when the worker woke up.
(async function initBadgeTickerOnLoad() {
  const { state, endTime } = await chrome.storage.local.get(['state', 'endTime']);
  if ((state === 'running' || state === 'break') && endTime && endTime > Date.now()) {
    await startBadgeTicker();
  }
})();
