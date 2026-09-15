import { useEffect, useRef } from "react"

import { cn } from "@/lib/utils"

export function SelectionCheckbox({ checked, indeterminate = false, onChange, label, className }: {
  checked: boolean
  indeterminate?: boolean
  onChange: (checked: boolean) => void
  label: string
  className?: string
}) {
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate
  }, [indeterminate])

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      data-indeterminate={indeterminate ? "true" : undefined}
      onClick={(event) => event.stopPropagation()}
      onChange={(event) => onChange(event.target.checked)}
      aria-label={label}
      className={cn("qm-selection-checkbox size-4 shrink-0 cursor-pointer", className)}
    />
  )
}
