# QueueMint v0.22.0

QueueMint is a Chrome/Edge extension for creating Jira issues quickly or in bulk, reviewing them before creation, managing Jira work afterward, and capturing bugs directly from the page you are testing.

## What is new in v0.22.0 - Orchestration Refactor, Phase 6

### App composition boundary

- Finished the large `App.tsx` decomposition by moving shell rendering, overlays, lifecycle effects, connection commands, project context, create flow, validation, Jira board operations, automation, and bulk-edit orchestration into focused modules.
- `App.tsx` is now a small composition/controller file that builds derived view data, wires feature hooks, and renders `AppView`.
- The main shell and all sheets/dialogs are rendered by dedicated `AppMainShell`, `AppOverlays`, and `AppView` components.
- Workflow state remains centralized through `useAppState`, while behavior is split across responsibility-specific hooks.

### Strict 300-line architecture completed

- `src/App.tsx` dropped from 2195 lines to 188 lines.
- The legacy architecture baseline has been deleted.
- The architecture guard no longer supports exceptions: every production TypeScript, TSX, JavaScript, MJS, and CSS file in `src`, `public`, and `scripts` must be 300 lines or fewer.
- `npm run build` still runs the architecture guard before TypeScript and Vite, so future oversized files fail immediately.

### Current orchestration modules

```text
src/features/app-orchestration/
  AppView.tsx
  AppMainShell.tsx
  AppOverlays.tsx
  useAppState.ts
  useAppLifecycle.ts
  useDraftActions.ts
  useCreateFlow.ts
  useBatchValidation.ts
  useJiraConnection.ts
  useProjectContext.ts
  useLiveBoardOperations.ts
  useBulkEditFlow.ts
  useWorkspaceAutomation.ts
```

Behavior and UI from v0.21.0 are intentionally preserved in this phase. The goal is a smaller, safer codebase before adding the next product features.

## What is new in v0.21.0 - Review and Jira Manager Refactor, Phase 5

### Review feature boundary

- Moved the full Review & Create screen out of `App.tsx` into a focused review feature.
- Split review board/card rendering, context summary, issue inspector, JSON editor, batch settings, creation footer, and result sheet into reusable modules.
- Preserved board/list/grid layouts, drag-and-drop draft placement, selection, validation, attachments, batch settings, and create/retry flows.

### Jira Manager feature boundary

- Moved Manage Jira out of `App.tsx` and split it into a screen shell, a focused state/model hook, and reusable live-issue views.
- Extracted issue details, clone/move actions, live bulk edit, dynamic Jira fields, preview, history, saved views, filters, board lanes, and pagination into dedicated modules.
- Scope and filter behavior from v0.15.1 is preserved, including removing hidden issues from the active bulk selection.

### 300-line architecture progress

- Every new and refactored production file in this phase is below 300 lines.
- `src/App.tsx` dropped from 4029 lines to 2195 lines.
- `src/App.tsx` remains the only architecture baseline exception and is now frozen at 2195 lines, so it may only shrink.
- The next phase can focus on moving the remaining orchestration state, effects, Jira commands, and dialog coordination out of `App.tsx` until the baseline can be removed completely.



## What is new in v0.20.0 - App Screen Extraction Refactor, Phase 4

### Focused application feature boundaries

- Extracted Jira onboarding and connection-tab selection from `App.tsx` into focused connection feature modules.
- Moved Jira candidate URL detection into a reusable connection utility shared by the App controller and onboarding UI.
- Extracted Workspace Dashboard into its own feature screen without changing board/project switching, statistics, saved actions, or quick actions.
- Extracted Quick Issue into a dedicated feature screen and split reusable estimate, placement, smart-assignee, duplicate-check, and Jira-avatar UI into focused components.
- Extracted Bulk Import and its JSON editor/start cards into a dedicated import feature module.

### 300-line architecture progress

- All newly extracted production files are below the 300-line limit.
- `src/App.tsx` dropped from 4720 lines to 4029 lines in this phase.
- The only remaining architecture baseline exception stayed `src/App.tsx`, with its maximum tightened to 4029 lines.

## What is new in v0.19.0 - Capture Shell UX + Architecture Refactor, Phase 3

### Capture header parity

- Full-screen Capture now exposes Theme and Language controls directly in its header instead of forcing a trip back to the workspace.
- Theme and language changes are persisted to QueueMint storage and are reused the next time either the popup or full workspace opens.
- The same reusable appearance control is shared by the main workspace header and Capture header.

### Balanced full-screen field layout

- Full-screen Create Bug now uses the same content width for Smart Draft, Summary, Jira field groups, preflight, and the final action.
- Project, Board, and Sprint become a balanced three-column row on wide screens.
- Issue Type, Priority, and Epic use the same three-column rhythm.
- Ownership and Issue Details sit side by side on wide screens and collapse cleanly on smaller widths.
- Field cards use a consistent minimum height so scanning the form no longer feels visually uneven.

### App shell refactor

- Extracted the main App header, Workspace sidebar, appearance sheet, and shared quick appearance controls from the legacy App file.
- Split full-screen Capture layout CSS into its own module instead of growing the popup stylesheet.
- App.tsx shrank again and its architecture baseline was tightened from 4901 lines to 4720 lines. It is still the only legacy exception and may only shrink.
- Every new or refactored production file remains below the 300-line limit.

### Next architecture step

- Continue decomposing App.tsx by moving connection/onboarding, quick issue, review, and Jira manager controllers into focused feature modules until the baseline reaches zero.


## What is new in v0.18.0 - Capture UX + Architecture Refactor, Phase 2

### Clearer Create Bug field hierarchy

- Reworked the Capture/Create Bug form so Jira fields no longer look like one uninterrupted wall of identical dropdowns.
- Every primary field now has a meaningful Lucide icon and a subtle field accent that works in light and dark themes.
- Related fields are grouped into four scan-friendly sections: Where it belongs, Plan and classify, Ownership, and Issue details.
- Project, Board, and Sprint share a context group; Issue Type, Priority, and Epic share a planning group; Assignee has a dedicated ownership group with avatar support; Description has a dedicated details group.
- Summary is visually promoted as the primary field, and Duplicate Check remains directly attached to the summary workflow.
- Additional Jira fields use the same reusable field shell instead of introducing a second visual language.
- Focus states now highlight the field card being edited, making keyboard and mouse scanning easier on dense forms.
- The layout collapses to one column on narrow extension surfaces and uses two columns in the full-screen editor.

### Reusable Capture field system

- Added `PopupFieldShell` and `PopupFieldSection` as reusable primitives for labels, icons, hints, controls, section headers, focus states, and responsive layout.
- Split primary and advanced Jira fields into focused components instead of keeping them inside the popup orchestration layer.
- Capture annotations are now split into an editor model, toolbar, and editor shell while preserving undo, redo, crop, drawing, highlighting, text, blur/redaction, and export behavior.

### 300-line refactor progress

- Continued the architecture cleanup started in v0.17.0.
- `jira-controls.tsx` is now a small compatibility barrel backed by focused Project/Epic, Priority/Sprint, Labels/Assignee, and searchable-control modules.
- The formerly large Jira service is now a small barrel backed by focused request, metadata, estimation, board issue, editable-field, detail, bulk-action, project-option, and create modules.
- The main stylesheet is split into ordered style modules, all below the 300-line limit.
- `background.js` and `capture-editor.tsx` are now below the limit.
- Application copy and bulk helper logic were moved out of `App.tsx`, reducing the remaining legacy App file substantially.
- The architecture guard now has only one legacy exception left: `src/App.tsx`. It is frozen and may only shrink. All new and refactored production files remain capped at 300 lines.

### Next architecture step

- The remaining work is decomposition of `App.tsx` into app shell, routing/orchestration, screen controllers, and feature hooks. No new oversized files are allowed while that migration continues.


## What is new in v0.17.0 - Architecture Refactor, Phase 1 of 2

### Automation quick start

- Automation Center no longer starts as a passive empty page when no Saved Action exists.
- A three-step quick-start flow explains Action -> Rule -> Review matches directly in the screen.
- Quick Add can create a safe Saved Action for priority, assign-to-me, unassign, or move-to-backlog without leaving Automation Center.
- Build advanced action opens Manage Jira so a richer bulk-edit setup can be saved and reused as a rule action.
- Rules still never write to Jira silently. They keep the existing review and bulk-preview safety path.

### Popup decomposition

- Rebuilt the former monolithic Popup into feature hooks and small reusable views under `src/features/popup`.
- `src/Popup.tsx` is now an orchestration shell instead of owning capture, Jira form state, Smart Draft, duplicate checks, preflight, and every field inline.
- Popup appearance, capture state, Jira form state, Smart Draft state, issue fields, and status/success views now have separate responsibilities.

### Automation decomposition

- Split Automation Center into overview, quick-start, rule builder, rule list, activity, copy, and type modules under `src/features/automation`.
- `src/components/automation-screen.tsx` now coordinates these pieces rather than rendering the full feature inline.

### 300-line architecture guard

- Added `npm run check:architecture`.
- New production code files are capped at 300 lines and the guard runs before `npm run build`.
- Existing oversized legacy files are temporarily frozen in `docs/architecture/line-limit-baseline.json`: they may not grow during the transition.
- Phase 2 will split the remaining large App, Jira transport, Jira controls, capture editor, background worker, and main stylesheet until the baseline is empty.
- Shared Jira/application types were also split into focused files while keeping the existing `@/types` barrel import compatible.


## What is new in v0.16.0 - Automation & Intelligence, Phase 6

### Safe automation rules

- Added a dedicated Automation center to the full QueueMint workspace and Ctrl+K.
- Build board-scoped rules for unassigned issues, missing estimates, backlog issues, priority, status, issue type, or labels.
- Rules reuse existing Saved Actions instead of inventing a second edit system.
- Review matches selects the matching Jira issues, prefills the saved action, and opens the existing Bulk Edit + Preview flow. Rules never write to Jira silently.
- Rules can be enabled, disabled, reviewed, and deleted, and keep their last checked time and match count.

### Persistent activity history

- Added a lightweight activity timeline stored in QueueMint local extension storage.
- Records successful and partial batch creates, quick creates, moves, assign-to-me operations, bulk edits, automation-driven edits, undo operations, and deletions.
- Activity entries keep only compact audit context such as timestamp, operation, affected issue keys, project, board, and outcome. Undo snapshots remain in the existing short-lived bulk history instead of bloating persistent storage.

### Smart assignee suggestions

- Quick Issue and Manage Jira Bulk Edit now show local assignee recommendations when the current board has enough data.
- Suggestions balance current open workload with lightweight expertise signals from matching issue types and labels already assigned on the board.
- Recommendations remain optional. Clicking a suggestion only fills the assignee field and does not bypass the normal create or bulk-preview flow.

### Duplicate detection

- Quick Issue continuously compares the draft summary with issues already loaded from the current board.
- A Search project action checks recent Jira project issues for additional likely duplicates before creation.
- QueueMint Capture now exposes the same project duplicate check in its Create Issue flow.
- Similarity is calculated locally from normalized words and phrase overlap. Potential duplicates are warnings only and can be opened for inspection before continuing.

### Previous behavior retained

- v0.15.1 scope/filter behavior, Saved Views, Issue Detail, Clone/Move, Workspace context switching, Capture, Smart Draft, Dynamic Fields, Bulk Preview, Undo, and popup-safe dropdowns remain included.


## What is new in v0.15.1 - Manage Jira scope and filter UX fix

- Reworked the Created batch / Whole board control into an explicit segmented scope selector with a strong active state and result counts.
- Filters now remain intentionally active when switching between Created batch and Whole board, so scope and filtering can be combined instead of disabling one another.
- Filter option lists are derived from the whole current board so valid filters do not disappear when the scope changes.
- Selected issues that become hidden by a scope or filter change are removed from the active selection, preventing bulk actions from silently affecting hidden issues.
- If the current filters return no issues, Manage Jira now explains that the scope and filters are both active and offers a direct Clear filters action.
- Created batch is disabled only when there is no current created batch to show.


## What is new in v0.15.0 - Issue Focus & Saved Views, Phase 5

### Saved views

- Save the current Manage Jira search, scope, board/list layout, My Issues toggle, and active Type, Priority, Status, Assignee, Sprint, Label, and Estimate filters as a named view.
- Saved views are scoped to the current Jira project/board, persist in QueueMint local extension storage, and can be reapplied or deleted from Manage Jira.
- Applying a saved view restores the exact filter state without changing Jira data.

### Issue detail inspector

- Click an issue card or list row to open a dedicated QueueMint issue detail sheet.
- The inspector reads live Jira data for status, type, priority, assignee, reporter, description, estimates, Story Points, due date, labels, components, fix versions, created/updated times, recent comments, and attachments.
- Jira user avatars are resolved through the existing authenticated avatar bridge.
- Ctrl+K can open the inspector when exactly one Jira issue is selected.

### Safe cloning and project moves

- Clone an issue from the detail sheet into the current or another Jira project.
- QueueMint lets you choose the target project, target issue type, and clone summary.
- Cross-project clones deliberately copy only portable fields: summary, description, priority, and labels. Project-specific custom fields, attachments, and comments are not silently duplicated.
- For a true Jira issue move, QueueMint opens Jira Data Center's native Move Issue workflow instead of emulating a destructive move through copy/delete behavior.

### Previous phases retained

Workspace project/board switching, Saved Actions, Command Palette, Dynamic Jira Fields, Bulk Preview, Undo, Capture, annotation, Smart Draft, assignee avatars, and popup-safe dropdowns remain included.


## What is new in v0.14.1 - Workspace context and layout fix

- Fixed the Workspace Quick actions panel overflowing its card on wide and intermediate desktop widths.
- Quick-action buttons now respect their grid column, wrap supporting copy safely, and keep icons/text inside the panel.
- Added Project switching directly to the Workspace board overview.
- Added Board switching directly to the Workspace board overview.
- Changing Project reloads that project's boards, users, labels, sprint context, and live Jira metrics through the existing Jira connection.
- Changing Board reloads sprints, epics, and Workspace live issue metrics without requiring a trip to Manage Jira.
- Existing Manage Jira board selection, Saved Actions, Command Palette, Capture, Smart Draft, and popup-safe dropdown behavior remain intact.

## What is new in v0.14.0 - Workspace, Phase 4

### Workspace dashboard

- Added a dedicated Workspace home screen to the full QueueMint app.
- Shows active-sprint, backlog, unassigned, and unestimated issue counts from the currently selected Jira board.
- Shows current project/board context, current selection size, and last-created issue count.
- Provides quick entry points to Quick Issue, Bulk Import, Review, and Manage Jira.
- The dashboard refreshes from the existing authenticated Jira connection and does not add a second Jira auth path.

### Command palette

- Added a global Ctrl+K command palette.
- Navigate to Workspace, Quick Issue, Bulk Import, Review, or Manage Jira without using the sidebar.
- Open Settings, Batch Settings, Bulk History, refresh the current board, or open Bulk Edit for the current selection.
- Saved actions are automatically indexed as commands.
- Keyboard navigation supports search, Up/Down, Enter, and Escape.

### Reusable saved actions

- Bulk Edit setups can now be saved locally as named actions before applying them.
- Saved actions preserve supported core changes such as Issue Type, Priority, Assignee, Epic Link, Sprint/Backlog placement, estimates, Story Points, and currently configured dynamic Jira fields.
- Reuse actions from the Workspace dashboard, Manage Jira, or the command palette.
- Saved actions only prefill the safe Bulk Edit flow. QueueMint still shows the existing change preview before Jira is modified.
- Sprint placement is not blindly reused across a different board; QueueMint falls back to keeping placement when the saved board no longer matches.
- Saved actions can be deleted and are persisted through QueueMint local extension storage.

### Phase 3 retained

Smart Draft, Smart Templates, Capture, assignee avatars, popup-safe dropdowns, full-screen capture, dynamic Jira fields, preview, undo, and board management remain included.


## v0.13.1 popup dropdown reliability fix

- Capture and Quick Issue dropdowns now use a popup-safe floating select layer instead of relying on Radix popper positioning inside the constrained Chrome extension popup.
- Dropdowns remain inside the 420 x 600 browser-action viewport, automatically open upward when there is not enough space below, and keep keyboard navigation and outside-click dismissal.
- Assignee avatar rows are preserved.
- Full-screen Capture continues to use the same field model and behavior.

## What is new in v0.13.0 - Smart Jira, Phase 3

### Assignee avatars in Capture

- Capture and full-screen Create Issue now render Jira assignee profile photos in the assignee picker.
- Avatar bytes are fetched through the existing authenticated Jira bridge instead of relying on direct cross-origin image loading.
- If Jira has no avatar, QueueMint shows a deterministic initials fallback.

### Privacy-first Smart Draft

- Added a local Smart Draft assistant to Capture issue creation.
- Auto-detects UI/frontend, regression, API/backend, or performance context from the current page title, URL, and selected text.
- Suggests a structured summary, reproducible description, Jira priority when a matching priority exists, labels, Bug issue type, and a matching project component when confidence is high enough.
- Smart Draft is deterministic and runs locally in the extension. This release does not send page data to an external AI service.

### Smart templates

- Added one-click templates for UI/frontend, regression, API/backend, and performance reports.
- Templates can be selected before applying suggestions, while preserving user-entered values whenever possible.
- Suggested labels are merged with existing labels instead of replacing them.

### Preflight validation

- Added an always-visible preflight card before Create Issue.
- Required fields are separated from recommendations such as screenshot evidence, description, explicit priority/assignee, page context, board, and sprint routing.
- Warnings stay advisory, while missing required Jira fields continue to block create.

### Phase 2 retained

- Popup capture, full-page capture, annotation tools, full-screen editor, project/board/sprint routing, screenshot attachments, and the topmost toast layer remain intact.

## What is new in v0.12.0 - QueueMint Capture, Phase 2

### Browser action popup

- Clicking the QueueMint extension icon now opens a compact popup instead of forcing a new full-page QueueMint tab.
- The popup exposes three focused actions: Capture & report, Quick issue, and Full workspace.
- Larger workflows still open the existing full QueueMint workspace in a normal tab.
- The popup reuses the saved QueueMint light/dark/system theme, accent color, and Persian/English direction.
- Opening the popup remembers the current browser tab as the latest candidate so first-time Jira onboarding in the full workspace still knows which Jira tab you came from.

### Screenshot capture and annotation

- Capture either the visible area or the full scrollable page of the current browser tab with Chrome's temporary `activeTab` permission.
- Full-page mode scrolls and stitches the page locally, restores the original scroll position, and suppresses fixed overlays after the first tile to reduce duplicate chrome.
- Annotate the capture before reporting with rectangle, arrow, highlighter, freehand pen, blur/redaction, crop, and text tools.
- Undo, redo, clear, retake, and save the edited capture as PNG.
- Crop and annotations are flattened into the exported attachment, so Jira receives the same image the reporter reviewed.

### Fast bug reporting from any website

- Turn an annotated capture directly into a Jira issue from the popup.
- Choose project, Issue Type, and Priority before create.
- QueueMint defaults capture reports to Bug when that issue type exists in the selected project.
- Add a normal description plus optional page context.
- Page context can include URL, page title, viewport/document dimensions, device pixel ratio, selected text, browser user-agent, and capture time.
- The final PNG is attached to the newly created Jira issue through the existing authenticated Jira browser session.
- Quick issue creation is also available without taking a screenshot.

### Toast stacking fix

- Sonner notifications now use a dedicated topmost layer above Sheets, Dialogs, Radix Select/Popover content, and overlays.
- Success, warning, and error toasts therefore stay visible even while a right-side Sheet or confirmation modal is open.

### Phase 1 retained

All v0.11.0 Bulk Management Pro capabilities remain included: dynamic Jira fields, change preview, session undo history, board switching, assignee avatars, Issue Type/Epic Link bulk editing, theme customization, and the redesigned workspace.

## Previous v0.10.0 redesign

### Full workspace redesign

The extension shell and all four primary workflows were rebuilt against the approved QueueMint reference screens:

- persistent desktop sidebar with QueueMint navigation and settings/help actions
- slim workspace header with connection state, theme/language/settings controls, and current-user shortcut
- editorial page hierarchy with large workflow titles and quieter supporting copy
- theme-aware surfaces, subtle 1px borders, accent-driven interaction states, and flatter shadcn/Radix controls
- consistent 42–44px form/action control heights and tighter alignment
- responsive behavior that recomposes the sidebar/navigation and board lanes on narrower windows
- Persian remains RTL; both Persian and English now use a clean Windows/system UI sans stack, with Samim kept only as an optional fallback


### Theme and typography correction

- dark mode rebuilt around neutral graphite surfaces instead of the previous blue-slate overrides
- custom accent color now drives active navigation, selected segmented controls, focus states, primary badges/icons, board highlights, and primary CTA buttons
- light, dark, and system modes all resolve from the same semantic design tokens
- removed light-only hard-coded surface colors from the QueueMint workspace styles
- English serif typography removed; Persian and English now share a cleaner minimal system UI font stack
- Persian large headings use RTL-specific size/line-height tuning

### Quick issue

- redesigned project/assignee context header
- compact two-column form rhythm matching the reference
- Jira-format Estimate remains available before create
- shorter rich-description editor and compact attachment control
- footer now follows the reference hierarchy: Clear form / Cancel / Create issue

### Bulk import

- four equal workflow cards for upload, sample JSON, AI prompt, and batch settings
- rebuilt JSON editor surface with synchronized line-number gutter
- cleaner valid/invalid status row and a single dominant Review issues action

### Review & create

- rebuilt project / board / placement / priority / estimate summary bar
- issue and selected counts are visually separated without the previous RTL divider problem
- filter/view toolbar and selected-action row now share one alignment system
- selected-action row stays sticky while reviewing long batches
- Sprint/Backlog lanes use the approved pale-mint/neutral board treatment
- issue cards are more compact; edit/duplicate/delete actions are contextual instead of consuming card height
- fixed create footer matches the approved Validate / Create hierarchy

### Manage Jira

- rebuilt heading, scope switcher, board context summary, search/filter toolbar, and bulk-action row
- bulk-action row remains sticky while scrolling large boards
- Sprint/Backlog lanes share the same board visual language as Review
- existing large-board list fallback, pagination, filters, multi-select, drag/drop, bulk edit, estimate editing, assignment, and safe deletion remain intact

### Existing reliability fixes retained

- verified Jira estimate writes from v0.9.2
- Jira Data Center time-tracking / board-estimation discovery
- estimate read-back verification
- idempotent Jira bridge reinjection guard
- generic Jira Data Center connection and multi-tab selection
- animated Radix/shadcn Sheets with reduced-motion support

## Existing workflows

1. **Quick issue** — create one Jira issue fast.
2. **Bulk import** — paste/upload JSON or download an AI-ready example/prompt.
3. **Review & create** — inspect, select, estimate, assign, and place issues before Jira creation.
4. **Manage Jira** — search and manage existing Jira issues in bulk.

## Connection model

### Jira Data Center / Server — current browser session

```text
Jira URL
  -> runtime site permission
  -> signed-in Jira browser tab
  -> Jira REST API through that tab session
```

No Jira password is stored by QueueMint.

### Multiple Jira tabs

Multiple tabs from the connected Jira origin are supported. QueueMint prefers the Jira tab it was opened from, then an explicitly selected tab, then another matching active tab.

### Jira Cloud

Public Jira Cloud support should use Atlassian OAuth 2.0 (3LO) with a small backend for secret/token lifecycle. This release is focused on Jira Data Center / Server browser-session usage.

## Install / replace

Extract this source over the current project, then run:

```powershell
npm install
npm run build
```

The UI no longer depends on a bundled Persian font. On Windows it prefers Segoe UI Variable / Segoe UI for a cleaner minimal look. `npm run font:install` is still available only if you intentionally want Samim as a fallback.

Then:

```text
chrome://extensions
-> QueueMint
-> Reload
```

Refresh open Jira tabs after replacing the extension build.

## UI stack

- React 19
- TypeScript 7
- Vite 8
- Tailwind CSS 4 via `@tailwindcss/vite`
- `tailwindcss-animated`
- source-owned shadcn/PersianLabs-style components
- Radix Select / Popover / Dialog / Sheet primitives
- Sonner toast feedback
- Lucide icons
- Segoe UI Variable / Segoe UI / system UI sans stack for both English and Persian, with optional Samim fallback

## Verification for this source bundle

The source bundle was checked for:

- syntax parsing of all TS/TSX source files with a TypeScript parser
- `background.js` syntax
- `jira-bridge.js` syntax
- manifest/JSON validity
- Jira estimate persistence implementation retained from v0.9.2
- source ZIP integrity

A dependency-backed `npm run build` still needs to run on a machine with npm registry access; npm dependency installation timed out in the packaging environment.

## v0.12.1 - Capture routing and full-screen editor

- Added a full-screen capture editor that opens from the popup while preserving the current annotated screenshot.
- Capture issue creation now supports Project, Board, Sprint/Backlog, Issue Type, Assignee, Priority, Epic Link, Original Estimate, Story Points, Labels, Component, Fix Version, and Due Date where Jira exposes them.
- Board selection refreshes active/future sprints and is passed to Jira estimation logic.
- Project changes refresh boards, assignable users, epics, components, versions, and issue types.
- Existing screenshot annotation, page context, screenshot attachment, theme, locale, and toast layering behavior are preserved.
