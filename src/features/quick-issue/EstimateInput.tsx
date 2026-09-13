import type { ChangeEvent } from "react"
import { Clock3 } from "lucide-react"

import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { isValidJiraEstimate } from "@/lib/validation"

export function EstimateInput({ label, value, onValueChange, placeholder, help, inheritedText, disabled = false }: {
  label: string
  value: string
  onValueChange: (value: string) => void
  placeholder: string
  help: string
  inheritedText?: string
  disabled?: boolean
}) {
  const invalid = Boolean(value.trim()) && !isValidJiraEstimate(value)
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <div className="relative">
        <Clock3 className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onValueChange(event.target.value)}
          placeholder={placeholder}
          className="ps-9 font-mono"
          dir="ltr"
          inputMode="text"
          autoComplete="off"
          disabled={disabled}
          aria-invalid={invalid || undefined}
        />
      </div>
      <FieldDescription className={cn(invalid && "text-destructive")}>{invalid ? help : inheritedText || help}</FieldDescription>
    </Field>
  )
}
