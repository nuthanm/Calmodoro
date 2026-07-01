# How to capture store screenshots

These steps produce **1280×800 PNG** files for `../screenshots/`.

---

## Method A — Real extension UI (recommended after testing)

### 1. Popup timer → `01-popup-timer.png`

1. Pin Calmodoro to the toolbar.
2. Start a focus session (e.g. 25:00).
3. Open the popup.
4. Use **Windows Snipping Tool** or **ShareX**:
   - Capture the popup + a small area of the browser, **or**
   - Open `01-popup-frame.html` in Chrome, paste/composite (Method B).

**Tip:** For a polished store image, use Method B frame with a screenshot of your real popup composited in center.

### 2. Break triptych → `02-break-triptych.png`

1. Start a 1-minute focus session (temporarily in Settings).
2. Wait for break window to open (DND off).
3. Maximize or resize break window wide enough to show all three panels.
4. Screenshot the full break window.
5. Optionally place on `02-break-frame.html` canvas (1280×800).

### 3. Settings → `03-settings-schedule.png`

1. Open Settings from popup gear icon.
2. Scroll to show **Active Hours** and **Micro-Reminders** sections.
3. Chrome DevTools → **Ctrl+Shift+P** → "Capture screenshot" at 1280×800 viewport.

### 4. Stats → `04-stats-tracking.png`

1. Open Stats from popup chart icon.
2. Ensure some stats exist (complete a session first).
3. Capture full tab at 1280×800.

### 5. Toolbar badge → `05-toolbar-badge.png`

1. Start focus session.
2. **Close popup.**
3. Screenshot the **Chrome toolbar** area showing Calmodoro icon with **red/coral badge** (e.g. `24:32`).
4. Use `05-badge-frame.html` as background template for consistent 1280×800 size.

---

## Method B — Auto-render (recommended)

From this folder, run:

```powershell
node render-screenshots.mjs
```

This uses **Google Chrome headless** to render all five `*-frame.html` files at **1280×800** into `../screenshots/`. No extra npm install required.

| File | Output |
|------|--------|
| `01-popup-frame.html` | `01-popup-timer.png` |
| `02-break-frame.html` | `02-break-triptych.png` |
| `03-settings-frame.html` | `03-settings-schedule.png` |
| `04-stats-frame.html` | `04-stats-tracking.png` |
| `05-badge-frame.html` | `05-toolbar-badge.png` |

Frames use the same CSS as the extension for pixel-accurate store previews.

---

## Method C — Manual capture

Open any `*-frame.html` in Chrome → **F12** → device toolbar **1280 × 800** → **Ctrl+Shift+P** → `Capture full size screenshot`.

---

## Checklist before upload

- [ ] All images are **1280×800** (or 640×400)
- [ ] File size **under 2 MB** each
- [ ] UI matches **current extension version**
- [ ] No personal data visible in browser chrome
- [ ] Filenames match `01-` through `05-` convention
