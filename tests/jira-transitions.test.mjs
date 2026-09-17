import assert from "node:assert/strict"
import test from "node:test"

import { pickJiraTransitionForBoardColumn } from "../src/lib/jira/transition-utils.ts"

test("board drag chooses a direct Jira transition by destination status id", () => {
  const transitions = [
    { id: "11", name: "Start Progress", to: { id: "3", name: "In Progress" } },
    { id: "21", name: "Resolve", to: { id: "5", name: "Done" } },
  ]
  const result = pickJiraTransitionForBoardColumn(transitions, ["5", "6"], "Done")
  assert.equal(result?.id, "21")
})

test("board drag falls back to destination status name when column status ids are unavailable", () => {
  const transitions = [{ id: "31", name: "QA", to: { name: "QA" } }]
  assert.equal(pickJiraTransitionForBoardColumn(transitions, [], "qa")?.id, "31")
  assert.equal(pickJiraTransitionForBoardColumn(transitions, [], "Done"), undefined)
})
