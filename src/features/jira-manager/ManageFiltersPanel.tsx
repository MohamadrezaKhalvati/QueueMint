import { useMemo, useState, type ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { CircleDotDashed, Clock3, Inbox, Layers3, Search, Shapes, SlidersHorizontal, Tag, UserRound, UserRoundX, X } from "lucide-react"

import { JiraUserAvatar } from "@/components/jira-user-avatar"
import { PriorityVisual } from "@/components/priority"
import { SimpleSelect, SprintVisual } from "@/components/jira-controls"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Combobox, ComboboxContent, ComboboxList, ComboboxOption, ComboboxSearch, ComboboxTrigger } from "@/components/ui/combobox"
import { cn } from "@/lib/utils"
import { copy } from "@/features/app-shell/app-copy"
import type { AppLocale, JiraSprint, JiraUser } from "@/types"

type FilterItem = { value: string; label: string }

type MultiFilterProps = {
  label: string
  allLabel: string
  icon: LucideIcon
  values: string[]
  items: FilterItem[]
  onValueChange: (values: string[]) => void
  renderItem?: (item: FilterItem) => ReactNode
  renderSelectedVisual?: (value: string) => ReactNode
  emptyLabel?: string
}

function MultiFilter({ label, allLabel, icon: Icon, values, items, onValueChange, renderItem, renderSelectedVisual, emptyLabel = "No matches" }: MultiFilterProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const map = useMemo(() => new Map(items.map((item) => [item.value, item.label])), [items])
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? items.filter((item) => item.label.toLowerCase().includes(q)) : items
  }, [items, query])
  const first = values[0]
  const summary = !values.length ? allLabel : values.length === 1 ? map.get(first) ?? first : `${map.get(first) ?? first} +${values.length - 1}`

  function toggle(value: string) {
    onValueChange(values.includes(value) ? values.filter((item) => item !== value) : [...values, value])
  }

  return (
    <Combobox open={open} onOpenChange={(next) => { setOpen(next); if (!next) setQuery("") }}>
      <ComboboxTrigger asChild>
        <Button type="button" variant="outline" className={cn("h-10 w-full min-w-0 justify-between px-3 font-normal", values.length && "border-primary/25 bg-primary/[0.035]")} aria-label={label} aria-haspopup="listbox">
          <span className="flex min-w-0 items-center gap-2">
            {values.length === 1 && renderSelectedVisual ? renderSelectedVisual(first) : <Icon className={cn("size-4 shrink-0", values.length ? "text-primary" : "text-muted-foreground")} />}
            <span className={cn("truncate", !values.length && "text-muted-foreground")}>{summary}</span>
          </span>
          {values.length > 1 ? <Badge variant="secondary" className="ms-2 min-w-5 shrink-0 justify-center px-1.5">{values.length}</Badge> : null}
        </Button>
      </ComboboxTrigger>
      <ComboboxContent className="min-w-[280px]">
        {items.length > 7 ? <ComboboxSearch value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`${label}...`} aria-label={label} autoFocus /> : null}
        {values.length ? (
          <Button type="button" variant="ghost" size="sm" className="mb-1 w-full justify-start text-muted-foreground" onClick={() => onValueChange([])}>
            <X className="size-3.5" />{allLabel}
          </Button>
        ) : null}
        <ComboboxList aria-multiselectable="true">
          {filtered.map((item) => (
            <ComboboxOption key={item.value} selected={values.includes(item.value)} onClick={() => toggle(item.value)}>
              {renderItem ? renderItem(item) : <span className="inline-flex min-w-0 items-center gap-2"><Icon className="size-4 shrink-0 text-muted-foreground" /><span className="truncate">{item.label}</span></span>}
            </ComboboxOption>
          ))}
          {!filtered.length ? <div className="px-3 py-5 text-center text-sm text-muted-foreground">{emptyLabel}</div> : null}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}

function userForValue(users: JiraUser[], value: string) {
  return users.find((user) => [user.displayName, user.name, user.key, user.accountId].filter(Boolean).includes(value))
}

function userAvatar(user?: JiraUser) {
  return user?.avatarUrls?.["24x24"] ?? user?.avatarUrls?.["32x32"] ?? user?.avatarUrls?.["48x48"]
}

function removeValue(values: string[], value: string) {
  return values.filter((item) => item !== value)
}

export function ManageFiltersPanel({ locale, t, open, activeCount, typeFilter, priorityFilter, statusFilter, assigneeFilter, sprintFilter, labelFilter, estimateFilter, myIssuesOnly, filterItems, users, sprints, onType, onPriority, onStatus, onAssignee, onSprint, onLabel, onEstimate, onMyIssues, onClear }: {
  locale: AppLocale
  t: typeof copy.en | typeof copy.fa
  open: boolean
  activeCount: number
  typeFilter: string[]; priorityFilter: string[]; statusFilter: string[]; assigneeFilter: string[]; sprintFilter: string[]; labelFilter: string[]
  estimateFilter: string; myIssuesOnly: boolean
  filterItems: { type: FilterItem[]; priority: FilterItem[]; status: FilterItem[]; assignee: FilterItem[]; sprint: FilterItem[]; label: FilterItem[]; estimate: FilterItem[] }
  users: JiraUser[]; sprints: JiraSprint[]
  onType: (value: string[]) => void; onPriority: (value: string[]) => void; onStatus: (value: string[]) => void; onAssignee: (value: string[]) => void
  onSprint: (value: string[]) => void; onLabel: (value: string[]) => void; onEstimate: (value: string) => void; onMyIssues: (value: boolean) => void; onClear: () => void
}) {
  const sprintMap = useMemo(() => new Map(sprints.map((item) => [String(item.id), item])), [sprints])
  const itemLabel = (items: FilterItem[], value: string) => items.find((item) => item.value === value)?.label ?? value
  const chips: Array<{ key: string; label: string; visual: ReactNode; clear: () => void }> = []
  typeFilter.forEach((value) => chips.push({ key: `type:${value}`, label: `${t.type}: ${itemLabel(filterItems.type, value)}`, visual: <Shapes className="size-3.5" />, clear: () => onType(removeValue(typeFilter, value)) }))
  priorityFilter.forEach((value) => chips.push({ key: `priority:${value}`, label: `${t.priority}: ${itemLabel(filterItems.priority, value)}`, visual: <PriorityVisual name={value} compact className="[&>span:last-child]:hidden" />, clear: () => onPriority(removeValue(priorityFilter, value)) }))
  statusFilter.forEach((value) => chips.push({ key: `status:${value}`, label: `${t.status}: ${itemLabel(filterItems.status, value)}`, visual: <CircleDotDashed className="size-3.5" />, clear: () => onStatus(removeValue(statusFilter, value)) }))
  assigneeFilter.forEach((value) => {
    const user = userForValue(users, value)
    chips.push({ key: `assignee:${value}`, label: `${t.assignee}: ${itemLabel(filterItems.assignee, value)}`, visual: value === "__unassigned__" ? <UserRoundX className="size-3.5" /> : <JiraUserAvatar name={itemLabel(filterItems.assignee, value)} avatarUrl={userAvatar(user)} className="size-4" />, clear: () => onAssignee(removeValue(assigneeFilter, value)) })
  })
  sprintFilter.forEach((value) => chips.push({ key: `sprint:${value}`, label: `${t.sprint}: ${itemLabel(filterItems.sprint, value)}`, visual: value === "backlog" ? <Inbox className="size-3.5" /> : <Layers3 className="size-3.5" />, clear: () => onSprint(removeValue(sprintFilter, value)) }))
  labelFilter.forEach((value) => chips.push({ key: `label:${value}`, label: `${t.labels}: ${itemLabel(filterItems.label, value)}`, visual: <Tag className="size-3.5" />, clear: () => onLabel(removeValue(labelFilter, value)) }))
  if (estimateFilter !== "all") chips.push({ key: `estimate:${estimateFilter}`, label: `${t.estimate}: ${itemLabel(filterItems.estimate, estimateFilter)}`, visual: <Clock3 className="size-3.5" />, clear: () => onEstimate("all") })
  if (myIssuesOnly) chips.push({ key: "my-issues", label: t.myIssues, visual: <UserRound className="size-3.5" />, clear: () => onMyIssues(false) })

  return (
    <>
      {open ? (
        <div className="mt-3 rounded-[var(--qm-panel-radius)] border bg-muted/10 p-3">
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
            <MultiFilter label={t.type} allLabel={locale === "fa" ? "همه نوع‌ها" : "All types"} icon={Shapes} values={typeFilter} items={filterItems.type} onValueChange={onType} emptyLabel={locale === "fa" ? "موردی پیدا نشد" : "No matches"} />
            <MultiFilter label={t.priority} allLabel={t.allPriorities} icon={SlidersHorizontal} values={priorityFilter} items={filterItems.priority} onValueChange={onPriority} renderItem={(item) => <PriorityVisual name={item.value} compact />} renderSelectedVisual={(value) => <PriorityVisual name={value} compact className="[&>span:last-child]:hidden" />} emptyLabel={locale === "fa" ? "موردی پیدا نشد" : "No matches"} />
            <MultiFilter label={t.status} allLabel={t.allStatuses} icon={CircleDotDashed} values={statusFilter} items={filterItems.status} onValueChange={onStatus} emptyLabel={locale === "fa" ? "موردی پیدا نشد" : "No matches"} />
            <MultiFilter label={t.assignee} allLabel={t.allAssignees} icon={UserRound} values={assigneeFilter} items={filterItems.assignee} onValueChange={onAssignee} renderItem={(item) => {
              if (item.value === "__unassigned__") return <span className="inline-flex items-center gap-2 text-muted-foreground"><UserRoundX className="size-5" />{item.label}</span>
              const user = userForValue(users, item.value)
              return <span className="inline-flex min-w-0 items-center gap-2"><JiraUserAvatar name={item.label} avatarUrl={userAvatar(user)} className="size-6" /><span className="truncate">{item.label}</span></span>
            }} renderSelectedVisual={(value) => {
              const user = userForValue(users, value)
              return value === "__unassigned__" ? <UserRoundX className="size-4 text-primary" /> : <JiraUserAvatar name={itemLabel(filterItems.assignee, value)} avatarUrl={userAvatar(user)} className="size-5" />
            }} emptyLabel={locale === "fa" ? "موردی پیدا نشد" : "No matches"} />
            <MultiFilter label={t.sprint} allLabel={t.allSprints} icon={Layers3} values={sprintFilter} items={filterItems.sprint} onValueChange={onSprint} renderItem={(item) => item.value === "backlog" ? <span className="inline-flex items-center gap-2"><span className="grid size-6 place-items-center rounded-[var(--qm-control-radius)] bg-muted"><Inbox className="size-3.5" /></span>{item.label}</span> : <SprintVisual sprint={sprintMap.get(item.value)} backlogLabel={t.backlog} compact />} emptyLabel={locale === "fa" ? "موردی پیدا نشد" : "No matches"} />
            <MultiFilter label={t.labels} allLabel={t.allLabels} icon={Tag} values={labelFilter} items={filterItems.label} onValueChange={onLabel} emptyLabel={locale === "fa" ? "موردی پیدا نشد" : "No matches"} />
            <div className="relative">
              <Clock3 className="pointer-events-none absolute start-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
              <SimpleSelect value={estimateFilter} onValueChange={onEstimate} items={filterItems.estimate} className="ps-9" ariaLabel={t.estimate} />
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 border-t pt-2 text-xs text-muted-foreground">
            <Search className="size-3.5" />
            <span>{locale === "fa" ? "در هر فیلتر می‌توانی چند گزینه انتخاب کنی؛ گزینه‌های همان فیلتر با OR و فیلترهای مختلف با AND ترکیب می‌شوند." : "Choose multiple values per filter. Values within a filter use OR; different filter groups combine with AND."}</span>
          </div>
        </div>
      ) : null}

      {chips.length ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-[var(--qm-panel-radius)] border border-primary/15 bg-primary/[0.035] p-2.5" aria-label={locale === "fa" ? "فیلترهای فعال" : "Active filters"}>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary"><SlidersHorizontal className="size-3.5" />{locale === "fa" ? "فیلترهای فعال" : "Active filters"}<Badge variant="secondary" className="ms-1 px-1.5 py-0">{activeCount}</Badge></span>
          <span className="h-5 w-px bg-border" aria-hidden="true" />
          {chips.map((chip) => (
            <button key={chip.key} type="button" onClick={chip.clear} className="inline-flex min-h-8 max-w-full cursor-pointer items-center gap-1.5 rounded-[var(--qm-control-radius)] border bg-background px-2.5 py-1 text-xs font-medium text-foreground transition hover:border-primary/30 hover:bg-accent focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20" title={locale === "fa" ? "برای حذف این فیلتر کلیک کن" : "Click to remove this filter"}>
              <span className="shrink-0 text-muted-foreground">{chip.visual}</span><span className="truncate">{chip.label}</span><X className="size-3 shrink-0 text-muted-foreground" />
            </button>
          ))}
          <Button variant="ghost" size="sm" className="ms-auto h-8" onClick={onClear}><X className="size-3.5" />{t.clearFilters}</Button>
        </div>
      ) : null}
    </>
  )
}
