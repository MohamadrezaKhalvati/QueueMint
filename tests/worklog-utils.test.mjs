import assert from "node:assert/strict"
import test from "node:test"

import { buildEstimateOnlyWorklogDraft, buildWorklogDraft, formatWorklogMinutes, normalizeWorklogDraft, parseWorklogDuration, worklogEstimateMinutes } from "../src/features/worklog/worklog-utils.ts"

test("worklog duration parser accepts hour and minute forms", () => {
  assert.equal(parseWorklogDuration("7h 30m"), 450)
  assert.equal(parseWorklogDuration("90m"), 90)
  assert.equal(parseWorklogDuration("1.5h"), 90)
  assert.equal(parseWorklogDuration(""), null)
  assert.equal(formatWorklogMinutes(450), "7h 30m")
})

test("equal draft preserves the requested total", () => {
  const issues = [
    { id: "1", key: "TEST-1", summary: "One", type: "Task", labels: [], placement: "backlog" },
    { id: "2", key: "TEST-2", summary: "Two", type: "Task", labels: [], placement: "backlog" },
    { id: "3", key: "TEST-3", summary: "Three", type: "Task", labels: [], placement: "backlog" },
  ]
  const draft = buildWorklogDraft(issues, 450, "equal")
  assert.equal(draft.reduce((sum, entry) => sum + entry.minutes, 0), 450)
})

test("estimate weighting favors larger estimates without changing total", () => {
  const issues = [
    { id: "1", key: "TEST-1", summary: "Small", type: "Task", labels: [], placement: "backlog", originalEstimateSeconds: 3600 },
    { id: "2", key: "TEST-2", summary: "Large", type: "Task", labels: [], placement: "backlog", originalEstimateSeconds: 10800 },
  ]
  const draft = buildWorklogDraft(issues, 240, "estimate")
  assert.equal(draft.reduce((sum, entry) => sum + entry.minutes, 0), 240)
  assert.ok(draft[1].minutes > draft[0].minutes)
  const normalized = normalizeWorklogDraft([{ ...draft[0], minutes: 1 }, { ...draft[1], minutes: 1 }], 90)
  assert.equal(normalized.reduce((sum, entry) => sum + entry.minutes, 0), 90)
})


test("estimate-only draft uses Jira remaining estimates without stretching to the daily target", () => {
  const issues = [
    { id: "1", key: "TEST-1", summary: "One hour left", type: "Task", labels: [], placement: "backlog", originalEstimateSeconds: 10800, remainingEstimateSeconds: 3600 },
    { id: "2", key: "TEST-2", summary: "Four hours", type: "Task", labels: [], placement: "backlog", originalEstimateSeconds: 14400 },
    { id: "3", key: "TEST-3", summary: "Already complete", type: "Task", labels: [], placement: "backlog", originalEstimateSeconds: 7200, remainingEstimateSeconds: 0 },
  ]
  const draft = buildEstimateOnlyWorklogDraft(issues)
  assert.deepEqual(draft.map((entry) => [entry.issueKey, entry.minutes]), [["TEST-1", 60], ["TEST-2", 240]])
  assert.equal(draft.reduce((sum, entry) => sum + entry.minutes, 0), 300)
  assert.equal(worklogEstimateMinutes(issues[2]), 0)
})
