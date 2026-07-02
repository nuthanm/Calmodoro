## Testing observations, issues, and fixes (living document)

This document is a **living log** of what we observed while testing Calmodoro, the issues found, and the **recommended fix / mitigation** for each.

- **Rule**: When you find a new observation or issue while testing, **append it here** (do not overwrite older notes).
- **Format**: Prefer **Observation → Impact → Fix / Solution → How to verify**.
- **Link**: This file is referenced from `README.md` so testers can find it quickly.
- **Architecture / storage / DIY fixes**: See [docs/CALMODORO_STUDY_GUIDE.md](./docs/CALMODORO_STUDY_GUIDE.md).

---

## Observations (verified behaviors)

### Schedule enforcement pauses timer outside active hours

- **Observation**: If a session is running and schedule becomes inactive (outside active hours or lunch block), the service worker transitions the timer to **paused** and sets `pausedBySchedule: true`.
- **Impact**: Prevents the timer from silently running during off-hours, and makes the pause reason explicit.
- **Fix / Solution**: No change required (intended). Ensure UI reflects that actions are blocked while schedule is inactive.
- **How to verify**:
  - Set active hours to a narrow window, start Focus, then move clock outside the window (or set a lunch block).
  - Confirm state becomes **paused** and badge shows **⏸**.

### Auto-resume when schedule becomes active again (only if paused by schedule)

- **Observation**: When schedule transitions from inactive → active, if timer was paused by schedule and `remainingMs` exists, the worker auto-resumes the session and clears `pausedBySchedule`.
- **Impact**: Reduces manual intervention; timer continues smoothly when the schedule resumes.
- **Fix / Solution**: No change required (intended). Ensure this does not resume sessions paused manually by the user.
- **How to verify**:
  - Start a session, let schedule pause it (inactive hours).
  - When schedule becomes active again, confirm the session resumes automatically.
  - Manually pause a session and confirm schedule changes do **not** auto-resume it.

### Popup blocks start/resume actions when schedule is inactive

- **Observation**: In the popup, when `scheduleActive === false` and state is `idle/paused/break_pending/recovery_pending`, the **Start/Resume button is disabled** and a banner explains why.
- **Impact**: Avoids “dead clicks” where the background blocks the action but the UI looks interactive.
- **Fix / Solution**: No change required (intended). If testers report confusion, consider adding a tooltip with “Active hours: …”.
- **How to verify**:
  - Make schedule inactive, open popup, confirm Start/Resume is disabled and banner is visible.
  - When schedule becomes active, confirm button re-enables on next poll tick.

---

## Issues found + solutions

### Badge update frequency can be slower without offscreen support

- **Issue**: If the offscreen document cannot be created (Chrome restriction or reason mismatch), badge ticking falls back to an **alarm-based tick** that is best-effort and not truly 1-second accurate.
- **Impact**: Timer still works, but toolbar badge may appear “laggy”.
- **Fix / Solution**:
  - Ensure `offscreen.html` is present and `manifest.json` includes proper offscreen permissions/entries (if used).
  - Keep the alarm fallback, but document that it’s approximate.
- **How to verify**:
  - Run with normal Chrome: badge should tick smoothly.
  - Simulate offscreen failure (review console warnings) and confirm badge still updates periodically.

### Schedule toast window may not appear in some environments (RDP / focus / popup blocked)

- **Issue**: `openOverlayWindow('toast', ...)` can fail or be suppressed in certain environments; the code falls back to a Chrome notification.
- **Impact**: Users may miss the schedule pause/resume message if both toast and notifications are blocked.
- **Fix / Solution**:
  - Keep notification fallback enabled.
  - If a user reports missing alerts, verify notification permissions and Windows Focus Assist / Chrome notification settings.
- **How to verify**:
  - Trigger schedule pause/resume with DND off and confirm either toast window or a notification appears.

### Autoclose schedule toast uses `window.close()` which may be blocked if tab isn’t a popup window

- **Issue**: In `toast.html`, autoclose calls `window.close()`. This works for extension popup windows, but can fail if the page is opened as a normal tab.
- **Impact**: Toast could remain open unexpectedly in the “opened as tab” scenario.
- **Fix / Solution**:
  - Ensure toast is always opened via `chrome.windows.create({ type: 'popup' })` (current behavior).
  - If testers open `toast.html` directly as a tab for debugging, consider adding a visible “Close” affordance (optional).
- **How to verify**:
  - Trigger a real toast (popup window) and confirm it autocloses.
  - Open `toast.html` directly as a tab and confirm the limitation.

### Offscreen badge ticker delegates updates to the service worker

- **Observation**: `offscreen.js` no longer calls `chrome.action.setBadgeText` directly. Each second it sends `{ action: 'badgeTick' }` to the service worker, which runs `enforceSchedule()` then `updateBadge()`.
- **Impact**: Badge updates are centralized in `background.js`; offscreen doc only needs a timer loop. Schedule enforcement can run during badge ticks.
- **Fix / Solution**: No change required (intended). If badge stops updating, check service worker console for `badgeTick` handling errors.
- **How to verify**:
  - Start a focus session, close popup, confirm badge ticks every second.
  - In `chrome://extensions` → Service worker → Inspect, confirm no repeated errors on `badgeTick`.

### Badge countdown format is always `M:SS` (no compact `25m` mode)

- **Observation**: `timerUtils.js` now uses `formatCountdown()` for both popup and badge. Minutes are **not** zero-padded on the badge (e.g. `9:05`), but popup uses padded minutes (`09:05`).
- **Impact**: README examples showing `25m` for long sessions are outdated.
- **Fix / Solution**: Update docs/screenshots if needed. Reintroduce compact badge format only if toolbar space becomes an issue.
- **How to verify**:
  - Run a 25-minute session; badge should show `25:00`, `24:59`, … not `25m`.

### Schedule enforcement uses multiple wake-up paths

- **Observation**: `enforceSchedule()` runs on: every `getState` (popup poll), every `badgeTick`, `scheduleCheck` alarm (every **1 minute**), and `scheduleResume` alarm (exact `resumeAtMs` from schedule).
- **Impact**: Timer pauses/resumes near schedule boundaries without requiring the popup to be open.
- **Fix / Solution**: No change required (intended). If resume is late by >1 min, check that `ALARM_SCHEDULE_RESUME` was created (service worker → Application → Alarms in devtools if available, or add temporary logging).
- **How to verify**:
  - Set lunch block 1–2 minutes ahead, run focus, confirm auto-pause at lunch start and auto-resume at lunch end.
  - Confirm `pausedBySchedule` is `true` after schedule pause and `false` after manual pause.

### Manual pause vs schedule pause (`pausedBySchedule`)

- **Observation**: User-initiated pause sets `pausedBySchedule: false`. Schedule enforcement sets `pausedBySchedule: true`. Auto-resume on schedule active only happens when `pausedBySchedule === true`.
- **Impact**: Users who manually pause before end-of-day are **not** auto-resumed next morning (intended).
- **Fix / Solution**: No change required. Document in UI if users report confusion.
- **How to verify**:
  - Manually pause during active hours; change clock to next active day → should stay paused.
  - Let schedule pause a running session → should auto-resume when schedule becomes active.

### Break-end alert uses centered `alert` window + notification

- **Observation**: When a **break** session ends (not focus), `handleSessionEnd()` opens a centered `alert` toast (`showUserAlert`) plus a system notification, instead of only a notification.
- **Impact**: Break completion is more visible; DND still suppresses overlays.
- **Fix / Solution**: No change required (intended).
- **How to verify**:
  - Complete a short break with DND off → centered “Break over” popup and notification.
  - Enable DND → no popup; timer/auto-start behavior unchanged.

### Micro-reminder `notification` mode may show both window and notification

- **Observation**: `fireMicroReminder()` opens an overlay first; if `reminderWindowMode === 'notification'`, it **also** fires `showSystemNotification()` after the window opens successfully.
- **Impact**: Users may get duplicate alerts (window + notification).
- **Fix / Solution**: Consider skipping the overlay when mode is `notification`, or skip notification when overlay succeeds (product decision).
- **How to verify**:
  - Set reminder mode to Notification, trigger a reminder, observe whether both appear.

### Badge API compatibility shim (`browserAction` fallback)

- **Observation**: `setBadgeTextSafe` / `setBadgeBackgroundColorSafe` use `chrome.action || chrome.browserAction` with try/catch.
- **Impact**: Better compatibility with Chromium variants; silent no-op if APIs missing.
- **Fix / Solution**: No change required.
- **How to verify**:
  - Standard Chrome: badge updates normally.
  - If badge never appears on a fork, check whether `action`/`browserAction` exists in that browser.

### Alarm fallback interval is ~6 seconds (not 30 seconds)

- **Observation**: When offscreen document fails, `scheduleNextBadgeTick()` uses `delayInMinutes: 0.1` (~6 s), not 30 s. Console warning text still mentions “30 s” (stale message).
- **Impact**: Fallback is more responsive than old docs suggest; still not true 1 s updates.
- **Fix / Solution**: Align README/console warning with `0.1` minute if keeping current value.
- **How to verify**:
  - Disable/block offscreen (or read console warning), confirm badge updates roughly every few seconds.

---

## Add new entries (copy/paste template)

### <Short title>

- **Observation/Issue**:
- **Impact**:
- **Fix / Solution**:
- **How to verify**:

