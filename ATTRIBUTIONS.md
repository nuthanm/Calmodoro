# Attributions & Licenses

This document lists **every third-party component** used in Calmodoro and the **original assets** created for this project. It is intended for Chrome Web Store review, organizational compliance, and open-source transparency.

> **Copyright policy:** Calmodoro does not ship stock photos, commercial icons, or copyrighted character art. Break animations are original SVG/CSS artwork. Optional legacy Lottie JSON files in `lottie/animations/` were authored for this repository.

---

## Quick reference

| Category | Count | Attribution required? | License summary |
|----------|------:|----------------------|-----------------|
| Project source code | 1 | No (you may use under MIT) | [MIT License](../LICENSE) |
| Original artwork (icons, SVG, hero) | 5+ | No | MIT (same as project) |
| Google Font (DM Sans) | 1 | No (OFL allows bundling without notice) | SIL Open Font License 1.1 |
| lottie-web library (optional) | 1 | Yes (preserve copyright notice) | MIT |
| Legacy Lottie JSON (optional) | 2 | No (original to this repo) | MIT (same as project) |

---

## 1. Project license

| Field | Detail |
|-------|--------|
| **Component** | Calmodoro source code (all `.js`, `.html`, `.css` authored for this extension) |
| **Copyright** | Copyright (c) 2026 Nuthan Murarysetty |
| **License** | MIT License |
| **Full text** | [LICENSE](../LICENSE) |
| **Attribution required** | No (MIT permits use with copyright notice in copies) |
| **Commercial use** | Allowed |
| **Modification** | Allowed |

---

## 2. Original assets (no third-party copyright)

These assets were **created specifically for Calmodoro**. They are licensed under the same **MIT License** as the project. No external attribution is required.

| Asset | Location | Description |
|-------|----------|-------------|
| Extension toolbar icons | `icons/icon16.png`, `icon32.png`, `icon48.png`, `icon128.png`, source `icons/icon.svg` | Coral tomato + sage leaf on cream rounded square — original Calmodoro brand mark |
| Character animations | `characters.js`, `animations.css` | Hydrate, blink, stretch, walk — CSS/SVG loops |
| Logo mark (SVG) | Used in popup, break, settings UI | Inline SVG wordmark + tomato |
| Hero banner | `docs/hero.svg` | README / store preview banner — original vector art |
| Prototype previews | `prototype/` | Design mockups — original |

| Field | Detail |
|-------|--------|
| **License** | MIT (Copyright (c) 2026 Nuthan Murarysetty) |
| **Attribution required** | No |
| **Derivative works** | Allowed under MIT terms |

---

## 3. Third-party libraries

### 3.1 lottie-web (optional — legacy break player)

| Field | Detail |
|-------|--------|
| **Component** | lottie-web JavaScript player |
| **File** | `lottie/lottie.min.js` |
| **Author** | Airbnb |
| **Source** | https://github.com/airbnb/lottie-web |
| **License** | MIT License |
| **License URL** | https://github.com/airbnb/lottie-web/blob/master/LICENSE.md |
| **Used for** | Optional legacy Lottie playback (v2 break UI uses original SVG animations by default) |
| **Attribution required** | Yes — retain copyright notice in source/redistributions |
| **Attribution text** | `Copyright (c) Airbnb` (see upstream LICENSE) |
| **Commercial use** | Allowed under MIT |

### 3.2 DM Sans (Google Fonts)

| Field | Detail |
|-------|--------|
| **Component** | DM Sans typeface |
| **Author** | Jonny Pinhorn, Colophon Foundry (via Google Fonts) |
| **Source** | https://fonts.google.com/specimen/DM+Sans |
| **License** | SIL Open Font License 1.1 |
| **License URL** | https://openfontlicense.org |
| **Used for** | UI typography via `@import` in `design-tokens.css` |
| **Attribution required** | No (OFL — optional credit appreciated) |
| **Commercial use** | Allowed |
| **Note** | Font is loaded from Google Fonts CDN at runtime; it is not bundled in the extension package |

---

## 4. Legacy animation JSON (original to this repository)

These files are **not** downloaded from LottieFiles or other marketplaces. They were built for Calmodoro.

| File | Name (internal) | License | Attribution |
|------|-----------------|---------|-------------|
| `lottie/animations/stretch.json` | Breathing – Stretch Reminder | MIT (project) | Not required |
| `lottie/animations/water.json` | Water Reminder – Drop | MIT (project) | Not required |

If you replace these files with third-party animations, **remove the row above and add a new entry** using this template:

```markdown
| File | Creator | Source URL | License | Attribution required | Attribution text |
|------|---------|------------|---------|-------------------|------------------|
| `lottie/animations/<file>.json` | <name> | <url> | <license> | Yes/No | `<text>` |
```

---

## 5. Chrome platform APIs

| API | Permission | Purpose |
|-----|------------|---------|
| `chrome.storage` | `storage` | Persist timer state, settings, daily stats |
| `chrome.alarms` | `alarms` | Session end timing, micro-reminder intervals, badge fallback |
| `chrome.notifications` | `notifications` | Session and reminder alerts |
| `chrome.windows` | `windows` | Break / toast overlay windows |
| `chrome.offscreen` | `offscreen` | 1-second toolbar badge updates while timer runs |
| `chrome.action` | (default) | Toolbar icon badge countdown display |

No remote code is executed. No analytics SDKs are included.

---

## 6. Adding new third-party assets (maintainer checklist)

Before merging any external asset:

1. Confirm license allows **commercial** and **redistribution** in a Chrome extension.
2. Add a row to the tables in this file.
3. Include required attribution text in this file and, if required, in a `NOTICE` section of the UI.
4. Do **not** add assets labeled “free for personal use only” or “no commercial use.”
5. Prefer **CC0**, **MIT**, **Apache-2.0**, or **original work**.

---

## 7. Contact

For licensing questions about this project, open an issue in the repository or contact the maintainer listed in [LICENSE](../LICENSE).
