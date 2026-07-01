const META = {
  blink:   { icon: '👁', title: 'Rest your eyes', message: 'Look 20 feet away · 20 seconds' },
  water:   { icon: '💧', title: 'Stay hydrated', message: 'Drink a glass of water' },
  stretch: { icon: '🧘', title: 'Stretch break', message: 'Stand up and stretch your body' }
};

const params = new URLSearchParams(window.location.search);
const kind = params.get('kind') || 'blink';
const meta = META[kind] || META.blink;

document.getElementById('toast-icon').textContent = meta.icon;
document.getElementById('toast-title').textContent = meta.title;
document.getElementById('toast-message').textContent = meta.message;

document.getElementById('accept-btn').addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ action: 'acceptReminder', kind });
  window.close();
});

document.getElementById('skip-btn').addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ action: 'skipReminder', kind });
  window.close();
});
