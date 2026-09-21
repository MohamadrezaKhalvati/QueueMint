import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const read = (path) => readFile(new URL(path, import.meta.url), "utf8")

test("Jira create-field preflight uses Data Center REST v2 create metadata", async () => {
  const metadata = await read("../src/lib/jira/metadata.ts")
  assert.match(metadata, /\/rest\/api\/2\/issue\/createmeta/)
  assert.match(metadata, /getCreateFieldMatrix/)
  assert.match(metadata, /getCreateFieldsForIssueType/)
  assert.match(metadata, /projects\?\.find/)
  assert.doesNotMatch(metadata, /\/rest\/api\/3\//)
})

test("issue creation removes unsupported create fields and retries a rejected optional field", async () => {
  const create = await read("../src/lib/jira/create.ts")
  assert.match(create, /filterCreateFields/)
  assert.match(create, /allowedFieldsForIssueType/)
  assert.match(create, /unsupportedCreateField/)
  assert.match(create, /delete next\[fieldId\]/)
  assert.match(create, /skippedCreateFields/)
  assert.match(create, /CORE_CREATE_FIELDS/)
})

test("popup hides optional Jira fields that are unavailable for the selected issue type", async () => {
  const [form, extra, view] = await Promise.all([
    read("../src/features/popup/use-popup-jira-form.ts"),
    read("../src/features/popup/PopupIssueExtraFields.tsx"),
    read("../src/features/popup/PopupIssueView.tsx"),
  ])
  assert.match(form, /refreshCreateFields/)
  assert.match(form, /getCreateFieldsForIssueType/)
  assert.match(form, /createFieldIds/)
  assert.match(extra, /isCreateField\(storyPointsField\)/)
  assert.match(extra, /isCreateField\("duedate"\)/)
  assert.match(view, /createFieldIds=\{createFieldIds\}/)
})

test("capture issue form shows issue type, priority and assignee visuals", async () => {
  const [main, typeVisual, assigneeControls, search] = await Promise.all([
    read("../src/features/popup/PopupIssueMainFields.tsx"),
    read("../src/components/jira-issue-type-visual.tsx"),
    read("../src/features/jira-controls/LabelsAssigneeControls.tsx"),
    read("../src/features/jira-controls/SearchableSingle.tsx"),
  ])
  assert.match(main, /JiraIssueTypeVisual/)
  assert.match(main, /PriorityVisual/)
  assert.match(main, /PopupJiraAvatar/)
  assert.match(typeVisual, /getJiraAvatarDataUrl/)
  assert.match(assigneeControls, /renderValue=/)
  assert.match(search, /renderValue\?:/)
})

test("capture workspace keeps classification compact and Description full width", async () => {
  const [css, main] = await Promise.all([
    read("../src/features/popup/popup-workspace.css"),
    read("../src/features/popup/PopupIssueMainFields.tsx"),
  ])
  assert.match(css, /\.qm-section-four-up \.qm-popup-field-section-grid \{\s*grid-template-columns: repeat\(4, minmax\(0, 1fr\)\);/s)
  assert.match(css, /align-items: start/)
  assert.match(main, /className="qm-section-four-up"/)
  assert.doesNotMatch(main, /qm-section-half|qm-section-ownership|qm-section-details/)
  assert.match(main, /<PopupFieldSection icon=\{AlignLeft\} title=\{t\.detailsFields\}>/)
  assert.doesNotMatch(css, /height: calc\(100% - 34px\)/)
})
