# Contributing

Thanks for considering a contribution to CleanX.

CleanX is a local-first browser extension. Contributions should preserve three product boundaries:

- Do not upload timeline content, browsing history or account lists.
- Do not call private X/Twitter APIs.
- Do not automate blocking, muting, liking, following, posting or other account actions.

## Development

```bash
npm install
npm run typecheck
npm run build
```

Load `dist/` in Chrome from `chrome://extensions` with Developer mode enabled.

## Pull Requests

Before opening a PR:

- Run `npm run typecheck`.
- Run `npm run build`.
- Keep rule changes conservative and explain expected false-positive risk.
- Avoid unrelated formatting or refactors.
- Do not commit `dist/`, `node_modules/` or generated ZIP files.

## Rule Changes

Filtering rules live in `src/detector/`.

Rules should be explainable and recoverable. If a rule may affect normal users, prefer lower scores or collapse behavior over direct hiding. Include examples of both intended matches and likely false positives in the PR description.

## Privacy Changes

Any change that touches permissions, storage, remote requests, telemetry or page data handling must update:

- `README.md`
- `docs/chrome-web-store/privacy-fields.md`
- `docs/chrome-web-store/privacy-policy.md`
