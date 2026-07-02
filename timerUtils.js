function splitRemaining(remainingMs) {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return { minutes, seconds };
}

function formatCountdown(remainingMs, { padMinutes = false } = {}) {
  const { minutes, seconds } = splitRemaining(remainingMs);
  const mm = padMinutes ? String(minutes).padStart(2, '0') : String(minutes);
  return `${mm}:${String(seconds).padStart(2, '0')}`;
}

function formatBadgeCountdown(remainingMs) {
  return formatCountdown(remainingMs, { padMinutes: false });
}

globalThis.CalmodoroTimerUtils = Object.freeze({
  formatCountdown,
  formatBadgeCountdown
});
