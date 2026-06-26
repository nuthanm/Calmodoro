[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/nuthanm/Calmodoro/actions)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](/LICENSE)
[![Manifest V3](https://img.shields.io/badge/Chrome%20Extension-Manifest%20V3-4285F4?logo=googlechrome)](https://developer.chrome.com/docs/extensions/mv3/)

# Calmodoro

Calmodoro is a Chrome extension that combines a focused Pomodoro timer with calming Lottie animations and visual break reminders. It is designed to help users stay productive while building healthier work and rest habits throughout the day.

## Features

- 🍅 **Pomodoro timer** with Start, Pause, Resume, and Reset controls
- ⏱️ **Countdown badge** — live timer shown on the extension icon even when the popup is closed
- ⚙️ **Adjustable intervals** — customise focus, short break, and long break durations
- 🎬 **Lottie break animations** — stretching and water-reminder animations loop during each break
- 🔕 **Do Not Disturb mode** — suppresses all break pop-ups and notifications
- 🔁 **Auto-start** — optionally auto-start breaks or the next focus session
- 📦 **Manifest V3** — built on the latest Chrome extension platform

## Project Structure

```
Calmodoro/
├── manifest.json          # Extension manifest (MV3)
├── background.js          # Service worker: timer, badge, alarms, notifications
├── popup.html/css/js      # Toolbar popup: Start/Pause/Reset, progress ring, session dots
├── settings.html/css/js   # Settings page: durations, DND, auto-start toggles
├── break.html/css/js      # Break animation overlay with Lottie + CSS fallback
├── lottie/
│   ├── lottie.min.js      # lottie-web player (bundled)
│   └── animations/
│       ├── stretch.json   # Breathing/stretching animation (short break)
│       └── water.json     # Water drop animation (long break)
└── icons/                 # Extension icons (16, 32, 48, 128 px)
```

## Getting Started

### Load the extension locally (Developer mode)

1. Clone the repository:
   ```bash
   git clone https://github.com/nuthanm/Calmodoro.git
   cd Calmodoro
   ```
2. Open Chrome and navigate to `chrome://extensions`.
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the `Calmodoro` project folder.
5. The 🍅 Calmodoro icon appears in the Chrome toolbar.

### Test changes

After editing any source file:
- Go to `chrome://extensions` and click the **↺ Reload** icon on the Calmodoro card.
- For service worker changes, also click **Service Worker → Inspect** to open the DevTools console.

### Package for distribution

To create a `.zip` ready for the Chrome Web Store:

```bash
# From the repository root
zip -r calmodoro.zip . \
  --exclude "*.git*" \
  --exclude "*.md" \
  --exclude "*.gitignore"
```

Upload `calmodoro.zip` to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/).

## Usage

### Start a focus session

1. Click the 🍅 icon in the Chrome toolbar.
2. Select a mode (Focus / Short Break / Long Break) using the top tabs.
3. Press **Start** — the countdown begins and the badge on the icon tracks remaining time.
4. Press **Pause** to suspend the timer, and **Resume** to continue.
5. Press the reset icon (↺) to return to the idle state.

### Take guided breaks

When a focus session finishes, Calmodoro:
1. Shows a browser notification (unless Do Not Disturb is on).
2. Opens an animated break window with a breathing animation and wellness tips.
3. Displays a break countdown — the animation loops for the full break duration.
4. Click **Skip →** at any time to dismiss the break and return to work.

### Adjust your routine

Click the ⚙ gear icon in the popup header to open the Settings page where you can:
- Change focus and break durations (1-minute granularity)
- Set how many focus sessions before a long break (default: 4)
- Enable or disable Do Not Disturb mode
- Toggle auto-start for breaks and focus sessions

### Do Not Disturb mode

Toggle **Do Not Disturb** directly in the popup or in Settings. When enabled:
- The break animation window is not opened
- Browser notifications are suppressed
- The timer continues and the badge still counts down

## Customising Lottie animations

The break page uses [lottie-web](https://github.com/airbnb/lottie-web) (bundled at `lottie/lottie.min.js`) to play the animations in `lottie/animations/`. To swap in your own animations:

1. Download a free animation from [LottieFiles](https://lottiefiles.com/) as a `.json` file.
2. Replace `lottie/animations/stretch.json` (short break) or `lottie/animations/water.json` (long break).
3. Reload the extension in `chrome://extensions`.

If the JSON fails to load, the break page automatically falls back to the CSS breathing-ring animation.

## Architecture notes

| Component | Mechanism |
|-----------|-----------|
| Timer persistence | `chrome.storage.local` stores `endTime`, `state`, `mode` |
| Session end alarm | `chrome.alarms` fires at the exact `endTime` timestamp |
| Badge (popup open) | `popup.js` updates badge every second via `chrome.action.setBadgeText` |
| Badge (popup closed) | Background `badgeTick` alarm updates the badge every ~1 minute |
| Break animation | `break.js` plays the Lottie animation in a loop for the break duration, then stops |

## Contributing

Contributions are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Make focused, well-documented changes.
4. Test your updates in Chrome using the unpacked extension workflow.
5. Open a pull request with a clear summary of what changed and why.

Please keep changes small, reviewable, and aligned with the existing product direction.

## License

This project is licensed under the MIT License. See the [LICENSE](/LICENSE) file for details.

## About / Contact

Calmodoro is intended to make time management feel calmer, more visual, and easier to maintain throughout the day.

For questions, ideas, or collaboration, open an issue in this repository or contact the maintainer through the repository profile.
