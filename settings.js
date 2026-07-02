// Calmodoro – Settings Page Script

const { DEFAULT_SETTINGS, mergeSettings } = CalmodoroSettings;

document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();

  document.querySelectorAll('.step-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.target);
      if (!input) return;
      const step = btn.dataset.op === 'inc' ? 1 : -1;
      const next = Number(input.value) + step;
      const min = Number(input.min);
      const max = Number(input.max);
      if (next >= min && next <= max) input.value = next;
    });
  });

  document.querySelectorAll('.day-pill').forEach((pill) => {
    pill.addEventListener('click', () => pill.classList.toggle('active'));
  });

  ['schedule-start', 'schedule-end', 'lunch-start', 'lunch-end'].forEach((id) => {
    document.getElementById(id).addEventListener('change', updateSlotLabels);
  });

  document.getElementById('save-btn').addEventListener('click', saveSettings);
  document.getElementById('defaults-btn').addEventListener('click', restoreDefaults);
});

async function loadSettings() {
  const data = await chrome.storage.local.get('settings');
  applyToForm(mergeSettings(data.settings));
}

function readScheduleFromForm() {
  return {
    activeDays: readActiveDays(),
    startTime: document.getElementById('schedule-start').value || '09:00',
    endTime: document.getElementById('schedule-end').value || '18:00',
    lunchStart: document.getElementById('lunch-start').value || '12:30',
    lunchEnd: document.getElementById('lunch-end').value || '13:30'
  };
}

function readActiveDays() {
  const activeDays = [];
  document.querySelectorAll('.day-pill.active').forEach((p) => {
    activeDays.push(Number(p.dataset.day));
  });
  return activeDays.length ? activeDays : DEFAULT_SETTINGS.schedule.activeDays;
}

function updateSlotLabels() {
  const schedule = readScheduleFromForm();
  const slots = CalmodoroSchedule.buildDurationSlots(schedule, []);
  document.getElementById('morning-focus-label').textContent =
    `Morning focus (${CalmodoroSchedule.formatTimeRange(slots[0].start, slots[0].end)})`;
  document.getElementById('afternoon-focus-label').textContent =
    `Afternoon focus (${CalmodoroSchedule.formatTimeRange(slots[1].start, slots[1].end)})`;
}

function applyToForm(s) {
  const days = s.schedule?.activeDays || DEFAULT_SETTINGS.schedule.activeDays;
  document.querySelectorAll('.day-pill').forEach((pill) => {
    pill.classList.toggle('active', days.includes(Number(pill.dataset.day)));
  });

  document.getElementById('schedule-start').value = s.schedule?.startTime || '09:00';
  document.getElementById('schedule-end').value = s.schedule?.endTime || '18:00';
  document.getElementById('lunch-start').value = s.schedule?.lunchStart || '12:30';
  document.getElementById('lunch-end').value = s.schedule?.lunchEnd || '13:30';

  document.getElementById('work-duration').value = s.workDuration;
  document.getElementById('morning-focus').value = s.durationSlots?.[0]?.workDuration || 50;
  document.getElementById('afternoon-focus').value = s.durationSlots?.[1]?.workDuration || 25;
  document.getElementById('short-break').value = s.shortBreakDuration;
  document.getElementById('long-break').value = s.longBreakDuration;
  document.getElementById('sessions-count').value = s.sessionsBeforeLongBreak;

  document.getElementById('reminder-blink').checked = s.microReminders?.blink?.enabled ?? true;
  document.getElementById('interval-blink').value = s.microReminders?.blink?.intervalMin || 20;
  document.getElementById('reminder-water').checked = s.microReminders?.water?.enabled ?? true;
  document.getElementById('interval-water').value = s.microReminders?.water?.intervalMin || 45;
  document.getElementById('reminder-stretch').checked = s.microReminders?.stretch?.enabled ?? true;
  document.getElementById('interval-stretch').value = s.microReminders?.stretch?.intervalMin || 60;

  document.getElementById('dnd-pref').checked = s.doNotDisturb;
  document.getElementById('auto-break').checked = s.autoStartBreak;
  document.getElementById('auto-work').checked = s.autoStartWork;
  document.getElementById('sound-enabled').checked = s.soundEnabled;
  document.getElementById('break-window-mode').value = s.breakWindowMode || 'popup';
  document.getElementById('reminder-window-mode').value = s.reminderWindowMode || 'toast';

  const offline = s.offlineBehavior || 'ask';
  document.querySelectorAll('input[name="offline"]').forEach((r) => {
    r.checked = r.value === offline;
  });

  updateSlotLabels();
}

function readForm() {
  const schedule = readScheduleFromForm();

  return {
    workDuration: clampNum('work-duration', 1, 90),
    shortBreakDuration: clampNum('short-break', 1, 30),
    longBreakDuration: clampNum('long-break', 5, 60),
    sessionsBeforeLongBreak: clampNum('sessions-count', 1, 10),
    doNotDisturb: document.getElementById('dnd-pref').checked,
    autoStartBreak: document.getElementById('auto-break').checked,
    autoStartWork: document.getElementById('auto-work').checked,
    soundEnabled: document.getElementById('sound-enabled').checked,
    breakWindowMode: document.getElementById('break-window-mode').value,
    reminderWindowMode: document.getElementById('reminder-window-mode').value,
    offlineBehavior: document.querySelector('input[name="offline"]:checked')?.value || 'ask',
    schedule,
    durationSlots: CalmodoroSchedule.buildDurationSlots(schedule, [
      { workDuration: clampNum('morning-focus', 1, 90) },
      { workDuration: clampNum('afternoon-focus', 1, 90) }
    ]),
    microReminders: {
      blink: {
        enabled: document.getElementById('reminder-blink').checked,
        intervalMin: clampNum('interval-blink', 5, 120)
      },
      water: {
        enabled: document.getElementById('reminder-water').checked,
        intervalMin: clampNum('interval-water', 5, 180)
      },
      stretch: {
        enabled: document.getElementById('reminder-stretch').checked,
        intervalMin: clampNum('interval-stretch', 5, 180)
      }
    }
  };
}

async function saveSettings() {
  const schedule = readScheduleFromForm();
  const error = CalmodoroSchedule.validateSchedule(schedule);
  if (error) {
    showToast(error);
    return;
  }

  await chrome.storage.local.set({ settings: readForm() });
  try { await chrome.runtime.sendMessage({ action: 'settingsUpdated' }); } catch (_) { /* ignore */ }
  showToast('✓ Settings saved');
}

async function restoreDefaults() {
  await chrome.storage.local.set({ settings: { ...DEFAULT_SETTINGS } });
  applyToForm(DEFAULT_SETTINGS);
  try { await chrome.runtime.sendMessage({ action: 'settingsUpdated' }); } catch (_) { /* ignore */ }
  showToast('✓ Restored to defaults');
}

function clampNum(id, min, max) {
  const v = parseInt(document.getElementById(id).value, 10);
  return Math.min(max, Math.max(min, isNaN(v) ? min : v));
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 2000);
}
