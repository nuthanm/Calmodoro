const META = {
  blink:   { icon: '👁', title: 'Rest your eyes', message: 'Look 20 feet away · 20 seconds' },
  water:   { icon: '💧', title: 'Stay hydrated', message: 'Drink a glass of water' },
  stretch: { icon: '🧘', title: 'Stretch break', message: 'Stand up and stretch your body' },
  schedule: { icon: 'ℹ️', title: 'Timer paused by schedule', message: 'Schedule is inactive right now.' }
};

const params = new URLSearchParams(window.location.search);
const kind = params.get('kind') || 'blink';
const override = {
  icon: params.get('icon'),
  title: params.get('title'),
  message: params.get('message')
};
const base = META[kind] || META.blink;
const meta = {
  icon: override.icon || base.icon,
  title: override.title || base.title,
  message: override.message || base.message
};
const variant = params.get('variant') || null;
const autocloseMs = Number(params.get('autocloseMs') || 0);

document.getElementById('toast-icon').textContent = meta.icon;
document.getElementById('toast-title').textContent = meta.title;
document.getElementById('toast-message').textContent = meta.message;

const acceptBtn = document.getElementById('accept-btn');
const skipBtn = document.getElementById('skip-btn');

if (variant === 'ok') {
  acceptBtn.textContent = 'OK';
  skipBtn.style.display = 'none';
}

if (Number.isFinite(autocloseMs) && autocloseMs > 0) {
  setTimeout(() => window.close(), autocloseMs);
}

document.getElementById('accept-btn').addEventListener('click', async () => {
  if (kind === 'schedule') {
    window.close();
    return;
  }
  await chrome.runtime.sendMessage({ action: 'acceptReminder', kind });
  window.close();
});

document.getElementById('skip-btn').addEventListener('click', async () => {
  if (kind === 'schedule') {
    window.close();
    return;
  }
  await chrome.runtime.sendMessage({ action: 'skipReminder', kind });
  window.close();
});
