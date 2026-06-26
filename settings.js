// Calmodoro – Settings Page Script

const DEFAULTS = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsBeforeLongBreak: 4,
  autoStartBreak: false,
  autoStartWork: false,
  doNotDisturb: false,
  breakWindowMode: 'popup'
};

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();

  // Stepper buttons (+/-)
  document.querySelectorAll('.step-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.target);
      if (!input) return;
      const step = btn.dataset.op === 'inc' ? 1 : -1;
      const next = Number(input.value) + step;
      const min  = Number(input.min);
      const max  = Number(input.max);
      if (next >= min && next <= max) input.value = next;
    });
  });

  document.getElementById('save-btn').addEventListener('click', saveSettings);
  document.getElementById('defaults-btn').addEventListener('click', restoreDefaults);
});

// ---------------------------------------------------------------------------
// Load / Save
// ---------------------------------------------------------------------------

async function loadSettings() {
  const data = await chrome.storage.local.get('settings');
  const s = { ...DEFAULTS, ...(data.settings || {}) };
  applyToForm(s);
}

function applyToForm(s) {
  document.getElementById('work-duration').value  = s.workDuration;
  document.getElementById('short-break').value    = s.shortBreakDuration;
  document.getElementById('long-break').value     = s.longBreakDuration;
  document.getElementById('sessions-count').value = s.sessionsBeforeLongBreak;
  document.getElementById('dnd-pref').checked     = s.doNotDisturb;
  document.getElementById('auto-break').checked   = s.autoStartBreak;
  document.getElementById('auto-work').checked    = s.autoStartWork;
  document.getElementById('break-window-mode').value = s.breakWindowMode || 'popup';
}

async function saveSettings() {
  const s = readForm();
  await chrome.storage.local.set({ settings: s });

  // Notify background so it can adjust an idle timer's displayed duration
  try {
    await chrome.runtime.sendMessage({ action: 'settingsUpdated' });
  } catch (_) {
    // Background may be inactive; it will pick up settings on next wake.
  }

  showToast('✓ Settings saved');
}

async function restoreDefaults() {
  await chrome.storage.local.set({ settings: { ...DEFAULTS } });
  applyToForm(DEFAULTS);
  try {
    await chrome.runtime.sendMessage({ action: 'settingsUpdated' });
  } catch (_) { /* ignore */ }
  showToast('✓ Restored to defaults');
}

function readForm() {
  return {
    workDuration:            clamp(parseInt(document.getElementById('work-duration').value,  10), 1,  90),
    shortBreakDuration:      clamp(parseInt(document.getElementById('short-break').value,    10), 1,  30),
    longBreakDuration:       clamp(parseInt(document.getElementById('long-break').value,     10), 5,  60),
    sessionsBeforeLongBreak: clamp(parseInt(document.getElementById('sessions-count').value, 10), 1,  10),
    doNotDisturb:    document.getElementById('dnd-pref').checked,
    autoStartBreak:  document.getElementById('auto-break').checked,
    autoStartWork:   document.getElementById('auto-work').checked,
    breakWindowMode: document.getElementById('break-window-mode').value
  };
}

// ---------------------------------------------------------------------------
// UI helpers
// ---------------------------------------------------------------------------

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, isNaN(v) ? min : v));
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 2000);
}
