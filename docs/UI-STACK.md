# QueueMint UI stack and interaction rules

QueueMint uses React + TypeScript + Tailwind CSS 4 with source-owned shadcn/PersianLabs-style primitives.

## Primitive rules

- Reuse Button, Select, Combobox, Sheet, Dialog, Badge, Field, Input, Progress and Sonner primitives before creating equivalents.
- Select/Combobox popups remain portal-based and preserve focus/keyboard behavior.
- Use Lucide SVG icons for structural UI icons.
- Keep visible keyboard focus.
- Important state is never expressed by color alone.

## Selection controls

- The visible checkbox is intentionally compact so cards stay calm and scannable.
- The clickable/focusable control remains larger than the visual mark, and grows further for coarse pointers.
- Selected cards also use border/ring/background state; the checkbox is not the only selection signal.

## Review context and actions

- Workspace context uses compact visual tiles for Project, Board, Placement, Priority, and Estimate.
- Issue and selected counts are grouped as metrics rather than loose text.
- The bulk-action dock is sticky under the app header and keeps buttons/selects aligned to one control height.
- Create/Validate remains a separate fixed bottom action bar.

## Sheets / sidebars

- Sheets use a fixed header, independently scrollable body, and fixed footer action region.
- Footer buttons align to the action edge on desktop and remain usable on narrow widths.
- Do not stack multiple modal sheets.

## Manage Jira large-board UX

- Large result sets default to List view.
- List view uses 25/50/100-row pagination rather than rendering hundreds of cards at once.
- Board view is retained for direct Sprint/Backlog drag/drop.
- Bulk actions are sticky to the viewport when selection exists.
- Selection can span pages and the complete filtered result set.

## Responsive behavior

- Desktop: dense list/table metadata columns plus sticky bulk toolbar.
- Tablet: compact rows with wrapped metadata; filters collapse into a stacked panel.
- Mobile: key/title/meta card-row composition; no page-level horizontal scrolling; bulk actions remain reachable at the viewport bottom.

## Motion

Routine actions use subtle 100–220ms state transitions. `prefers-reduced-motion` disables non-essential animation.

## Capture Pro UX

- Screenshot evidence is presented as a horizontal evidence strip rather than hiding multiple captures behind a counter.
- The active evidence item has both border/ring state and thumbnail position, so selection is not color-only.
- Screen recording is offered from Capture but long recording runs in the full-screen Capture workspace.
- Diagnostics are opt-in in the issue form and explain what they contain.
- Evidence files use the shared AttachmentPicker rather than a Capture-only file input.
- Capture form field groups remain visually differentiated with icons and consistent field-card dimensions.
