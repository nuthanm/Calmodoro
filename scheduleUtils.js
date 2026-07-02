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

  function formatTimeLabel(timeStr) {
    const [h, m] = (timeStr || '00:00').split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m || 0).padStart(2, '0')} ${period}`;
  }

  function formatTimeRange(start, end) {
    return `${formatTimeLabel(start)}–${formatTimeLabel(end)}`;
  }

  function buildDurationSlots(schedule, savedSlots) {
    const startTime = schedule?.startTime || '09:00';
    const endTime = schedule?.endTime || '18:00';
    const lunchStart = schedule?.lunchStart || '12:30';
    const lunchEnd = schedule?.lunchEnd || '13:30';
    return [
      {
        start: startTime,
        end: lunchStart,
        workDuration: savedSlots?.[0]?.workDuration ?? 50
      },
      {
        start: lunchEnd,
        end: endTime,
        workDuration: savedSlots?.[1]?.workDuration ?? 25
      }
    ];
  }

  function validateSchedule(schedule) {
    const start = parseTime(schedule?.startTime || '09:00');
    const end = parseTime(schedule?.endTime || '18:00');
    const lunchStart = parseTime(schedule?.lunchStart || '12:30');
    const lunchEnd = parseTime(schedule?.lunchEnd || '13:30');

    if (start >= end) {
      return 'End of day must be after start of day.';
    }
    if (lunchStart >= lunchEnd) {
      return 'Lunch end must be after lunch start.';
    }
    if (lunchStart < start || lunchEnd > end) {
      return 'Lunch block must fall within active hours.';
    }
    return null;
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
    formatTimeLabel,
    formatTimeRange,
    buildDurationSlots,
    validateSchedule,
    getWorkDuration,
    modeDurationMs
  };
})();
