# Release Checklist

## Before Upload

- [ ] Run `npm run typecheck`
- [ ] Run `npm run build`
- [ ] Load `dist/` locally in `chrome://extensions`
- [ ] Test popup open/close
- [ ] Test settings page
- [ ] Test blacklist hide behavior on X/Twitter
- [ ] Test restore from placeholder
- [ ] Test whitelist behavior
- [ ] Test export/import JSON
- [ ] Confirm extension errors page is clean
- [ ] Confirm `manifest.json` has the intended version
- [ ] Confirm icons render in `chrome://extensions`

## Package

```bash
npm run package
```

Upload the generated ZIP file from the repository root.

## Store Assets To Prepare

- [ ] 128x128 extension icon
- [ ] Store screenshots
- [ ] Support URL
- [ ] Privacy policy URL if required by the dashboard
- [ ] Publisher name
- [ ] Contact email

## Recommended Screenshots

- Popup showing enabled state and stats
- Options page showing blacklist/whitelist management
- Options page showing recent risky accounts
- X/Twitter page showing a CleanX placeholder

## After Submission

- [ ] Watch the Developer Dashboard review status
- [ ] Watch the publisher email for review messages
- [ ] If approved with deferred publishing, publish within 30 days
