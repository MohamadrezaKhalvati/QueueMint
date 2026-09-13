import { Languages, Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { AppLocale, AppTheme } from "@/types"

export function AppearanceQuickControls({
  locale,
  theme,
  isDark,
  themeLabel,
  languageLabel,
  onTheme,
  onLocale,
  compact = false,
  className,
}: {
  locale: AppLocale
  theme: AppTheme
  isDark?: boolean
  themeLabel: string
  languageLabel: string
  onTheme: () => void
  onLocale: () => void
  compact?: boolean
  className?: string
}) {
  const dark = isDark ?? theme === "dark"
  const size = compact ? "icon-sm" : "icon"

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Button
        variant="ghost"
        size={size}
        className={compact ? "qm-popup-header-icon" : "qm-topbar-icon"}
        onClick={onTheme}
        aria-label={themeLabel}
        title={`${themeLabel}: ${theme}`}
      >
        {dark ? <Sun className="size-[17px]" /> : <Moon className="size-[17px]" />}
      </Button>
      <Button
        variant="ghost"
        size={size}
        className={compact ? "qm-popup-header-icon" : "qm-topbar-icon"}
        onClick={onLocale}
        aria-label={languageLabel}
        title={`${languageLabel}: ${locale}`}
      >
        <Languages className="size-[17px]" />
      </Button>
    </div>
  )
}
