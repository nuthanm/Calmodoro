const BADGE_COMPACT_THRESHOLD_MINUTES = 10;

function formatBadgeCountdown(remainingMs) {
  const minutes = Math.floor(remainingMs / 60000);
  const seconds = Math.floor((remainingMs % 60000) / 1000);
  if (minutes >= BADGE_COMPACT_THRESHOLD_MINUTES) {
    return `${minutes}m`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
