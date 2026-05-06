# Chrome Web Store Review Test Instructions

## Test Account

No test account is required. The extension works on public X/Twitter web pages and does not require a CleanX account.

Reviewers may use their own X/Twitter account if they want to test on logged-in timelines.

## Test Steps

1. Install the extension.
2. Open `https://x.com` or `https://twitter.com`.
3. Open the extension popup and confirm CleanX is enabled.
4. Set filter strength to `标准` or `严格`.
5. Scroll the timeline, a search result page, or a tweet detail page.
6. Open the extension options page.
7. Confirm that local settings, blacklist, whitelist and recent risky account records are available.
8. Add a visible account handle to the local blacklist.
9. Refresh the X/Twitter page and confirm content from that account is hidden or replaced with a placeholder.
10. Use restore or whitelist to confirm user-controlled recovery works.

## Notes For Reviewers

- The extension does not call X/Twitter APIs.
- The extension does not automate blocking, muting, clicking, liking, posting or following.
- Detection runs locally in the browser.
- The extension only modifies page presentation for the current user.
- If no risky content is detected naturally, adding a visible account to the local blacklist is the most reliable way to verify the hide/restore behavior.
