# GitHub Pages — Calmodoro landing site

Public site for the extension: features, screenshots, install, privacy, and terms.

## One-time setup

1. Push this repo to `https://github.com/nuthanm/Calmodoro`
2. Open **Settings → Pages**
3. **Source:** Deploy from branch `main`
4. **Folder:** `/docs`
5. Save — site live at `https://nuthanm.github.io/Calmodoro/`

## URLs

| Page | URL |
|------|-----|
| Homepage | `https://nuthanm.github.io/Calmodoro/` |
| Privacy policy | `https://nuthanm.github.io/Calmodoro/privacy.html` |
| Terms of use | `https://nuthanm.github.io/Calmodoro/terms.html` |
| GitHub | `https://github.com/nuthanm/Calmodoro` |
| Support | `https://github.com/nuthanm/Calmodoro/issues` |

## Chrome Web Store

After publishing, set the store URL in `docs/config.js`:

```js
CHROME_WEB_STORE_URL: 'https://chromewebstore.google.com/detail/calmodoro/YOUR_EXTENSION_ID',
```

Optional — add live ratings when available:

```js
STORE_RATING: { score: 4.8, count: 127 }
```

## Files

| File | Purpose |
|------|---------|
| `index.html` | Landing page — hero, features, screenshots, reviews placeholder, install |
| `privacy.html` | Privacy policy (Chrome Web Store requirement) |
| `terms.html` | Terms of use |
| `site.css` | Shared styles (matches extension `design-tokens.css`) |
| `config.js` | Chrome Web Store URL, version, ratings config |
| `assets/` | Extension icon and store screenshots |

Markdown sources: `ChromeWebStore/privacy/privacy-policy.md` in repo root.
