/**
 * Renders Chrome Web Store screenshots from capture HTML frames.
 * Uses system Chrome in headless mode (no Puppeteer download required).
 *
 * Usage: node render-screenshots.mjs
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CHROME_PATHS = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe')
].filter(Boolean);

const FRAMES = [
  { html: '01-popup-frame.html', out: '../screenshots/01-popup-timer.png' },
  { html: '02-break-frame.html', out: '../screenshots/02-break-triptych.png' },
  { html: '03-settings-frame.html', out: '../screenshots/03-settings-schedule.png' },
  { html: '04-stats-frame.html', out: '../screenshots/04-stats-tracking.png' },
  { html: '05-badge-frame.html', out: '../screenshots/05-toolbar-badge.png' }
];

function findChrome() {
  for (const p of CHROME_PATHS) {
    if (existsSync(p)) return p;
  }
  throw new Error('Chrome not found. Set CHROME_PATH or install Google Chrome.');
}

function toFileUrl(absPath) {
  return 'file:///' + absPath.replace(/\\/g, '/').replace(/ /g, '%20');
}

function renderFrame(chrome, htmlFile, outFile) {
  const htmlPath = path.resolve(__dirname, htmlFile);
  const outPath = path.resolve(__dirname, outFile);
  const url = toFileUrl(htmlPath);

  execFileSync(chrome, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--window-size=1280,800',
    `--screenshot=${outPath}`,
    url
  ], { stdio: 'pipe', timeout: 60000 });

  return outPath;
}

const chrome = findChrome();
console.log(`Using Chrome: ${chrome}\n`);

for (const { html, out } of FRAMES) {
  const outPath = renderFrame(chrome, html, out);
  console.log(`✓ ${path.basename(outPath)}`);
}

console.log('\nDone — 5 screenshots saved to ../screenshots/');
