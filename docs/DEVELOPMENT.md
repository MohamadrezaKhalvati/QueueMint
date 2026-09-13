# QueueMint development guide

## Requirements

- Node.js >= 22.12
- npm
- Chrome or Edge
- a Jira site reachable from the browser

## Install and validate

```bash
npm install
npm run check:architecture
npm run typecheck
npm run build
```

`npm run build` already runs the architecture guard before TypeScript and Vite.

## Load the extension

1. Build QueueMint.
2. Open `chrome://extensions` or `edge://extensions`.
3. Enable Developer mode.
4. Select Load unpacked.
5. Choose the generated `dist/` folder.
6. Pin QueueMint if useful.
7. Open Jira in a normal browser tab and connect that tab from QueueMint.

## Main entry points

- `src/App.tsx`: full workspace composition.
- `src/Popup.tsx`: popup/Capture composition.
- `src/features/`: feature modules and workflow hooks.
- `src/lib/jira/`: Jira request and domain services.
- `src/lib/capture.ts`: browser screenshot primitives.
- `public/background.js`: extension service worker and Jira bridge routing.
- `public/jira-bridge.js`: page-side Jira request bridge.

## Capture Pro development

The popup is intentionally short-lived. Long media operations such as screen recording should run from the full-screen Capture tab. Capture state must therefore survive popup destruction and reconnect through the active Capture session stored by `src/lib/capture-draft.ts`.

When testing Capture, verify both directions: open full-screen Capture from the toolbar popup, then interact with the source page so popup state would normally disappear; reopen QueueMint and confirm the same evidence/form draft returns. In the full-screen editor, the `+` evidence action must capture the linked source tab and then return focus to the editor.

Diagnostics do not use `chrome.debugger`. Avoid adding that permission without a product/security review because it materially increases permission sensitivity.

Evidence attachment limits should be kept below the background bridge base64 safety limit. Current local picker rules are conservative and uploads are sent individually.


## Smart Assistant development

Smart Assistant is optional and disabled by default. Configure it from the full Workspace Settings panel. The API key must never be committed or placed in source files. It is stored in extension-local browser storage only.

When changing Smart Assistant, test both modes: local-only behavior with no API key, and configured AI behavior. Verify the per-request data switches before every request, confirm that screenshot/context/diagnostics are omitted when disabled, and confirm AI output only updates the form after the explicit Apply action. Jira creation must still use the normal existing create path.

For semantic duplicate testing, recent issue titles are fetched from Jira locally first and are only included in the AI request when the user enables that data category.

## Architecture guard

Every production code file in these trees is capped at 300 lines:

- `src/`
- `public/`
- `scripts/`

Covered extensions:

- `.ts`
- `.tsx`
- `.js`
- `.mjs`
- `.css`

If a file approaches the limit, extract a real responsibility before adding more behavior.

## Product guard

Do not rebuild Jira features just because they are possible to implement.

Before starting a new feature, read:

- `docs/PRODUCT.md`
- `docs/ROADMAP.md`
- `docs/SESSION-HANDOFF.md`

## Git workflow

Suggested normal flow:

```bash
git checkout -b feat/<short-name>
# work
npm run check:architecture
npm run typecheck
npm run build
git status
git diff --check
git add .
git commit -m "feat: <summary>"
git push -u origin feat/<short-name>
```

For a new repository:

```bash
git init
git add .
git commit -m "fix: persist QueueMint Capture Pro sessions"
git branch -M main
git remote add origin <YOUR_REPOSITORY_URL>
git push -u origin main
```

## Files that should stay out of Git

- `node_modules/`
- `dist/`
- local logs
- OS/editor temporary files
- secrets/tokens
- private Jira exports or customer evidence

## Versioning

When releasing, keep these versions synchronized:

- `package.json`
- `public/manifest.json`
- README current version
- changelog
- session handoff current version

See `docs/RELEASE.md`.
