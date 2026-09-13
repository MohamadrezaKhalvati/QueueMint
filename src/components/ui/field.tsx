import * as React from "react"
import { cn } from "@/lib/utils"

function Field({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="field" className={cn("flex flex-col gap-1.5", className)} {...props} />
}

function FieldLabel({ className, ...props }: React.ComponentProps<"label">) {
  return <label data-slot="field-label" className={cn("text-xs font-medium text-muted-foreground", className)} {...props} />
}

function FieldDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p data-slot="field-description" className={cn("text-xs leading-5 text-muted-foreground", className)} {...props} />
}

function FieldError({ className, ...props }: React.ComponentProps<"p">) {
  return <p data-slot="field-error" className={cn("text-xs font-medium text-destructive", className)} {...props} />
}

export { Field, FieldDescription, FieldError, FieldLabel }
