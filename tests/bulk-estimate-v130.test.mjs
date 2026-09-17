import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const read = (path) => readFile(new URL(path, import.meta.url), "utf8")

test("bulk edit routes original and remaining estimates through verified time tracking updates", async () => {
  const [bulk, estimation] = await Promise.all([
    read("../src/lib/jira/bulk-actions.ts"),
    read("../src/lib/jira/estimation.ts"),
  ])
  assert.match(bulk, /applyTimeTrackingEstimates/)
  assert.doesNotMatch(bulk, /fields\.timetracking\s*=\s*\{\s*remainingEstimate/)
  assert.match(estimation, /fields:\s*\{\s*timetracking:\s*normalized\s*\}/)
  assert.match(estimation, /update:\s*\{\s*timetracking:\s*\[\{\s*edit:\s*normalized\s*\}\]/)
  assert.match(estimation, /verifySavedEstimate/)
  assert.match(estimation, /timeestimate/)
  assert.match(estimation, /remainingEstimateSeconds/)
})

test("bulk edit reports verified per-issue estimate failures instead of silent success", async () => {
  const flow = await read("../src/features/app-orchestration/useBulkEditFlow.ts")
  assert.match(flow, /const failedFields = fieldResults\.filter\(\(item\) => !item\.ok\)/)
  assert.match(flow, /summarizeBatchFailures\(fieldResults, preview\.keys\.length/)
  assert.match(flow, /toast\.warning\(t\.updatePartial, \{ description: failureDetail \|\| undefined \}\)/)
})
