import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const read = (path) => readFile(new URL(path, import.meta.url), "utf8")

test("worklog board and table chain vertical wheel scrolling back to the document", async () => {
  const css = await read("../src/styles/app-10-customization.css")
  assert.match(css, /\.qm-worklog-board-scroll[^}]*overscroll-behavior-y:\s*auto/s)
  assert.match(css, /\.qm-worklog-table-scroll[^}]*overscroll-behavior-y:\s*auto/s)
})

test("worklog draft column is the sticky desktop container", async () => {
  const [screen, css] = await Promise.all([
    read("../src/features/worklog/WorklogScreen.tsx"),
    read("../src/styles/app-09-worklog.css"),
  ])
  assert.match(screen, /qm-worklog-draft-column/)
  assert.match(css, /\.qm-worklog-draft-column\s*\{[^}]*position:\s*sticky/s)
})

test("worklog issue cards expose one selection control instead of checkbox plus add button", async () => {
  const card = await read("../src/features/worklog/WorklogIssueMiniCard.tsx")
  assert.match(card, /WorklogSelectionCheckbox/)
  assert.doesNotMatch(card, /qm-worklog-issue-add|Add to draft|Remove from draft/)
})

test("worklog offers an estimate-only mode that does not depend on the target duration", async () => {
  const [sidebar, assistant] = await Promise.all([
    read("../src/features/worklog/WorklogDraftSidebar.tsx"),
    read("../src/features/worklog/useWorklogAssistant.ts"),
  ])
  assert.match(sidebar, /estimate-only/)
  assert.match(sidebar, /Estimate only/)
  assert.match(assistant, /strategy === "estimate-only"/)
  assert.match(assistant, /buildEstimateOnlyWorklogDraft/)
})
