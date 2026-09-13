import { ArrowLeft, ArrowRight, ExternalLink, RotateCcw } from "lucide-react"

import { AppearanceQuickControls } from "@/features/app-shell/AppearanceQuickControls"
import { Button } from "@/components/ui/button"
import type { AppLocale, AppTheme, JiraConnectionStatus } from "@/types"
import type { PopupCopy } from "./popup-copy"
import { openFullWorkspace, PopupLogo } from "./popup-shared"

export function PopupHeader({
  locale,
  theme,
  isDark,
  view,
  standaloneCapture,
  status,
  finalScreenshot,
  hasCaptureSession,
  t,
  onBack,
  onResetCapture,
  onTheme,
  onLocale,
}: {
  locale: AppLocale
  theme: AppTheme
  isDark: boolean
  view: "home" | "capture" | "issue" | "success"
  standaloneCapture: boolean
  status: JiraConnectionStatus
  finalScreenshot: string | null
  hasCaptureSession: boolean
  t: PopupCopy
  onBack: (view: "home" | "capture") => void
  onResetCapture: () => void
  onTheme: () => void
  onLocale: () => void
}) {
  const BackIcon = locale === "fa" ? ArrowRight : ArrowLeft
  const showBack = view !== "home" && !(standaloneCapture && view === "capture")

  return (
    <div className="qm-popup-header">
      <div className="flex min-w-0 items-center gap-2.5">
        {showBack ? (
          <Button variant="ghost" size="icon-sm" onClick={() => onBack(view === "issue" && finalScreenshot ? "capture" : "home")} aria-label={t.back} title={t.back}>
            <BackIcon className="size-4" />
          </Button>
        ) : <PopupLogo />}
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">QueueMint</div>
          <div className="truncate text-[11px] text-muted-foreground">{t.capture}</div>
        </div>
      </div>
      <div className="qm-popup-header-actions">
        <span className={`qm-popup-status ${status.configured ? "is-connected" : ""}`}><span className="size-1.5 rounded-full bg-current" />{status.configured ? t.connected : t.disconnected}</span>
        {hasCaptureSession ? <Button variant="ghost" size="icon-sm" className="qm-popup-header-icon" onClick={onResetCapture} title={t.resetCapture} aria-label={t.resetCapture}><RotateCcw className="size-4" /></Button> : null}
        <AppearanceQuickControls locale={locale} theme={theme} isDark={isDark} themeLabel={t.theme} languageLabel={t.language} onTheme={onTheme} onLocale={onLocale} compact />
        <Button variant="ghost" size="icon-sm" className="qm-popup-header-icon" onClick={openFullWorkspace} title={t.openWorkspace} aria-label={t.openWorkspace}><ExternalLink className="size-4" /></Button>
      </div>
    </div>
  )
}
