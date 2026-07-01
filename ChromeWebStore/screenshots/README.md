# Screenshot specifications

## Required dimensions

| Size | Use |
|------|-----|
| **1280 × 800** | Recommended primary size (use this) |
| 640 × 400 | Minimum acceptable alternative |

## Format

- **PNG** or **JPEG**
- Max **2 MB** per file
- Upload **1–5** images (5 recommended)

## Files in this folder

| File | What it should show |
|------|---------------------|
| `01-popup-timer.png` | Extension popup open — focus timer running, stats row visible |
| `02-break-triptych.png` | Break window — three panels (hydrate, blink, stretch) |
| `03-settings-schedule.png` | Settings page — active hours, micro-reminders |
| `04-stats-tracking.png` | Stats page — completed, skipped, missed |
| `05-toolbar-badge.png` | Browser toolbar with **badge countdown** on icon, popup closed |

> **Regenerate:** From `../capture/`, run `node render-screenshots.mjs` (requires Google Chrome). See [../capture/README.md](../capture/README.md).

## Capture order in Developer Dashboard

Upload in this order — the first image is the cover thumbnail in search results.

1. Popup timer (hero shot)
2. Break triptych (unique selling point)
3. Toolbar badge (key differentiator)
4. Settings
5. Stats

## Tips for good screenshots

- Use a **clean browser profile** (no personal bookmarks visible)
- **Light background** tabs work best with Calmodoro's soft theme
- Show **real timer values** (not 00:00 idle unless demonstrating idle state)
- Avoid blurry or cropped UI
- Do not add marketing text overlays in the image (put text in store description instead)
