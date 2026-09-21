import {
  AlignLeft,
  CircleDot,
  Flag,
  Layers3,
  Link2,
  ListChecks,
  SquareKanban,
  UserRound,
  UserRoundX,
} from "lucide-react"

import { JiraIssueTypeVisual } from "@/components/jira-issue-type-visual"
import { PriorityVisual } from "@/components/priority"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/capture-select"
import { RichTextEditor } from "@/components/rich-text-editor"
import type { JiraBoard, JiraEpic, JiraMetadata, JiraProject, JiraSprint, JiraUser } from "@/types"
import type { PopupCopy } from "./popup-copy"
import { PopupFieldSection, PopupFieldShell } from "./PopupFieldShell"
import { PopupJiraAvatar } from "./popup-shared"

export type PopupIssueMainFieldsProps = {
  t: PopupCopy
  metadata: JiraMetadata
  projectInfo: JiraProject | null
  projectKey: string
  boards: JiraBoard[]
  boardId: number | null
  sprints: JiraSprint[]
  sprintId: number | null
  issueType: string
  assignees: JiraUser[]
  assignee: string
  priority: string
  epics: JiraEpic[]
  epic: string
  description: string
  moreFields: boolean
  onProject: (value: string) => void
  onBoard: (value: string) => void
  onSprint: (value: number | null) => void
  onIssueType: (value: string) => void
  onAssignee: (value: string) => void
  onPriority: (value: string) => void
  onEpic: (value: string) => void
  onDescription: (value: string) => void
  onMoreFields: () => void
}

function userIdentity(user: JiraUser) { return user.name ?? user.key ?? user.displayName ?? "" }

export function PopupIssueMainFields(props: PopupIssueMainFieldsProps) {
  const { t, metadata, projectInfo, projectKey, boards, boardId, sprints, sprintId, issueType, assignees, assignee, priority, epics, epic, description, moreFields } = props
  const issueTypes = projectInfo?.issueTypes ?? []
  const selectedType = issueTypes.find((type) => type.name === issueType)
  const selectedAssignee = assignees.find((user) => userIdentity(user) === assignee)
  const selectedAssigneeLabel = selectedAssignee?.displayName ?? assignee
  const isEpic = issueType.toLowerCase() === "epic"

  return <>
    <PopupFieldSection icon={Layers3} title={t.contextFields} className="qm-section-three-up">
      <PopupFieldShell icon={Layers3} label={t.project} tone="context">
        <Select value={projectKey} onValueChange={props.onProject}>
          <SelectTrigger><SelectValue placeholder={t.project} /></SelectTrigger>
          <SelectContent>{metadata.projects.map((project) => <SelectItem key={project.key} value={project.key}>{project.key} - {project.name}</SelectItem>)}</SelectContent>
        </Select>
      </PopupFieldShell>
      <PopupFieldShell icon={SquareKanban} label={t.board} tone="context">
        <Select value={boardId ? String(boardId) : "__none"} onValueChange={props.onBoard}>
          <SelectTrigger><SelectValue placeholder={t.board} /></SelectTrigger>
          <SelectContent><SelectItem value="__none">{t.noBoard}</SelectItem>{boards.map((board) => <SelectItem key={board.id} value={String(board.id)}>{board.name}</SelectItem>)}</SelectContent>
        </Select>
      </PopupFieldShell>
      <PopupFieldShell icon={CircleDot} label={`${t.sprint} / ${t.backlog}`} hint={boardId && !sprints.length ? t.noSprint : undefined} tone="context" className="qm-field-span-2 qm-field-third">
        <Select value={sprintId ? String(sprintId) : "__backlog"} onValueChange={(value) => props.onSprint(value === "__backlog" ? null : Number(value))} disabled={!boardId || isEpic}>
          <SelectTrigger><SelectValue placeholder={t.sprint} /></SelectTrigger>
          <SelectContent><SelectItem value="__backlog">{t.backlog}</SelectItem>{sprints.map((sprint) => <SelectItem key={sprint.id} value={String(sprint.id)}>{sprint.name} · {sprint.state}</SelectItem>)}</SelectContent>
        </Select>
      </PopupFieldShell>
    </PopupFieldSection>

    <PopupFieldSection icon={ListChecks} title={t.planningFields} className="qm-section-four-up">
      <PopupFieldShell icon={ListChecks} label={t.issueType} tone="planning">
        <Select value={issueType} onValueChange={props.onIssueType} disabled={!issueTypes.length}>
          <SelectTrigger>
            <JiraIssueTypeVisual name={selectedType?.name ?? issueType} iconUrl={selectedType?.iconUrl} compact />
          </SelectTrigger>
          <SelectContent>{issueTypes.map((type) => <SelectItem key={type.id} value={type.name}><JiraIssueTypeVisual name={type.name} iconUrl={type.iconUrl} compact /></SelectItem>)}</SelectContent>
        </Select>
      </PopupFieldShell>
      <PopupFieldShell icon={Flag} label={t.priority} tone="planning">
        <Select value={priority || "__none"} onValueChange={(value) => props.onPriority(value === "__none" ? "" : value)}>
          <SelectTrigger>{priority ? <PriorityVisual name={priority} compact /> : <span className="text-muted-foreground">{t.jiraDefault}</span>}</SelectTrigger>
          <SelectContent><SelectItem value="__none"><span className="text-muted-foreground">{t.jiraDefault}</span></SelectItem>{metadata.priorities.map((item) => <SelectItem key={item.id} value={item.name}><PriorityVisual name={item.name} compact /></SelectItem>)}</SelectContent>
        </Select>
      </PopupFieldShell>
      {!isEpic ? <PopupFieldShell icon={Link2} label={t.epic} tone="planning">
        <Select value={epic || "__none"} onValueChange={(value) => props.onEpic(value === "__none" ? "" : value)}>
          <SelectTrigger><SelectValue placeholder={t.epic} /></SelectTrigger>
          <SelectContent><SelectItem value="__none">{t.none}</SelectItem>{epics.map((item) => <SelectItem key={item.key} value={item.key}>{item.key} - {item.summary ?? item.name ?? item.key}</SelectItem>)}</SelectContent>
        </Select>
      </PopupFieldShell> : null}
      <PopupFieldShell icon={UserRound} label={t.assignee} tone="people">
        <Select value={assignee || "__default"} onValueChange={(value) => props.onAssignee(value === "__default" ? "" : value)}>
          <SelectTrigger>
            {selectedAssignee ? <span className="flex min-w-0 items-center gap-2"><PopupJiraAvatar user={selectedAssignee} className="size-6" /><span className="truncate font-medium">{selectedAssigneeLabel}</span></span>
              : assignee === "__unassigned" ? <span className="flex items-center gap-2 text-muted-foreground"><UserRoundX className="size-4" />{t.unassigned}</span>
                : <span className="flex items-center gap-2 text-muted-foreground"><UserRound className="size-4" />{t.jiraDefault}</span>}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__default"><span className="flex items-center gap-2 text-muted-foreground"><UserRound className="size-4" />{t.jiraDefault}</span></SelectItem>
            <SelectItem value="__unassigned"><span className="flex items-center gap-2 text-muted-foreground"><UserRoundX className="size-4" />{t.unassigned}</span></SelectItem>
            {assignees.map((user, index) => { const value = userIdentity(user); return value ? <SelectItem key={`${value}-${index}`} value={value}><span className="flex min-w-0 items-center gap-2"><PopupJiraAvatar user={user} /><span className="truncate">{user.displayName ?? value}</span></span></SelectItem> : null })}
          </SelectContent>
        </Select>
      </PopupFieldShell>
    </PopupFieldSection>

    <PopupFieldSection icon={AlignLeft} title={t.detailsFields}>
      <PopupFieldShell icon={AlignLeft} label={t.description} tone="details" className="qm-field-span-2">
        <RichTextEditor value={description} onChange={props.onDescription} minHeight={96} />
      </PopupFieldShell>
    </PopupFieldSection>

    <div className="qm-field-span-2">
      <Button type="button" variant="outline" size="sm" className="qm-popup-more-fields w-full justify-between" onClick={props.onMoreFields}>
        <span>{t.moreFields}</span><span aria-hidden="true">{moreFields ? "−" : "+"}</span>
      </Button>
    </div>
  </>
}
