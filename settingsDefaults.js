// Shared default settings for Calmodoro (popup, settings page, service worker).

const CalmodoroSettings = (() => {
  const DEFAULT_SETTINGS = {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    sessionsBeforeLongBreak: 4,
    autoStartBreak: false,
    autoStartWork: false,
    doNotDisturb: false,
    breakWindowMode: 'popup',
    reminderWindowMode: 'toast',
    soundEnabled: false,
    offlineBehavior: 'ask',
    schedule: {
      activeDays: [1, 2, 3, 4, 5],
      startTime: '09:00',
      endTime: '18:00',
      lunchStart: '12:30',
      lunchEnd: '13:30'
    },
    durationSlots: [
      { start: '09:00', end: '12:30', workDuration: 50 },
      { start: '13:30', end: '18:00', workDuration: 25 }
    ],
    microReminders: {
      blink:   { enabled: true, intervalMin: 20 },
      water:   { enabled: true, intervalMin: 45 },
      stretch: { enabled: true, intervalMin: 60 }
    }
  };

  const MODE_COLORS = {
    work: '#E07A5F',
    shortBreak: '#7C9A82',
    longBreak: '#6BA3BE'
  };

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

  function mergeSettings(saved) {
    const s = { ...DEFAULT_SETTINGS, ...(saved || {}) };
    s.schedule = { ...DEFAULT_SETTINGS.schedule, ...(saved?.schedule || {}) };
    s.microReminders = {
      blink:   { ...DEFAULT_SETTINGS.microReminders.blink,   ...(saved?.microReminders?.blink   || {}) },
      water:   { ...DEFAULT_SETTINGS.microReminders.water,   ...(saved?.microReminders?.water   || {}) },
      stretch: { ...DEFAULT_SETTINGS.microReminders.stretch, ...(saved?.microReminders?.stretch || {}) }
    };
    s.durationSlots = buildDurationSlots(s.schedule, saved?.durationSlots);
    return s;
  }

  return { DEFAULT_SETTINGS, MODE_COLORS, mergeSettings };
})();
