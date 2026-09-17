import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const read = (path) => readFile(new URL(path, import.meta.url), "utf8")

test("bulk edit verifies Jira editability for every selected issue before Review", async () => {
  const [editable, flow, sheet] = await Promise.all([
    read("../src/lib/jira/editable-fields.ts"),
    read("../src/features/app-orchestration/useBulkEditFlow.ts"),
    read("../src/features/jira-manager/LiveBulkEditSheet.tsx"),
  ])
  assert.match(editable, /mapWithConcurrency\(keys, 6, getIssueEditMeta\)/)
  assert.match(editable, /getBulkFieldSupport/)
  assert.match(editable, /fieldId === "timeestimate".*\["timetracking", "timeestimate"\]/s)
  assert.match(flow, /await verifyBulkEditability\(keys, patch\)/)
  assert.match(flow, /getBulkFieldSupport\(keys, fieldIds\)/)
  assert.match(sheet, /disabled=\{!timeTrackingEditable\}/)
  assert.match(sheet, /hasUnsupportedFixedChange/)
})

test("dynamic bulk metadata is intersected across the complete selection", async () => {
  const editable = await read("../src/lib/jira/editable-fields.ts")
  assert.match(editable, /intersectOperations/)
  assert.match(editable, /intersectAllowedValues/)
  assert.match(editable, /availableOn: instances\.length/)
  assert.match(editable, /representativeCount: entries\.length/)
})

test("Jira request errors are normalized into actionable messages", async () => {
  const [errors, request] = await Promise.all([
    read("../src/lib/jira/errors.ts"),
    read("../src/lib/jira/request.ts"),
  ])
  assert.match(errors, /not on the appropriate screen/)
  assert.match(errors, /Time Tracking is not available|does not allow Time Tracking/)
  assert.match(errors, /status === 429/)
  assert.match(errors, /receiving end does not exist/)
  assert.match(request, /throw jiraErrorFromResponse\(response\)/)
})

test("partial destructive operations keep failed issues selected for retry", async () => {
  const flow = await read("../src/features/app-orchestration/useBulkEditFlow.ts")
  assert.match(flow, /setLiveSelectedKeys\(new Set\(keys\.filter\(\(key\) => !deleted\.has\(key\)\)\)\)/)
})

test("worklog reads surface partial Jira failures instead of silently undercounting", async () => {
  const [worklogs, assistant] = await Promise.all([
    read("../src/lib/jira/worklogs.ts"),
    read("../src/features/worklog/useWorklogAssistant.ts"),
  ])
  assert.match(worklogs, /Promise\.allSettled/)
  assert.match(worklogs, /warnings: failures/)
  assert.match(assistant, /Some worklogs could not be read/)
  assert.match(assistant, /failed\.length\}\/\$\{entries\.length\} failed/)
})

test("browser bridge failures are normalized before Jira callers receive them", async () => {
  const request = await read("../src/lib/jira/request.ts")
  assert.match(request, /async function sendRuntimeMessage/)
  assert.match(request, /friendlyJiraMessage\(raw\)/)
  assert.match(request, /sendRuntimeMessage<JiraRequestResponse<T>>/)
})

test("popup optional Jira metadata failures are visible while usable fields remain available", async () => {
  const form = await read("../src/features/popup/use-popup-jira-form.ts")
  assert.match(form, /Promise\.allSettled/)
  assert.match(form, /toast\.warning\(t\.loadingJira/)
  assert.match(form, /loadBoardSprints/)
  assert.doesNotMatch(form, /getBoardsForProject\([^\n]+\.catch\(\(\) => \[\]/)
})

test("clone target metadata failures are surfaced and block an unsafe clone", async () => {
  const sheet = await read("../src/features/jira-manager/IssueDetailSheet.tsx")
  assert.match(sheet, /cloneProjectError/)
  assert.match(sheet, /jiraErrorMessage\(projectError/)
  assert.match(sheet, /Boolean\(cloneProjectError\)/)
})

test("bulk placement stays usable when optional edit metadata is unavailable", async () => {
  const sheet = await read("../src/features/jira-manager/LiveBulkEditSheet.tsx")
  assert.match(sheet, /const hasFieldChange =/)
  assert.match(sheet, /metadataBlocksCurrentChange = hasFieldChange/)
  assert.doesNotMatch(sheet, /\|\| dynamicLoading \|\| Boolean\(dynamicError\) \|\| preparing/)
})

test("critical Jira mutation and metadata surfaces do not silently swallow failures", async () => {
  const paths = [
    "../src/features/app-orchestration/useBulkEditFlow.ts",
    "../src/lib/jira/bulk-actions.ts",
    "../src/lib/jira/worklogs.ts",
    "../src/features/popup/use-popup-jira-form.ts",
    "../src/features/jira-manager/IssueDetailSheet.tsx",
  ]
  for (const path of paths) {
    const source = await read(path)
    assert.doesNotMatch(source, /\.catch\(\(\) =>/i, `${path} should surface or explicitly handle failures`)
  }
})
