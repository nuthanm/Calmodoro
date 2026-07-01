// Daily stats tracking for breaks, skips, and micro-reminders.

const CalmodoroStats = (() => {
  const STAT_KEYS = {
    focusCompleted: 'focusCompleted',
    breaksAccepted: 'breaksAccepted',
    breaksSkipped: 'breaksSkipped',
    breaksMissed: 'breaksMissed',
    reminderBlink: 'reminderBlink',
    reminderWater: 'reminderWater',
    reminderStretch: 'reminderStretch',
    remindersSkipped: 'remindersSkipped'
  };

  function todayKey(date = new Date()) {
    return date.toISOString().slice(0, 10);
  }

  function emptyDay() {
    return {
      focusCompleted: 0,
      breaksAccepted: 0,
      breaksSkipped: 0,
      breaksMissed: 0,
      reminderBlink: 0,
      reminderWater: 0,
      reminderStretch: 0,
      remindersSkipped: 0,
      log: []
    };
  }

  async function getDailyStats(date = new Date()) {
    const key = todayKey(date);
    const { dailyStats = {} } = await chrome.storage.local.get('dailyStats');
    return dailyStats[key] || emptyDay();
  }

  async function saveDailyStats(stats, date = new Date()) {
    const key = todayKey(date);
    const { dailyStats = {} } = await chrome.storage.local.get('dailyStats');
    dailyStats[key] = stats;
    await chrome.storage.local.set({ dailyStats });
    return stats;
  }

  async function record(type, detail = {}) {
    const stats = await getDailyStats();
    if (STAT_KEYS[type] !== undefined) {
      stats[STAT_KEYS[type]] = (stats[STAT_KEYS[type]] || 0) + 1;
    } else if (type === 'reminderAccepted') {
      const map = { blink: 'reminderBlink', water: 'reminderWater', stretch: 'reminderStretch' };
      const field = map[detail.kind];
      if (field) stats[field] = (stats[field] || 0) + 1;
    }
    stats.log = stats.log || [];
    stats.log.unshift({
      type,
      detail,
      time: new Date().toISOString()
    });
    if (stats.log.length > 50) stats.log.length = 50;
    return saveDailyStats(stats);
  }

  async function getSummary() {
    const stats = await getDailyStats();
    return {
      focusCompleted: stats.focusCompleted || 0,
      breaksAccepted: stats.breaksAccepted || 0,
      breaksSkipped: stats.breaksSkipped || 0,
      breaksMissed: stats.breaksMissed || 0,
      reminderBlink: stats.reminderBlink || 0,
      reminderWater: stats.reminderWater || 0,
      reminderStretch: stats.reminderStretch || 0,
      remindersSkipped: stats.remindersSkipped || 0,
      log: stats.log || []
    };
  }

  return { record, getSummary, getDailyStats, todayKey, emptyDay };
})();
