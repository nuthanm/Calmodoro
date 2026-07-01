# Permission justifications (Chrome Web Store)

Paste or adapt these when the Developer Dashboard asks why each permission is needed.

---

## storage

**Why:** Saves timer state (running/paused/end time), user settings (durations, schedule, DND), and daily stats (completed/skipped breaks) locally on the device.

**Data:** All local. Nothing sent to external servers.

---

## alarms

**Why:** Fires exactly when a focus or break session ends, schedules micro-reminder intervals (eye/water/stretch), and provides a fallback badge update interval.

**Data:** No personal data in alarms — only internal timer names and timestamps.

---

## notifications

**Why:** Optional browser notifications when a focus session ends or a micro-reminder fires (if user chooses notification layout instead of toast).

**Data:** Generic wellness messages only. No user content from web pages.

---

## windows

**Why:** Opens the break triptych overlay, compact reminder toast, and missed-break recovery prompt in appropriately sized windows (full, half-panel, or popup).

**Data:** Extension pages only (`break.html`, `toast.html`, `recovery.html`). Does not read or modify web page content.

---

## offscreen

**Why:** Keeps the toolbar icon badge countdown accurate (updates every second) while the popup is closed and the Pomodoro timer runs in the background.

**Data:** Reads timer end time from local storage only. No network access.

---

## Host permissions

**None declared.** Calmodoro does not inject scripts into websites or access browsing history.

---

## Remote code

**None.** The extension does not load or execute remote JavaScript. DM Sans font is loaded from Google Fonts for UI typography only (documented in ATTRIBUTIONS.md).

---

## Data use certification (typical dashboard questions)

| Question | Answer |
|----------|--------|
| Collect personal data? | No |
| Sell data? | No |
| Use for unrelated purpose? | No |
| Encrypted in transit? | N/A (no transmission) |
| User can request deletion? | Uninstall extension or clear Chrome extension data |
