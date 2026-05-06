# X 清净助手 / CleanX

Chrome Extension Manifest V3 MVP for locally hiding low-quality accounts and spam-like content on X/Twitter.

## MVP Scope

- Supports `https://x.com/*` and `https://twitter.com/*`.
- Injects a content script that scans `article` nodes with `MutationObserver`.
- Extracts account handle, display name and content text from the page DOM.
- Scores content with local rules only.
- Hides high-risk content with a placeholder that supports restore, whitelist and details.
- Supports local blacklist and whitelist through `chrome.storage.local`.
- Provides popup controls for enable/disable, 30-minute pause, filter strength and daily stats.
- Provides an options page for settings, list management and JSON import/export.
- Shows the latest locally detected accounts with source, action, score and rule reasons.
- Does not call X APIs, automate blocking, or upload browsing data.

## Development

```bash
npm install
npm run build
```

Load the generated `dist/` directory in Chrome:

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click "Load unpacked".
4. Select this repository's `dist/` directory.

## Scripts

- `npm run dev`: run Vite for popup/options development.
- `npm run typecheck`: run TypeScript checks.
- `npm run build`: build popup/options with Vite and bundle content/background scripts for MV3.
- `npm run package`: build and create a Chrome Web Store upload ZIP.

## Publishing

Chrome Web Store submission copy, privacy answers, review test instructions and the release checklist are in `docs/chrome-web-store/`.

```bash
npm run package
```

Upload the generated `cleanx-extension-<version>.zip` file in the Chrome Developer Dashboard.

## Architecture

```text
src/
├── background/       MV3 service worker
├── content/          X page scanning, extraction and rendering
├── detector/         local rules, scoring and thresholds
├── options/          settings and list management UI
├── popup/            quick controls and daily stats
├── shared/           common types and constants
└── storage/          chrome.storage.local helpers
```

## Privacy Boundary

CleanX V0.1 keeps all matching and settings local. It does not upload timeline content, browse history, account relationships, or rule hits. Import/export only happens when the user explicitly triggers it.
