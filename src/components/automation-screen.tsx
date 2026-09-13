import { Zap } from "lucide-react"
import { useMemo } from "react"

import { Badge } from "@/components/ui/badge"
import { matchingIssuesForRule } from "@/lib/intelligence"
import type { ActivityEntry, AutomationConditionKind, AutomationRule, SavedWorkspaceAction } from "@/lib/storage"
import type { AppLocale, JiraLiveIssue, JiraPriority } from "@/types"
import { AutomationActivity } from "@/features/automation/AutomationActivity"
import { automationCopy } from "@/features/automation/automation-copy"
import { AutomationOverview } from "@/features/automation/AutomationOverview"
import { AutomationQuickStart } from "@/features/automation/AutomationQuickStart"
import { AutomationRuleBuilder } from "@/features/automation/AutomationRuleBuilder"
import { AutomationRuleList } from "@/features/automation/AutomationRuleList"
import type { QuickAutomationActionInput } from "@/features/automation/automation-types"

export function AutomationScreen({ locale, projectKey, boardId, issues, priorities, savedActions, rules, activity, currentUserIdentity, onCreateQuickAction, onOpenAdvancedAction, onCreateRule, onToggleRule, onDeleteRule, onReviewRule, onClearActivity }: {
  locale: AppLocale
  projectKey?: string
  boardId: number | null
  issues: JiraLiveIssue[]
  priorities: JiraPriority[]
  savedActions: SavedWorkspaceAction[]
  rules: AutomationRule[]
  activity: ActivityEntry[]
  currentUserIdentity?: string
  onCreateQuickAction: (input: QuickAutomationActionInput) => string | null
  onOpenAdvancedAction: () => void
  onCreateRule: (input: { name: string; condition: { kind: AutomationConditionKind; value?: string }; actionId: string }) => string | null
  onToggleRule: (id: string) => void
  onDeleteRule: (id: string) => void
  onReviewRule: (rule: AutomationRule) => void
  onClearActivity: () => void
}) {
  const tx = automationCopy(locale)
  const contextRules = useMemo(() => rules.filter((rule) => (!rule.projectKey || rule.projectKey === projectKey) && (!rule.boardId || rule.boardId === boardId)), [rules, projectKey, boardId])
  const enabledRules = contextRules.filter((rule) => rule.enabled)
  const matchingNow = enabledRules.reduce((total, rule) => total + matchingIssuesForRule(rule, issues).length, 0)

  return (
    <div className="qm-screen animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="qm-page-heading flex flex-wrap items-end justify-between gap-4">
        <div><div className="qm-eyebrow">{tx.eyebrow}</div><h1 className="qm-page-title">{tx.title}</h1><p className="qm-page-subtitle max-w-3xl">{tx.hint}</p></div>
        <Badge variant="secondary" className="gap-1.5"><Zap className="size-3.5" />{tx.currentBoard}</Badge>
      </div>
      <AutomationOverview tx={tx} enabledRules={enabledRules.length} matchingNow={matchingNow} savedActions={savedActions.length} activity={activity.length} />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,.8fr)]">
        <div className="space-y-5">
          {!savedActions.length ? <AutomationQuickStart tx={tx} priorities={priorities} canAssignToMe={Boolean(currentUserIdentity)} onCreateQuickAction={onCreateQuickAction} onOpenAdvanced={onOpenAdvancedAction} /> : <AutomationRuleBuilder tx={tx} issues={issues} priorities={priorities} savedActions={savedActions} onCreateRule={onCreateRule} />}
          <AutomationRuleList tx={tx} locale={locale} projectKey={projectKey} boardId={boardId} issues={issues} savedActions={savedActions} rules={rules} onToggle={onToggleRule} onDelete={onDeleteRule} onReview={onReviewRule} />
        </div>
        <AutomationActivity tx={tx} locale={locale} activity={activity} onClear={onClearActivity} />
      </div>
    </div>
  )
}
