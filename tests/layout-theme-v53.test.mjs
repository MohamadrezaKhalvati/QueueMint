import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const contract = readFileSync(new URL("../src/styles/app-15-theme-contract.css", import.meta.url), "utf8")
const worklog = readFileSync(new URL("../src/features/worklog/WorklogDraftSidebar.tsx", import.meta.url), "utf8")
const dateToolbar = readFileSync(new URL("../src/features/worklog/WorklogDateToolbar.tsx", import.meta.url), "utf8")
const quickIssue = readFileSync(new URL("../src/features/quick-issue/QuickIssueScreen.tsx", import.meta.url), "utf8")
const review = readFileSync(new URL("../src/features/review/ReviewScreen.tsx", import.meta.url), "utf8")
const manage = readFileSync(new URL("../src/features/jira-manager/ManageJiraView.tsx", import.meta.url), "utf8")

test("worklog status and date controls follow radius and common toolbar sizing", () => {
  assert.match(worklog, /qm-worklog-status-badge/)
  assert.doesNotMatch(worklog, /qm-worklog-status-badge[^\n]*rounded-full/)
  assert.match(dateToolbar, /qm-date-toolbar/)
  assert.match(dateToolbar, /qm-date-picker-trigger/)
  assert.match(contract, /\.qm-worklog-status-badge[\s\S]*border-radius: var\(--qm-control-radius\) !important/)
  assert.match(contract, /\.qm-date-picker-trigger\[data-slot="button"\][\s\S]*height: var\(--qm-density-control-h\) !important/)
})

test("review, manage and backlog quick issue use the aligned V5.3 layouts", () => {
  assert.match(review, /qm-review-toolbar/)
  assert.match(review, /qm-view-toggle-group/)
  assert.match(manage, /qm-manage-toolbar/)
  assert.match(manage, /qm-manage-heading-actions/)
  assert.match(quickIssue, /placement === "backlog"[\s\S]*sm:col-span-2/)
  assert.match(contract, /\.qm-review-toolbar[\s\S]*\.qm-manage-toolbar/)
})
