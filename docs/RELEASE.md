# QueueMint release checklist

## Before release

- Confirm the intended product scope in `docs/ROADMAP.md`.
- Update `package.json` version.
- Update `public/manifest.json` version.
- Update README and CHANGELOG.
- Update `docs/CAPABILITIES.md` for current behavior.
- Update `docs/SESSION-HANDOFF.md` so the next session starts with correct context.

## Validation

Run on a normal development machine:

```bash
npm install
npm run check:architecture
npm run typecheck
npm run build
git diff --check
```

Expected architecture message:

```text
Architecture line-limit check passed. Every production code file is capped at 300 lines.
```

## Manual smoke test

At minimum:

- extension loads from `dist/`
- Jira connection can be established
- popup opens
- English/Persian switch works
- light/dark switch works
- visible screenshot capture works
- full-page capture works on a normal test page
- annotation export works
- multiple evidence screenshots can be selected
- full-screen Capture preserves evidence
- adding a screenshot from full-screen Capture targets the linked source page, not the QueueMint extension tab
- closing the toolbar popup and reopening QueueMint restores the active Capture session
- annotation edits survive Capture-session recovery
- create-bug form fields survive Capture-session recovery
- Capture reset clears the active session and, from full-screen Capture, returns to the source tab when possible
- screen recording can start/stop in full-screen Capture
- optional microphone behavior is understandable
- Capture issue can be created in Jira
- evidence attachments upload
- diagnostics remain opt-in
- Quick Issue creates a Jira issue
- Manage Jira loads
- Bulk Edit preview works
- Ctrl+K opens

## Git release

After merge to main:

```bash
git checkout main
git pull --ff-only
git status
git tag -a v0.24.1 -m "QueueMint v0.24.1 Smart Assistant typecheck hotfix"
git push origin main
git push origin v0.24.1
```

Change the version/tag to the actual release.

## Public-release additional checks

Before v1.0 also require:

- browser permission audit
- privacy policy
- supported Jira version matrix
- store listing and screenshots
- automated critical-path tests
- clean fresh-profile install test
- upgrade-from-previous-version test
