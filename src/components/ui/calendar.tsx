import { useMemo } from "react"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function dateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

function sameDay(a?: Date, b?: Date) {
  return Boolean(a && b && dateKey(a) === dateKey(b))
}

function monthGrid(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  const start = new Date(first)
  start.setDate(first.getDate() - first.getDay())
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    return date
  })
}

function shiftMonth(month: Date, offset: number) {
  return new Date(month.getFullYear(), month.getMonth() + offset, 1)
}

function shiftYear(month: Date, offset: number) {
  return new Date(month.getFullYear() + offset, month.getMonth(), 1)
}

export function Calendar({ selected, month, onMonthChange, onSelect, locale = "en-US", disabled }: {
  selected?: Date
  month: Date
  onMonthChange: (date: Date) => void
  onSelect: (date: Date) => void
  locale?: string
  disabled?: (date: Date) => boolean
}) {
  const days = useMemo(() => monthGrid(month), [month])
  const weekday = new Intl.DateTimeFormat(locale, { weekday: "narrow" })
  const monthTitle = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(month)
  const fullDate = new Intl.DateTimeFormat(locale, { dateStyle: "full" })
  const weekdayDates = Array.from({ length: 7 }, (_, index) => new Date(2024, 0, 7 + index))
  const today = new Date()
  const isFa = locale.toLowerCase().startsWith("fa")

  return (
    <div data-slot="calendar" className="w-[292px] select-none">
      <div className="mb-2 grid grid-cols-[32px_32px_minmax(0,1fr)_32px_32px] items-center gap-1">
        <Button variant="ghost" size="icon-sm" aria-label={isFa ? "سال قبل" : "Previous year"} title={isFa ? "سال قبل" : "Previous year"} onClick={() => onMonthChange(shiftYear(month, -1))}><ChevronsLeft className="size-4" /></Button>
        <Button variant="ghost" size="icon-sm" aria-label={isFa ? "ماه قبل" : "Previous month"} title={isFa ? "ماه قبل" : "Previous month"} onClick={() => onMonthChange(shiftMonth(month, -1))}><ChevronLeft className="size-4" /></Button>
        <div className="min-w-0 truncate px-1 text-center text-sm font-semibold capitalize" aria-live="polite">{monthTitle}</div>
        <Button variant="ghost" size="icon-sm" aria-label={isFa ? "ماه بعد" : "Next month"} title={isFa ? "ماه بعد" : "Next month"} onClick={() => onMonthChange(shiftMonth(month, 1))}><ChevronRight className="size-4" /></Button>
        <Button variant="ghost" size="icon-sm" aria-label={isFa ? "سال بعد" : "Next year"} title={isFa ? "سال بعد" : "Next year"} onClick={() => onMonthChange(shiftYear(month, 1))}><ChevronsRight className="size-4" /></Button>
      </div>
      <div className="mb-1 grid grid-cols-7 text-center text-[11px] font-medium text-muted-foreground">
        {weekdayDates.map((date) => <span key={date.toISOString()} className="py-1">{weekday.format(date)}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {days.map((date) => {
          const outside = date.getMonth() !== month.getMonth()
          const isSelected = sameDay(date, selected)
          const isToday = sameDay(date, today)
          const isDisabled = disabled?.(date) ?? false
          return (
            <button
              key={date.toISOString()}
              type="button"
              aria-label={fullDate.format(date)}
              aria-pressed={isSelected}
              disabled={isDisabled}
              onClick={() => onSelect(date)}
              className={cn(
                "grid size-9 place-items-center rounded-[var(--qm-control-radius)] text-xs outline-none transition hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/25 disabled:pointer-events-none disabled:opacity-30",
                outside && "text-muted-foreground/45",
                isToday && !isSelected && "font-semibold text-primary",
                isSelected && "bg-primary font-semibold text-primary-foreground hover:bg-primary/92",
              )}
            >
              {date.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}
