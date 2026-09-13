import { Boxes, CalendarDays, Clock3, Gauge, PackageCheck, Tags } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/capture-select"
import type { JiraMetadata, JiraProject } from "@/types"
import type { PopupCopy } from "./popup-copy"
import { PopupFieldSection, PopupFieldShell } from "./PopupFieldShell"

export type PopupIssueExtraFieldsProps = {
  t: PopupCopy
  metadata: JiraMetadata
  projectInfo: JiraProject | null
  issueType: string
  estimate: string
  storyPoints: string
  labels: string
  dueDate: string
  component: string
  fixVersion: string
  onEstimate: (value: string) => void
  onStoryPoints: (value: string) => void
  onLabels: (value: string) => void
  onDueDate: (value: string) => void
  onComponent: (value: string) => void
  onFixVersion: (value: string) => void
}

export function PopupIssueExtraFields(props: PopupIssueExtraFieldsProps) {
  const { t, metadata, projectInfo, issueType, estimate, storyPoints, labels, dueDate, component, fixVersion } = props
  const isEpic = issueType.toLowerCase() === "epic"
  const versions = projectInfo?.versions?.filter((item) => !item.released && !item.archived) ?? []

  return <PopupFieldSection icon={Gauge} title={t.advancedFields}>
    {metadata.estimation.timeTracking && !isEpic ? <PopupFieldShell icon={Clock3} label={t.estimate} tone="details">
      <Input value={estimate} onChange={(event) => props.onEstimate(event.target.value)} placeholder="3h, 2d, 30m" />
    </PopupFieldShell> : null}
    {metadata.estimation.storyPointsFieldId && !isEpic ? <PopupFieldShell icon={Gauge} label={t.storyPoints} tone="planning">
      <Input type="number" min="0" step="0.5" value={storyPoints} onChange={(event) => props.onStoryPoints(event.target.value)} />
    </PopupFieldShell> : null}
    <PopupFieldShell icon={Tags} label={t.labels} tone="details">
      <Input value={labels} onChange={(event) => props.onLabels(event.target.value)} placeholder="frontend, regression" />
    </PopupFieldShell>
    <PopupFieldShell icon={CalendarDays} label={t.dueDate} tone="details">
      <Input type="date" value={dueDate} onChange={(event) => props.onDueDate(event.target.value)} />
    </PopupFieldShell>
    {projectInfo?.components?.length ? <PopupFieldShell icon={Boxes} label={t.component} tone="context">
      <Select value={component || "__none"} onValueChange={(value) => props.onComponent(value === "__none" ? "" : value)}>
        <SelectTrigger><SelectValue placeholder={t.component} /></SelectTrigger>
        <SelectContent><SelectItem value="__none">{t.none}</SelectItem>{projectInfo.components.map((item) => <SelectItem key={item.id} value={item.name}>{item.name}</SelectItem>)}</SelectContent>
      </Select>
    </PopupFieldShell> : null}
    {versions.length ? <PopupFieldShell icon={PackageCheck} label={t.fixVersion} tone="planning">
      <Select value={fixVersion || "__none"} onValueChange={(value) => props.onFixVersion(value === "__none" ? "" : value)}>
        <SelectTrigger><SelectValue placeholder={t.fixVersion} /></SelectTrigger>
        <SelectContent><SelectItem value="__none">{t.none}</SelectItem>{versions.map((item) => <SelectItem key={item.id} value={item.name}>{item.name}</SelectItem>)}</SelectContent>
      </Select>
    </PopupFieldShell> : null}
  </PopupFieldSection>
}
