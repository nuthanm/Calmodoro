// Keeps the toolbar icon badge countdown accurate (1 s) while the timer runs
// in the background service worker / offscreen context.

let intervalId = null;

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'startBadgeTicker') startTicker();
  if (message.action === 'stopBadgeTicker') stopTicker();
});

function startTicker() {
  if (intervalId) return;
  tick();
  intervalId = setInterval(tick, 1000);
}

function stopTicker() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

async function tick() {
  const { state, endTime, mode = 'work' } = await chrome.storage.local.get(['state', 'endTime', 'mode']);

  if (state !== 'running' && state !== 'break') {
    stopTicker();
    return;
  }
  if (!endTime) return;

  const remaining = Math.max(0, endTime - Date.now());
  if (remaining <= 0) {
    stopTicker();
    return;
  }

  const colors = CalmodoroSettings.MODE_COLORS;
  chrome.action.setBadgeText({ text: CalmodoroTimerUtils.formatBadgeCountdown(remaining) });
  chrome.action.setBadgeBackgroundColor({
    color: state === 'break' ? colors.shortBreak : colors[mode] || colors.work
  });
}

// Start immediately when the offscreen document is created during an active timer.
startTicker();
