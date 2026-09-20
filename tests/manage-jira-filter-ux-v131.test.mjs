import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

import { filterManageIssues } from "../src/features/jira-manager/manage-utils.ts"

const read = (path) => readFile(new URL(path, import.meta.url), "utf8")

const issues = [
  { id: "1", key: "RC-1", summary: "Alpha", type: "Task", priority: "High", status: "To Do", assignee: "Hamed", labels: ["frontend"], sprintId: 4, sprintName: "Sprint 4", placement: "sprint" },
  { id: "2", key: "RC-2", summary: "Beta", type: "Bug", priority: "Medium", status: "In Progress", assignee: "Sara", labels: ["frontend", "urgent"], sprintId: 4, sprintName: "Sprint 4", placement: "sprint" },
  { id: "3", key: "RC-3", summary: "Gamma", type: "Task", priority: "Low", status: "Done", labels: ["backend"], placement: "backlog" },
]

const baseFilters = {
  search: "",
  type: [],
  priority: [],
  status: [],
  assignee: [],
  sprint: [],
  label: [],
  estimate: "all",
  myIssuesOnly: false,
  currentUser: "Hamed",
}

test("Manage Jira multi-value filters use OR within one group and AND across groups", () => {
  const result = filterManageIssues(issues, {
    ...baseFilters,
    status: ["To Do", "In Progress"],
    assignee: ["Hamed", "Sara"],
    label: ["urgent"],
  })
  assert.deepEqual(result.map((issue) => issue.key), ["RC-2"])
})

test("Manage Jira multi-value filters support backlog and unassigned together", () => {
  const result = filterManageIssues(issues, {
    ...baseFilters,
    sprint: ["backlog", "4"],
    assignee: ["__unassigned__", "Sara"],
  })
  assert.deepEqual(result.map((issue) => issue.key), ["RC-2", "RC-3"])
})

test("nested selects, comboboxes and popovers share the active Sheet portal container", async () => {
  const [sheet, select, combobox, popover] = await Promise.all([
    read("../src/components/ui/sheet.tsx"),
    read("../src/components/ui/select.tsx"),
    read("../src/components/ui/combobox.tsx"),
    read("../src/components/ui/popover.tsx"),
  ])
  assert.match(sheet, /OverlayPortalProvider container=\{portalContainer\}/)
  assert.match(select, /SelectPrimitive\.Portal container=\{portalContainer \?\? undefined\}/)
  assert.match(combobox, /PopoverPrimitive\.Portal container=\{portalContainer \?\? undefined\}/)
  assert.match(popover, /PopoverPrimitive\.Portal container=\{portalContainer \?\? undefined\}/)
  assert.match(combobox, /overflow-y-auto overscroll-contain/)
  assert.match(select, /overflow-y-auto overscroll-contain/)
})

test("Manage Jira exposes visual active filters, avatars and confirmation for direct mutations", async () => {
  const [filters, view, confirm] = await Promise.all([
    read("../src/features/jira-manager/ManageFiltersPanel.tsx"),
    read("../src/features/jira-manager/ManageJiraView.tsx"),
    read("../src/features/jira-manager/ManageMutationConfirmDialog.tsx"),
  ])
  assert.match(filters, /Active filters/)
  assert.match(filters, /JiraUserAvatar/)
  assert.match(filters, /PriorityVisual/)
  assert.match(filters, /Values within a filter use OR; different filter groups combine with AND\./)
  assert.match(view, /requestAssignToMe/)
  assert.match(view, /requestMoveSelection/)
  assert.match(view, /ManageMutationConfirmDialog/)
  assert.match(confirm, /confirmation prevents accidental Jira mutations/)
})

test("created batch context no longer auto-selects Jira issues", async () => {
  const [createFlow, liveBoard, lifecycle] = await Promise.all([
    read("../src/features/app-orchestration/useCreateFlow.ts"),
    read("../src/features/app-orchestration/useLiveBoardOperations.ts"),
    read("../src/features/app-orchestration/useAppLifecycle.ts"),
  ])
  assert.doesNotMatch(createFlow, /setLiveSelectedKeys\(new Set\(createdKeys\)\)/)
  assert.doesNotMatch(createFlow, /setLiveSelectedKeys\(new Set\(\[key\]\)\)/)
  assert.doesNotMatch(liveBoard, /lastCreatedKeys\.filter/)
  assert.doesNotMatch(lifecycle, /setLiveSelectedKeys\(new Set\(state\.lastCreatedKeys\)\)/)
  assert.match(lifecycle, /o\.mode !== "manage" && o\.liveSelectedKeys\.size/)
})
