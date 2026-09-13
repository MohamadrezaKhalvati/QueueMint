# QueueMint capabilities

Current product version: v0.24.1.

This document describes what is implemented today. It intentionally separates current capability from the future roadmap.

## Jira connection

- Connects to an already authenticated Jira browser session.
- Supports selecting among matching Jira tabs.
- Uses a Jira page bridge and approved Jira REST request paths rather than storing Jira credentials in QueueMint.
- Uses optional host permissions for the Jira origin.
- Discovers projects, issue types, priorities, boards, sprints, epics, assignees, labels, components, versions, estimation fields, and supported editable fields.
- Uses Jira Data Center style `/rest/api/2` and `/rest/agile/1.0` endpoints in the current implementation.

## Capture Pro

### Screenshot capture

- Visible-area screenshot.
- Full-page screenshot assembled from safe viewport tiles.
- Full-page size safeguards to avoid excessively large canvases.
- Multiple screenshots can be retained in one evidence session.
- Evidence survives transfer into the full-screen Capture workspace.
- The active Capture session persists in extension IndexedDB and reconnects after the browser-action popup closes.
- The source browser tab remains linked to the session, including while the full-screen Capture editor is active.
- Source linkage is stored independently from evidence, so all screenshots can be deleted while keeping the Capture session ready for another shot.
- Additional screenshots from full-screen Capture temporarily activate the linked source tab, capture it, and return the user to the editor tab.
- Annotation state for the active screenshot is persisted so reopening QueueMint does not discard edits.
- The create-bug form keeps its local draft with the Capture session, including selected Jira fields and local evidence files.
- Capture can be explicitly reset from the header.
- Active evidence can be copied to the clipboard or saved as PNG.
- Retake replaces the selected screenshot. If the original source-tab id is stale, the session can reconnect when QueueMint is opened from the toolbar on the intended normal page.

### Annotation

- Crop.
- Drawing.
- Highlighting.
- Text annotation.
- Blur/redaction.
- Undo and redo.
- PNG export.

### Screen recording

- Available from full-screen Capture.
- Uses the browser's native screen/window/tab picker.
- Optional microphone audio.
- Can include audio offered by the chosen display source.
- Recording is WebM.
- Current safety limit is 60 seconds and 12 MB per recording.

### Evidence files

- Images: PNG, JPEG, WEBP.
- PDF.
- WebM recording.
- text and `.log` evidence.
- JSON evidence.
- Local picker supports up to 10 files, 12 MB each, with a 20 MB local selection budget.
- Jira uploads are performed one evidence file at a time after the issue exists.

### Page context

When available, QueueMint can include:

- URL
- page title
- hostname
- capture time
- viewport dimensions
- document dimensions
- scroll position
- device pixel ratio
- selected text
- browser user agent

### Diagnostics

QueueMint can opt-in include:

- runtime JavaScript errors observed after the collector is installed
- unhandled promise rejections observed after the collector is installed
- failed page resource loads observed after collector installation
- navigation timing
- recent browser Resource Timing entries
- response status where the browser exposes it
- recent failed network entries based on available Resource Timing data

QueueMint does not request the Chrome `debugger` permission for Capture diagnostics and does not monkey-patch/intercept the page's console methods.

## Issue creation

- Quick Issue from popup.
- Quick Issue context header reflects the selected project and selected assignee. Project changes clear project-scoped Quick Issue assignee, epic, and sprint state before loading the new context.
- Capture-to-bug flow.
- Bulk issue creation.
- Review before create.
- Project selection, including direct project switching inside Quick Issue.
- Issue Type.
- Priority.
- Board context.
- Sprint placement.
- Epic link.
- Assignee.
- Original estimate.
- Story Points when detected.
- Labels.
- Component.
- Fix Version.
- Due Date.
- additional supported field data through discovered field mappings.
- attachment upload after issue creation.

## Smart Draft and Smart Assistant

- Local rule/template-based Smart Draft remains available with no external AI service.
- Frontend/UI, regression, backend/API, performance, and auto-detect local templates.
- Local duplicate similarity against already loaded board/project issues.
- Project duplicate search before issue creation.
- Optional OpenAI-backed Smart Assistant in Quick Issue and Capture issue creation.
- AI is disabled by default and must be enabled/configured by the user.
- Per-request controls show and gate the data categories that may be sent: current draft, page context, active screenshot, diagnostics, Jira metadata, and recent issue titles.
- Structured suggestions can include Summary, Description, Steps to reproduce, Expected result, Actual result, Issue Type, Priority, Component, Labels, Epic, and Assignee.
- Semantic duplicate suggestions are available only when the user enables sending recent issue titles for that request.
- AI suggestions are previewed and require an explicit Apply action before they change the form. QueueMint never creates a Jira issue automatically from an AI response.

## Review and bulk creation

- Review issue drafts before writing them to Jira.
- Board/list/grid review layouts.
- Draft selection.
- Validation.
- Drag/drop placement where supported by the review flow.
- Batch-level defaults.
- JSON editing/import flow.
- Attachments per draft.
- Creation results with partial success handling.
- Sprint and estimate assignment after create where Jira requires separate operations.

## Workspace

- Project context switching.
- Board context switching.
- Live board issue metrics.
- Active sprint, backlog, unassigned, and unestimated counts.
- Quick actions into major QueueMint workflows.
- Current selection and recent created-batch context.

QueueMint does not intend to replace Jira's dashboard/reporting system.

## Manage Jira

- Live issue board/list view.
- Created-batch or whole-board scope.
- Scope and filters work independently.
- Search.
- My Issues toggle.
- Type, Priority, Status, Assignee, Sprint, Label, and Estimate filters.
- Saved Views scoped to project/board context.
- Hidden filtered issues are removed from active bulk selection to avoid accidental edits.
- Issue detail inspector.
- Jira user avatars.
- Comments/attachments/detail reads where Jira exposes them.
- safe clone helper.
- cross-project portable clone fields.
- native Jira move workflow launch rather than destructive emulation.

## Bulk edit

- Multi-issue selection.
- Preview before write.
- Priority.
- Assignee/unassign.
- Issue Type where supported.
- Epic link.
- Labels.
- Original estimate.
- Remaining estimate.
- Story Points.
- supported dynamic Jira fields.
- short-lived undo/history snapshots for QueueMint bulk operations.

## Saved Actions and macros

- Save commonly reused bulk-edit configurations.
- Reapply them from Workspace/Manage Jira/Command Palette flows.
- Automation rules reuse the same Saved Action system instead of maintaining a separate mutation engine.

## Automation Center

Current QueueMint automation is intentionally preview-first and macro-oriented.

- conditions for unassigned, missing estimate, backlog, Priority, Status, Issue Type, or Label.
- board/project-scoped rules.
- enable/disable.
- match review.
- action reuse through Saved Actions.
- matching issues are selected and routed through normal Bulk Edit preview before Jira mutation.
- activity entries for automation-driven bulk edits.

QueueMint does not currently run a full background Jira Automation replacement.

## Activity history

Local compact activity entries can record:

- issue creation
- partial batch creation
- move operations
- assign-to-me
- bulk edits
- automation-driven edits
- undo operations
- delete operations

This is a QueueMint workflow trace, not a replacement for Jira issue history.

## Command palette

- Ctrl+K command palette in the full app.
- navigation to QueueMint features.
- context-sensitive commands.
- open issue inspector when one issue is selected.
- Saved Action access.
- Automation access.

The planned v0.26 phase expands this into a deeper Jira command layer.

## Appearance and localization

- English.
- Persian.
- RTL support where relevant.
- light theme.
- dark theme.
- appearance controls in main workspace and full-screen Capture.

## Architecture and quality constraints

- React + TypeScript + Vite extension UI.
- Chrome Manifest V3.
- Every production TypeScript, TSX, JavaScript, MJS, and CSS file under `src`, `public`, and `scripts` is limited to 300 lines.
- `npm run build` runs the architecture guard before TypeScript/Vite.
- feature-oriented folders keep workflows separated.
- Jira transport is kept outside visual components.
- destructive or large mutations favor preview and explicit user confirmation.
