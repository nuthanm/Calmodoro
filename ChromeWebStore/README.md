# Calmodoro — Chrome Web Store Publishing Kit

Everything you need to publish Calmodoro on the [Chrome Web Store](https://chrome.google.com/webstore/devconsole/) after testing for a few days.

---

## Quick start (after testing)

| Step | Action | File / folder |
|------|--------|----------------|
| 1 | Read the checklist | [CHECKLIST.md](./CHECKLIST.md) |
| 2 | Copy store listing text | [listing/](./listing/) |
| 3 | Replace screenshots with real captures | [screenshots/](./screenshots/) ← use [capture/](./capture/) |
| 4 | Add promo tile (optional but recommended) | [promotional/](./promotional/) |
| 5 | Host privacy policy & paste URL in dashboard | [privacy/privacy-policy.md](./privacy/privacy-policy.md) |
| 6 | Zip extension (exclude this folder) | See [Packaging](#packaging-the-extension) below |
| 7 | Upload in Developer Dashboard | — |

---

## What Chrome Web Store requires

### Required

| Asset / field | Spec | Calmodoro location |
|---------------|------|-------------------|
| **Extension ZIP** | Unpacked or packaged MV3 extension | Repo root (exclude `ChromeWebStore/`, `prototype/`) |
| **Store icon** | 128×128 PNG | `../icons/icon128.png` (also copied here) |
| **Screenshots** | At least **1**, up to **5** recommended | `screenshots/` — **1280×800** or **640×400** JPEG/PNG |
| **Short description** | Max **132 characters** | `listing/short-description.txt` |
| **Detailed description** | Plain text or formatted in dashboard | `listing/detailed-description.txt` |
| **Category** | e.g. Productivity | `listing/category.txt` |
| **Single purpose** | One clear sentence | `listing/single-purpose.txt` |
| **Privacy policy** | URL required if you handle user data; recommended for all | `privacy/privacy-policy.md` → host on GitHub |
| **Permission justifications** | Explain each permission | `listing/permission-justifications.md` |

### Optional (recommended)

| Asset | Spec | Location |
|-------|------|----------|
| **Small promo tile** | 440×280 JPEG/PNG | `promotional/promo-small-440x280.png` |
| **Marquee promo** | 1400×560 | `promotional/promo-marquee-1400x560.png` |
| **Promotional video** | YouTube URL | `video/script-outline.md` |
| **Additional screenshots** | 1280×800 | Up to 5 total |

---

## Folder structure

```
ChromeWebStore/
├── README.md                 ← You are here
├── CHECKLIST.md              ← Step-by-step before submit
├── listing/                  ← Copy-paste store text
│   ├── store-name.txt
│   ├── short-description.txt
│   ├── detailed-description.txt
│   ├── single-purpose.txt
│   ├── category.txt
│   └── permission-justifications.md
├── privacy/
│   └── privacy-policy.md     ← Host publicly; paste URL in dashboard
├── screenshots/              ← Upload these (replace placeholders after testing)
│   ├── README.md
│   ├── 01-popup-timer.png
│   ├── 02-break-triptych.png
│   ├── 03-settings-schedule.png
│   ├── 04-stats-tracking.png
│   └── 05-toolbar-badge.png
├── promotional/
│   ├── promo-small-440x280.png
│   └── promo-marquee-1400x560.png
├── capture/                  ← Open in Chrome → screenshot at 1280×800
│   ├── README.md
│   ├── 01-popup.html
│   ├── 02-break.html
│   ├── 03-settings.html
│   ├── 04-stats.html
│   └── 05-badge-demo.html
└── video/
    ├── README.md
    └── script-outline.md
```

---

## How to capture real screenshots (recommended)

After **3–7 days of daily use**, replace placeholder PNGs with real captures:

1. Load the extension unpacked in Chrome (`chrome://extensions`).
2. Open each file in `capture/` in a **new Chrome window** (not the extension popup directly).
3. Set zoom to **100%**.
4. Capture at **1280×800** using one of:
   - **Windows:** Snipping Tool → window snip, or Win+Shift+S
   - **Chrome DevTools:** Toggle device toolbar → Responsive → 1280×800 → Capture screenshot
   - **Extension:** Full Page Screen Capture (optional)
5. Save over files in `screenshots/` keeping the same filenames.
6. Compress if any file exceeds **2 MB** (Store limit per image).

Detailed steps: [capture/README.md](./capture/README.md)

---

## Screenshot order for the store

Upload in this order (first image = cover in search):

1. **01-popup-timer** — Main popup with timer running (shows core value)
2. **02-break-triptych** — Break ritual (differentiator)
3. **05-toolbar-badge** — Icon badge while popup closed (key feature)
4. **03-settings-schedule** — Active hours & micro-reminders
5. **04-stats-tracking** — Skip/miss/completion stats

---

## Promotional video (optional)

Not required. Helpful for featured placement.

| Spec | Value |
|------|--------|
| Length | 30 seconds – 2 minutes |
| Host | YouTube (unlisted is fine) |
| Content | Start focus → close popup → badge counts down → break triptych → settings |

Script: [video/script-outline.md](./video/script-outline.md)

---

## Privacy policy URL

1. Copy `privacy/privacy-policy.md` to your repo (or GitHub Pages).
2. Use raw GitHub URL or Pages URL in the Developer Dashboard.
3. Example: `https://github.com/nuthanm/Calmodoro/blob/main/ChromeWebStore/privacy/privacy-policy.md`

---

## Packaging the extension

**Do not include** `ChromeWebStore/`, `prototype/`, or `.git` in the upload ZIP.

### Windows (PowerShell)

```powershell
cd "d:\My work\Calmodoro"
$exclude = @('ChromeWebStore', 'prototype', '.git', '.gitignore', 'calmodoro-store.zip')
$paths = Get-ChildItem -Path . -Force | Where-Object {
  ($exclude -notcontains $_.Name) -and ($_.Name -notlike '*.md')
} | ForEach-Object { $_.FullName }
if (-not $paths) { throw 'No files to package.' }
Compress-Archive -Path $paths -DestinationPath calmodoro-store.zip -Force
```

### Manual ZIP contents (minimum)

```
manifest.json
background.js
offscreen.html / offscreen.js
popup.* / break.* / settings.* / stats.* / toast.* / recovery.html
design-tokens.css / animations.css / characters.js
settingsDefaults.js / scheduleUtils.js / statsUtils.js / timerUtils.js
icons/
lottie/ (optional legacy)
```

---

## Store review tips

- **Test permissions:** Reviewers check `offscreen`, `notifications`, `windows` — justifications are in `listing/permission-justifications.md`.
- **Single purpose:** Calmodoro = Pomodoro + wellness breaks (one purpose).
- **No remote code:** Do not add CDN scripts except Google Fonts (already documented in ATTRIBUTIONS.md).
- **Screenshots must match** the actual extension UI after your test period.
- **Version:** Bump `manifest.json` version before each upload.

---

## After approval

- Monitor reviews and crash reports in the Developer Dashboard.
- Update screenshots when UI changes significantly.
- Keep [ATTRIBUTIONS.md](../ATTRIBUTIONS.md) current if you add assets.

---

## Related docs

- [Main README](../README.md)
- [ATTRIBUTIONS.md](../ATTRIBUTIONS.md)
- [LICENSE](../LICENSE)
