# QueueMint architecture rules

## File size rule

Production code is split by responsibility instead of growing monolithic files.

- Every production `.ts`, `.tsx`, `.js`, `.mjs`, and `.css` file under `src`, `public`, and `scripts` must stay at or below 300 lines.
- There are no legacy exceptions and no line-limit baseline.
- A change that pushes any production file over 300 lines must be split before it can build.
- Prefer extraction by responsibility, not artificial line wrapping.

Run the guard with:

```bash
npm run check:architecture
```

The production build runs this guard before TypeScript and Vite.

## Feature layout

Prefer feature folders for workflows with multiple UI and state pieces:

```text
src/features/<feature>/
  screen.tsx
  components/
  hooks/
  types.ts
  copy.ts
```

Shared primitives stay under `src/components/ui`. Jira transport and browser-extension transport stay outside page components.

## Component rules

- A screen coordinates feature components. It should not contain all field rendering and transport logic inline.
- Hooks own stateful workflow logic.
- Pure formatting and conversion logic lives in small utility modules.
- Repeated UI must become a reusable component before the third copy appears.
- UI components receive explicit data and callbacks instead of importing workflow state.
- Network calls do not belong in deeply nested visual components.
- `App.tsx` is composition and orchestration only. Feature rendering belongs in feature modules.

## Current architecture

The staged refactor is complete from a file-size perspective. `App.tsx`, popup workflows, Review, Manage Jira, Capture, Workspace, Automation, connection flows, and Jira transport are all split into focused modules below the 300-line limit.

Future feature work must preserve these boundaries and the strict 300-line guard.

## Capture Pro boundary

Capture Pro keeps browser evidence behavior under `src/features/capture-pro` and popup orchestration under `src/features/popup`.

- `diagnostics.ts` owns page diagnostics injection/collection and text formatting.
- `CaptureEvidenceStrip.tsx` owns multi-screenshot evidence navigation.
- `CaptureRecorder.tsx` owns user-driven screen/media recording.
- `use-popup-capture.ts` coordinates screenshot evidence state, source-tab targeting, full-screen transfer/reconnect, clipboard copy, diagnostics refresh, and Capture-session recovery.
- `capture-draft.ts` persists the active Capture session in extension IndexedDB and stores only the active-session pointer in `chrome.storage.local`.
- `use-popup-jira-form.ts` owns Jira issue form state, Capture-form draft restore, and post-create evidence upload.
- `file-upload.ts` owns local File-to-Jira attachment conversion.

Long-lived media recording belongs in the full-screen Capture tab rather than depending on the browser-action popup lifetime. The full-screen tab must keep the original source tab id and never treat its own `popup.html` tab as the screenshot target.

## Smart Assistant boundary

Smart Assistant keeps AI transport out of issue-creation transport. `src/lib/smart-assistant.ts` builds the external request and parses structured suggestions, while `src/features/intelligence/useSmartAssistant.ts` coordinates feature state and optional duplicate-candidate retrieval. Visual controls live under `src/features/intelligence`. Applying a suggestion only updates the existing form state; Jira creation continues through the existing Quick Issue or Capture create path.

Do not move AI calls into Jira services or let an AI response call Jira mutation functions directly.
