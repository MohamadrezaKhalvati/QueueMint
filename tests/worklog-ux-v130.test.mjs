import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const read = (path) => readFile(new URL(path, import.meta.url), "utf8")

test("estimate-only stays synchronized when the selected issue set changes", async () => {
  const [assistant, screen] = await Promise.all([
    read("../src/features/worklog/useWorklogAssistant.ts"),
    read("../src/features/worklog/WorklogScreen.tsx"),
  ])
  assert.match(assistant, /selectedKeySignature = Array\.from\(options\.selectedKeys\)\.sort\(\)\.join\("\|"\)/)
  assert.match(assistant, /selectedEstimateSignature/)
  assert.match(assistant, /options\.strategy !== "estimate-only"/)
  assert.match(assistant, /setDraft\(buildEstimateOnlyWorklogDraft\(selectedIssues\)\)/)
  assert.match(assistant, /options\.strategy, selectedKeySignature, selectedEstimateSignature/)
  assert.match(screen, /strategy === "estimate-only"/)
})

test("changing the worklog date preserves the current issue selection and draft", async () => {
  const screen = await read("../src/features/worklog/WorklogScreen.tsx")
  assert.match(screen, /function changeDate\(next: Date\) \{ setDate\(next\) \}/)
  assert.doesNotMatch(screen, /function changeDate[\s\S]{0,180}onSelectedKeysChange\(new Set\(\)\)/)
  assert.match(screen, /onDateChange=\{changeDate\}/)
})

test("narrow worklog containers replace the overlapping sidebar with an accessible draft sheet", async () => {
  const [screen, css] = await Promise.all([
    read("../src/features/worklog/WorklogScreen.tsx"),
    read("../src/styles/app-10-customization.css"),
  ])
  assert.match(screen, /qm-worklog-compact-draft-trigger/)
  assert.match(screen, /qm-worklog-draft-sheet/)
  assert.match(css, /@container qm-worklog \(max-width: 1520px\)/)
  assert.match(css, /@media \(max-width: 1580px\)/)
  assert.match(css, /\.qm-worklog-draft-column \{ display: none; \}/)
})

test("worklog board drag and drop is connected to Jira status transitions", async () => {
  const [board, shell, operations] = await Promise.all([
    read("../src/features/worklog/WorklogIssueBoard.tsx"),
    read("../src/features/app-orchestration/AppMainShell.tsx"),
    read("../src/features/app-orchestration/useLiveBoardOperations.ts"),
  ])
  assert.match(board, /draggable=/)
  assert.match(board, /onDrop=/)
  assert.match(shell, /onMoveIssueStatus=\{a\.live\.transitionLiveIssue\}/)
  assert.match(operations, /transitionIssueToBoardColumn/)
})
