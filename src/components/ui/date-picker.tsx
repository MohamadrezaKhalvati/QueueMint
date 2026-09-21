import { useEffect, useState } from "react"
import { CalendarDays, ChevronDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

function startOfMonth(value?: Date) {
  const date = value ?? new Date()
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function localToday() {
  const date = new Date()
  date.setHours(12, 0, 0, 0)
  return date
}

export function DatePicker({ value, onChange, locale = "en-US", disabled, disableAfter, className, ariaLabel, placeholder = "Choose date", onClear, clearLabel = "Clear", todayLabel = "Today", showToday = false }: {
  value?: Date
  onChange: (date: Date) => void
  locale?: string
  disabled?: boolean
  disableAfter?: Date
  className?: string
  ariaLabel?: string
  placeholder?: string
  onClear?: () => void
  clearLabel?: string
  todayLabel?: string
  showToday?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [month, setMonth] = useState(() => startOfMonth(value))
  useEffect(() => {
    if (value) setMonth(startOfMonth(value))
  }, [value])

  const text = value ? new Intl.DateTimeFormat(locale, { weekday: "short", month: "short", day: "numeric", year: "numeric" }).format(value) : placeholder
  const max = disableAfter ? new Date(disableAfter.getFullYear(), disableAfter.getMonth(), disableAfter.getDate(), 23, 59, 59, 999) : undefined

  function choose(date: Date) {
    onChange(date)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          aria-label={ariaLabel}
          data-empty={value ? undefined : "true"}
          className={cn("h-10 min-w-[178px] justify-between px-3 font-normal data-[empty=true]:text-muted-foreground", className)}
        >
          <span className="inline-flex min-w-0 items-center gap-2"><CalendarDays className="size-4 shrink-0 text-muted-foreground" /><span className="truncate">{text}</span></span>
          <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto overflow-hidden p-0">
        <div className="p-3">
          <Calendar
            selected={value}
            month={month}
            onMonthChange={setMonth}
            locale={locale}
            disabled={(date) => Boolean(max && date.getTime() > max.getTime())}
            onSelect={choose}
          />
        </div>
        {showToday || onClear ? (
          <div className="flex items-center justify-between gap-2 border-t bg-muted/20 px-3 py-2">
            {onClear ? <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => { onClear(); setOpen(false) }}>{clearLabel}</Button> : <span />}
            {showToday ? <Button variant="ghost" size="sm" className="h-8 px-2 text-primary" onClick={() => choose(localToday())}>{todayLabel}</Button> : null}
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  )
}
