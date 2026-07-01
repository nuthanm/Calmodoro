# Privacy Policy — Calmodoro

**Last updated:** July 2026  
**Extension:** Calmodoro Chrome Extension  
**Contact:** Open an issue at the project GitHub repository

---

## Summary

Calmodoro stores timer and settings data **locally on your device** using Chrome's `storage` API. We do **not** collect, transmit, sell, or share your personal data with any server or third party.

---

## Data stored locally

| Data | Purpose | Location |
|------|---------|----------|
| Timer state (end time, mode, paused/running) | Run Pomodoro sessions | `chrome.storage.local` |
| Settings (durations, schedule, DND, layouts) | Your preferences | `chrome.storage.local` |
| Daily stats (sessions, skips, reminders) | Progress tracking | `chrome.storage.local` |

This data remains on your computer inside Chrome's extension storage. Uninstalling the extension or clearing extension data removes it.

---

## Data we do NOT collect

- Browsing history or page content
- Passwords or form data
- Location
- Name, email, or account identifiers
- Analytics or usage telemetry
- Financial information

---

## Network access

Calmodoro does **not** send timer or settings data to external servers.

The extension may load the **DM Sans** font from Google Fonts for UI display. That request is subject to [Google's privacy policy](https://policies.google.com/privacy). No other third-party network requests are made by the extension code.

---

## Permissions

Permissions are used only for extension functionality:

- **storage** — save settings and timer state locally
- **alarms** — session end and reminder timing
- **notifications** — optional break/reminder alerts
- **windows** — break and reminder overlay windows
- **offscreen** — accurate toolbar icon countdown

See [permission-justifications.md](../listing/permission-justifications.md) for details.

---

## Children's privacy

Calmodoro is not directed at children under 13 and does not knowingly collect information from children.

---

## Changes

We may update this policy when the extension changes. The "Last updated" date will be revised accordingly.

---

## Open source

Calmodoro is open source under the MIT License. You can review the source code in the GitHub repository to verify this policy.

---

## Contact

For privacy questions, open an issue in the Calmodoro GitHub repository.
