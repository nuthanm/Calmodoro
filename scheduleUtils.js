// Schedule helpers for active hours, lunch block, and time-slot durations.

const CalmodoroSchedule = (() => {
  function parseTime(str) {
    const [h, m] = (str || '00:00').split(':').map(Number);
    return (h * 60) + (m || 0);
  }

  function minutesNow(date = new Date()) {
    return date.getHours() * 60 + date.getMinutes();
  }

  function isActiveDay(settings, date = new Date()) {
    const days = settings.schedule?.activeDays;
    if (!days || !days.length) return true;
    return days.includes(date.getDay());
  }

  function isWithinActiveHours(settings, date = new Date()) {
    if (!isActiveDay(settings, date)) return false;
    const now = minutesNow(date);
    const start = parseTime(settings.schedule?.startTime || '00:00');
    const end = parseTime(settings.schedule?.endTime || '23:59');
    return now >= start && now < end;
  }

  function isLunchBlock(settings, date = new Date()) {
    const lunchStart = settings.schedule?.lunchStart;
    const lunchEnd = settings.schedule?.lunchEnd;
    if (!lunchStart || !lunchEnd) return false;
    const now = minutesNow(date);
    return now >= parseTime(lunchStart) && now < parseTime(lunchEnd);
  }

  function isScheduleActive(settings, date = new Date()) {
    return isWithinActiveHours(settings, date) && !isLunchBlock(settings, date);
  }

  function getWorkDuration(settings, date = new Date()) {
    const now = minutesNow(date);
    const slots = settings.durationSlots || [];
    for (const slot of slots) {
      if (now >= parseTime(slot.start) && now < parseTime(slot.end)) {
        return slot.workDuration || settings.workDuration;
      }
    }
    return settings.workDuration;
  }

  function modeDurationMs(mode, settings, date = new Date()) {
    switch (mode) {
      case 'shortBreak':
        return settings.shortBreakDuration * 60 * 1000;
      case 'longBreak':
        return settings.longBreakDuration * 60 * 1000;
      default:
        return getWorkDuration(settings, date) * 60 * 1000;
    }
  }

  return {
    parseTime,
    minutesNow,
    isActiveDay,
    isWithinActiveHours,
    isLunchBlock,
    isScheduleActive,
    getWorkDuration,
    modeDurationMs
  };
})();
