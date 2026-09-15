import { Bell, CalendarDays, CheckCircle2, LayoutDashboard, Search, Settings2, Users2 } from "lucide-react"
import type { CSSProperties } from "react"

import type { AppLocale } from "@/types"
import { resolveAppearanceColors, type AppearanceSettings } from "./appearance-preset"
import type { customizationCopy } from "./customization-copy"

type Copy = ReturnType<typeof customizationCopy>
type PreviewStyle = CSSProperties & { "--primary": string; "--ring": string; "--primary-foreground": string }

export function CustomizationPreview({ locale, tx, settings }: { locale: AppLocale; tx: Copy; settings: AppearanceSettings }) {
  const isFa = locale === "fa"
  const systemDark = typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches
  const colors = resolveAppearanceColors(settings, Boolean(systemDark))
  const style: PreviewStyle = { "--primary": colors.accent, "--ring": colors.accent, "--primary-foreground": colors.foreground }
  return (
    <section className="qm-custom-preview-wrap" aria-label={tx.preview}>
      <div className="qm-custom-preview-label">{tx.preview}</div>
      <div
        className={`qm-custom-preview ${colors.dark ? "dark" : ""}`} style={style} lang={locale} dir={isFa ? "rtl" : "ltr"}
        data-tone={settings.neutralTone} data-density={settings.density} data-radius={settings.radius}
        data-body-font={settings.bodyFont} data-heading-font={settings.headingFont} data-sidebar-style={settings.sidebarStyle}
        data-sidebar-accent={settings.sidebarAccent} data-surface={settings.surfaceStyle}
      >
        <aside className="qm-custom-preview-sidebar">
          <div className="qm-custom-preview-brand"><span className="qm-custom-preview-mark">Q</span><strong>QueueMint</strong></div>
          <div className="qm-custom-preview-nav">
            <PreviewNav icon={LayoutDashboard} label={isFa ? "فضای کار" : "Workspace"} active />
            <PreviewNav icon={CalendarDays} label={isFa ? "ثبت زمان" : "Worklog"} />
            <PreviewNav icon={Users2} label={isFa ? "مدیریت جیرا" : "Manage Jira"} />
            <PreviewNav icon={Settings2} label={isFa ? "تنظیمات" : "Settings"} />
          </div>
        </aside>
        <div className="qm-custom-preview-main">
          <header className="qm-custom-preview-topbar"><div className="qm-custom-preview-search"><Search className="size-3.5" /><span>{isFa ? "جستجو" : "Search"}</span></div><Bell className="size-4" /></header>
          <div className="qm-custom-preview-body">
            <div className="qm-custom-preview-heading"><div><span className="qm-custom-preview-kicker">{isFa ? "امروز" : "TODAY"}</span><h3>{isFa ? "خلاصه فضای کار" : "Workspace overview"}</h3></div><button type="button">{isFa ? "ساخت تسک" : "Create issue"}</button></div>
            <div className="qm-custom-preview-metrics">
              <PreviewMetric label={isFa ? "در حال انجام" : "In progress"} value="12" detail={isFa ? "۳ مورد برای شما" : "3 assigned to you"} />
              <PreviewMetric label={isFa ? "زمان امروز" : "Logged today"} value="6h 20m" detail={isFa ? "۱ ساعت باقی مانده" : "1h 10m remaining"} />
              <PreviewMetric label={isFa ? "اسپرینت" : "Sprint"} value="68%" detail={isFa ? "۲۱ از ۳۱" : "21 of 31 issues"} />
            </div>
            <div className="qm-custom-preview-table">
              <div className="qm-custom-preview-table-head"><span>{isFa ? "کارهای اخیر" : "Recent work"}</span><span>{isFa ? "وضعیت" : "Status"}</span></div>
              <PreviewRow keyLabel="QM-184" title={isFa ? "بهبود جریان ساخت باگ" : "Improve bug creation flow"} />
              <PreviewRow keyLabel="QM-179" title={isFa ? "بازبینی ثبت زمان" : "Review worklog experience"} />
              <PreviewRow keyLabel="QM-171" title={isFa ? "همگام سازی فیلترها" : "Sync board filters"} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function PreviewNav({ icon: Icon, label, active = false }: { icon: typeof LayoutDashboard; label: string; active?: boolean }) {
  return <div className={`qm-custom-preview-nav-item ${active ? "is-active" : ""}`}><Icon className="size-3.5" /><span>{label}</span></div>
}

function PreviewMetric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <article className="qm-custom-preview-card"><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>
}

function PreviewRow({ keyLabel, title }: { keyLabel: string; title: string }) {
  return <div className="qm-custom-preview-row"><div><b>{keyLabel}</b><span>{title}</span></div><span className="qm-custom-preview-status"><CheckCircle2 className="size-3" />Active</span></div>
}
