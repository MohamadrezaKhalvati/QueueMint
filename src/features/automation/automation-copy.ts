import type { AppLocale } from "@/types"
import type { AutomationConditionKind } from "@/lib/storage"

const EN = {
  eyebrow: "AUTOMATION",
  title: "Automation center",
  hint: "Turn saved bulk actions into safe rules. QueueMint finds matching issues first, then sends them through the normal preview before Jira changes.",
  enabledRules: "Enabled rules",
  matchingNow: "Matching now",
  savedActions: "Saved actions",
  activity: "Activity",
  newRule: "Create rule",
  ruleName: "Rule name",
  ruleNamePlaceholder: "Example: Unassigned bugs to triage",
  condition: "When",
  conditionValue: "Value",
  action: "Then use saved action",
  createRule: "Save rule",
  noRules: "No automation rules yet.",
  noActivity: "No activity recorded yet.",
  review: "Review matches",
  disable: "Disable",
  enable: "Enable",
  delete: "Delete",
  clearActivity: "Clear activity",
  currentBoard: "Current board",
  differentContext: "Different project or board",
  issues: "issues",
  lastChecked: "Last checked",
  conditionUnassigned: "Assignee is empty",
  conditionNoEstimate: "Estimate is empty",
  conditionBacklog: "Issue is in backlog",
  conditionPriority: "Priority equals",
  conditionStatus: "Status equals",
  conditionType: "Issue type equals",
  conditionLabel: "Label contains",
  valueRequired: "Choose a value for this condition.",
  actionRequired: "Choose a saved action.",
  nameRequired: "Give the rule a name.",
  safeNote: "Rules never write to Jira silently. Review matches opens the normal bulk editor and preview first.",
  quickStartTitle: "Start here",
  quickStartHint: "Automation rules reuse saved actions. Create a common action here in one click, or open Bulk edit for an advanced action.",
  quickAction: "Quick action",
  quickAdd: "Add saved action",
  advancedAction: "Build advanced action",
  quickPriority: "Set priority",
  quickAssignMe: "Assign to me",
  quickUnassign: "Clear assignee",
  quickBacklog: "Move to backlog",
  choosePriority: "Choose priority",
  quickAdded: "Saved action created. You can create a rule now.",
  flowAction: "1. Create an action",
  flowRule: "2. Create a rule",
  flowReview: "3. Review matches",
}

export type AutomationCopy = { [K in keyof typeof EN]: string }

const FA: AutomationCopy = {
  eyebrow: "AUTOMATION",
  title: "مرکز اتوماسیون",
  hint: "عملیات گروهی ذخیره شده را به قانون امن تبدیل کن. QueueMint اول تسک های منطبق را پیدا می کند و بعد همان مسیر پیش نمایش قبل از تغییر Jira را باز می کند.",
  enabledRules: "قوانین فعال",
  matchingNow: "منطبق در حال حاضر",
  savedActions: "عملیات ذخیره شده",
  activity: "فعالیت ها",
  newRule: "ساخت قانون",
  ruleName: "نام قانون",
  ruleNamePlaceholder: "مثلا: باگ های بدون مسئول برای بررسی",
  condition: "شرط",
  conditionValue: "مقدار",
  action: "عملیات ذخیره شده",
  createRule: "ذخیره قانون",
  noRules: "هنوز قانونی ساخته نشده است.",
  noActivity: "هنوز فعالیتی ثبت نشده است.",
  review: "بررسی موارد منطبق",
  disable: "غیرفعال",
  enable: "فعال",
  delete: "حذف",
  clearActivity: "پاک کردن فعالیت ها",
  currentBoard: "بورد فعلی",
  differentContext: "پروژه یا بورد متفاوت",
  issues: "تسک",
  lastChecked: "آخرین بررسی",
  conditionUnassigned: "مسئول خالی است",
  conditionNoEstimate: "برآورد خالی است",
  conditionBacklog: "تسک در بک لاگ است",
  conditionPriority: "اولویت برابر است با",
  conditionStatus: "وضعیت برابر است با",
  conditionType: "نوع تسک برابر است با",
  conditionLabel: "برچسب شامل",
  valueRequired: "برای این شرط یک مقدار انتخاب کن.",
  actionRequired: "یک عملیات ذخیره شده انتخاب کن.",
  nameRequired: "برای قانون یک نام بنویس.",
  safeNote: "قانون ها بدون اطلاع تو Jira را تغییر نمی دهند. بررسی موارد منطبق اول ویرایش گروهی و پیش نمایش معمول را باز می کند.",
  quickStartTitle: "از اینجا شروع کن",
  quickStartHint: "قانون های اتوماسیون از عملیات ذخیره شده استفاده می کنند. یک عملیات رایج را همین جا سریع بساز، یا برای تنظیم پیشرفته وارد ویرایش گروهی شو.",
  quickAction: "عملیات سریع",
  quickAdd: "ساخت عملیات ذخیره شده",
  advancedAction: "ساخت عملیات پیشرفته",
  quickPriority: "تغییر اولویت",
  quickAssignMe: "اختصاص به من",
  quickUnassign: "حذف مسئول",
  quickBacklog: "انتقال به بک لاگ",
  choosePriority: "انتخاب اولویت",
  quickAdded: "عملیات ذخیره شد. حالا می توانی قانون بسازی.",
  flowAction: "۱. ساخت عملیات",
  flowRule: "۲. ساخت قانون",
  flowReview: "۳. بررسی قبل از اجرا",
}

export function automationCopy(locale: AppLocale): AutomationCopy {
  return locale === "fa" ? FA : EN
}

export function conditionNeedsValue(kind: AutomationConditionKind) {
  return kind === "priority-is" || kind === "status-is" || kind === "type-is" || kind === "label-has"
}

export function conditionText(kind: AutomationConditionKind, value: string | undefined, tx: AutomationCopy) {
  const labels: Record<AutomationConditionKind, string> = {
    unassigned: tx.conditionUnassigned,
    "no-estimate": tx.conditionNoEstimate,
    backlog: tx.conditionBacklog,
    "priority-is": tx.conditionPriority,
    "status-is": tx.conditionStatus,
    "type-is": tx.conditionType,
    "label-has": tx.conditionLabel,
  }
  return value ? `${labels[kind]}: ${value}` : labels[kind]
}

export function formatAutomationDate(value: string, locale: AppLocale) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en", { dateStyle: "medium", timeStyle: "short" }).format(date)
}
