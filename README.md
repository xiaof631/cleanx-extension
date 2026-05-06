# X 清净助手 / CleanX

CleanX is a local-first Chrome extension for reducing low-quality account content on X/Twitter.

It scans visible X/Twitter web pages in the browser, scores content with local rules, and lets users hide, collapse, restore, blacklist or whitelist accounts without uploading timeline data.

## Status

CleanX is currently an MVP for Chrome Extension Manifest V3.

The project is open source under the MIT License. Review the code, rules and permissions before installing or publishing your own build.

## Features

- Supports `https://x.com/*` and `https://twitter.com/*`.
- Scans timeline, tweet detail pages and search results through a content script.
- Uses local rules for risk scoring.
- Supports three filter strengths: light, standard and strict.
- Supports three handling modes: placeholder hide, collapse and blur.
- Provides restore and whitelist actions for recoverability.
- Supports local blacklist and whitelist.
- Shows local daily stats and recent risky accounts.
- Supports JSON import/export for configuration.
- Stores settings and lists in `chrome.storage.local`.

## Privacy Principles

CleanX V0.1 is designed around these boundaries:

- No X/Twitter API calls.
- No private API usage.
- No remote classification service.
- No telemetry.
- No timeline upload.
- No browsing history upload.
- No cross-site tracking.
- No automated blocking, muting, liking, following or posting.

All matching runs locally in the browser. Import and export only happen when the user triggers them.

## Install From Source

```bash
npm install
npm run build
```

Load the generated `dist/` directory in Chrome:

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click "Load unpacked".
4. Select this repository's `dist/` directory.

## Development

```bash
npm install
npm run typecheck
npm run build
```

Useful scripts:

- `npm run dev`: run Vite for popup/options development.
- `npm run typecheck`: run TypeScript checks.
- `npm run build`: build popup/options and bundle MV3 scripts.
- `npm run package`: build and create a Chrome Web Store upload ZIP.

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

## Publishing

Chrome Web Store submission copy, privacy answers, review test instructions and the release checklist are in [docs/chrome-web-store](./docs/chrome-web-store/).

```bash
npm run package
```

Upload the generated `cleanx-extension-<version>.zip` file in the Chrome Developer Dashboard.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

Rule changes should be conservative and explain false-positive risk. Privacy or permission changes must update the Chrome Web Store documentation.

## Security

See [SECURITY.md](./SECURITY.md).

## License

MIT. See [LICENSE](./LICENSE).
