import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const themeContract = readFileSync(new URL("../src/styles/app-15-theme-contract.css", import.meta.url), "utf8")
const workspace = readFileSync(new URL("../src/features/workspace/WorkspaceDashboard.tsx", import.meta.url), "utf8")
const select = readFileSync(new URL("../src/components/ui/select.tsx", import.meta.url), "utf8")
const uploader = readFileSync(new URL("../src/components/attachment-picker.tsx", import.meta.url), "utf8")

test("adaptive Workspace quick actions are not forced to a density fixed height", () => {
  assert.match(workspace, /qm-quick-action/)
  assert.match(themeContract, /\.qm-quick-action\[data-slot="button"\][\s\S]*height: auto !important/)
  assert.match(themeContract, /qm-quick-action-description[\s\S]*-webkit-line-clamp: 2/)
})

test("board and review actions use the shared appearance radius and accent tokens", () => {
  assert.match(themeContract, /\.qm-board-lane/)
  assert.match(themeContract, /\.issue-card/)
  assert.match(themeContract, /border-radius: var\(--qm-panel-radius\) !important/)
  assert.match(themeContract, /\.qm-review-footer \[data-slot="button"\]\[data-variant="default"\][\s\S]*background: var\(--primary\) !important/)
  assert.match(themeContract, /border-radius: var\(--qm-control-radius\) !important/)
})

test("selects, selection boxes, uploader and clickable controls use the shared theme contract", () => {
  assert.match(select, /rounded-\[var\(--qm-control-radius\)\]/)
  assert.match(select, /rounded-\[var\(--qm-panel-radius\)\]/)
  assert.match(themeContract, /\.qm-checkbox-box, \.qm-selection-checkbox, input\[type="checkbox"\]/)
  assert.match(themeContract, /button:not\(:disabled\)/)
  assert.match(uploader, /qm-upload-control/)
  assert.match(themeContract, /\.qm-upload-control[\s\S]*background: var\(--qm-surface-subtle\) !important/)
})
