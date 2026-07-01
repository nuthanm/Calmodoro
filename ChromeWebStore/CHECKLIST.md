# Pre-submission checklist

Complete this list **after 3–7 days of real daily testing**, then submit to the Chrome Web Store.

## Testing (before capture)

- [ ] Focus session starts and badge counts down with popup **closed**
- [ ] Pause / resume / reset work correctly
- [ ] Break triptych opens when focus ends (DND off)
- [ ] Accept Break and Skip both work; stats update
- [ ] Micro-reminders fire during active hours (test with 1-min intervals)
- [ ] Lunch block pauses reminders
- [ ] Settings save and persist after reload
- [ ] Recovery prompt after PC sleep (optional test)
- [ ] No console errors in service worker (Inspect on `chrome://extensions`)
- [ ] Icons display correctly in toolbar and notifications

## Assets

- [ ] Replace `screenshots/*.png` with **real** 1280×800 captures from `capture/`
- [ ] Verify `icons/icon128.png` looks sharp
- [ ] Review `promotional/promo-small-440x280.png` (optional)
- [ ] Record promo video OR skip (optional)

## Listing text

- [ ] Copy `listing/short-description.txt` (≤132 chars)
- [ ] Copy `listing/detailed-description.txt`
- [ ] Copy `listing/single-purpose.txt`
- [ ] Set category from `listing/category.txt`
- [ ] Paste permission justifications when dashboard asks

## Legal & privacy

- [ ] Privacy policy URL live (host `privacy/privacy-policy.md`)
- [ ] Confirm **no copyrighted** assets in build ([ATTRIBUTIONS.md](../ATTRIBUTIONS.md))
- [ ] Data disclosure: local storage only, no analytics

## Package & upload

- [ ] Bump version in `manifest.json`
- [ ] Create ZIP **without** `ChromeWebStore/` or `prototype/`
- [ ] Upload at [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
- [ ] Pay one-time developer registration fee ($5) if first extension
- [ ] Submit for review

## Post-submit

- [ ] Save dashboard listing URL
- [ ] Respond to reviewer feedback within 7 days if rejected
- [ ] Plan update cycle for bug fixes

**Estimated review time:** 1–3 business days (varies).
