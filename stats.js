const LOG_META = {
  focusCompleted:    { icon: '🍅', cls: 'ok',   title: 'Focus session completed' },
  breaksAccepted:    { icon: '✓',  cls: 'ok',   title: 'Break accepted' },
  breaksSkipped:     { icon: '⏭', cls: 'skip', title: 'Break skipped' },
  breaksMissed:      { icon: '💤', cls: 'miss', title: 'Break missed' },
  reminderAccepted:  { icon: '👁', cls: 'ok',   title: 'Reminder accepted' },
  remindersSkipped:  { icon: '⏭', cls: 'skip', title: 'Reminder skipped' }
};

document.addEventListener('DOMContentLoaded', loadStats);

async function loadStats() {
  const stats = await chrome.runtime.sendMessage({ action: 'getStats' });
  renderSummary(stats);
  renderBars(stats);
  renderLog(stats.log || []);
}

function renderSummary(s) {
  const items = [
    { val: s.focusCompleted || 0, cls: 'success', lbl: 'Focus done' },
    { val: s.breaksAccepted || 0, cls: 'success', lbl: 'Breaks taken' },
    { val: s.breaksSkipped || 0, cls: 'warn', lbl: 'Skipped' },
    { val: s.breaksMissed || 0, cls: 'miss', lbl: 'Missed' }
  ];
  document.getElementById('summary').innerHTML = items.map((i) => `
    <div class="card summary-card">
      <div class="val ${i.cls}">${i.val}</div>
      <div class="lbl">${i.lbl}</div>
    </div>
  `).join('');
}

function renderBars(s) {
  const max = Math.max(s.reminderBlink || 0, s.reminderWater || 0, s.reminderStretch || 0, s.remindersSkipped || 0, 1);
  const rows = [
    { label: 'Eye rest', val: s.reminderBlink || 0, cls: 'sage' },
    { label: 'Hydrate', val: s.reminderWater || 0, cls: 'sky' },
    { label: 'Stretch', val: s.reminderStretch || 0, cls: 'amber' },
    { label: 'Skipped', val: s.remindersSkipped || 0, cls: 'coral' }
  ];
  document.getElementById('bar-chart').innerHTML = rows.map((r) => `
    <div class="bar-row">
      <span class="bar-label">${r.label}</span>
      <div class="bar-track"><div class="bar-fill ${r.cls}" style="width:${(r.val / max) * 100}%"></div></div>
      <span class="bar-val">${r.val}</span>
    </div>
  `).join('');
}

function renderLog(log) {
  const el = document.getElementById('log-list');
  if (!log.length) {
    el.innerHTML = '<p class="empty-log">No activity yet today. Start a focus session!</p>';
    return;
  }

  el.innerHTML = log.slice(0, 20).map((entry) => {
    const meta = LOG_META[entry.type] || { icon: '•', cls: 'ok', title: entry.type };
    let subtitle = '';
    if (entry.type === 'reminderAccepted' && entry.detail?.kind) {
      subtitle = `${entry.detail.kind} reminder`;
    } else if (entry.detail?.reason) {
      subtitle = entry.detail.reason;
    }
    const time = new Date(entry.time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    return `
      <div class="log-item">
        <div class="log-icon ${meta.cls}">${meta.icon}</div>
        <div class="log-text"><strong>${meta.title}</strong>${subtitle ? `<span>${subtitle}</span>` : ''}</div>
        <span class="log-time">${time}</span>
      </div>
    `;
  }).join('');
}
