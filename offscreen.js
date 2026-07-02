// Keeps the toolbar icon badge countdown accurate (1 s) while the timer runs
// in the background service worker / offscreen context.

let intervalId = null;

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'startBadgeTicker') startTicker();
  if (message.action === 'stopBadgeTicker') stopTicker();
});

function startTicker() {
  if (intervalId) return;
  // Kick once immediately, then every second. `tick()` is resilient to missing APIs.
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
  let state;
  let endTime;
  let mode = 'work';

  try {
    // Use the service worker as the canonical state source.
    // This avoids runtime differences where OFFSCREEN_DOCUMENT may not expose `chrome.storage`.
    const resp = await chrome.runtime.sendMessage({ action: 'getState' }).catch(() => null);
    if (resp && typeof resp === 'object') {
      state = resp.state;
      endTime = resp.endTime;
      mode = resp.mode || mode;
    }
  } catch (err) {
    console.warn('Offscreen tick failed; stopping ticker.', err);
    stopTicker();
    return;
  }

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

  // OFFSCREEN_DOCUMENT may not expose `chrome.action`; delegate badge updates to the service worker.
  chrome.runtime.sendMessage({ action: 'badgeTick' }).catch(() => {});
}

// Start immediately when the offscreen document is created during an active timer.
startTicker();
