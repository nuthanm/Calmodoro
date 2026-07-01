/* Shared SVG logo + prototype navigation */

const LOGO_SVG = `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <circle cx="16" cy="16" r="15" fill="#E07A5F" opacity="0.15"/>
  <ellipse cx="16" cy="18" rx="9" ry="10" fill="#E07A5F"/>
  <path d="M10 14 Q16 6 22 14" fill="#7C9A82"/>
  <ellipse cx="16" cy="12" rx="3" ry="2" fill="#5F7D65" opacity="0.5"/>
  <ellipse cx="13" cy="17" rx="1.5" ry="2" fill="white" opacity="0.35"/>
</svg>`;

const NAV_PAGES = [
  { href: 'index.html',       label: 'Hub' },
  { href: 'popup.html',       label: 'Popup' },
  { href: 'break-desktop.html', label: 'Break' },
  { href: 'layouts.html',     label: 'Layouts' },
  { href: 'settings.html',    label: 'Settings' },
  { href: 'stats.html',       label: 'Stats' }
];

function renderLogo(className = 'logo-mark') {
  return `<a href="index.html" class="${className}">
    ${LOGO_SVG}
    <span class="wordmark">Calmodoro</span>
  </a>`;
}

function renderNav(activePage) {
  const file = activePage.split('/').pop();
  const links = NAV_PAGES.map(p => {
    const cls = p.href === file ? 'active' : '';
    return `<a href="${p.href}"${cls ? ` class="${cls}"` : ''}>${p.label}</a>`;
  }).join('');
  return `<nav class="proto-nav">
    ${renderLogo()}
    <div class="proto-nav-links">${links}</div>
  </nav>
  <div class="proto-banner">
    <strong>Design prototype</strong> — preview only, not wired to the extension yet.
  </div>`;
}

function injectNav(activePage) {
  const mount = document.getElementById('proto-nav-mount');
  if (mount) mount.innerHTML = renderNav(activePage);
}

document.addEventListener('DOMContentLoaded', () => {
  injectNav(window.location.pathname);
});
