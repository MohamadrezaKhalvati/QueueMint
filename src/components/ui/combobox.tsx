import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { Check, Search } from "lucide-react"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const Combobox = PopoverPrimitive.Root
const ComboboxTrigger = PopoverPrimitive.Trigger

function ComboboxContent({ className, align = "start", sideOffset = 6, ...props }: React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        data-slot="combobox-content"
        align={align}
        sideOffset={sideOffset}
        collisionPadding={12}
        className={cn(
          "z-[270] w-[var(--radix-popover-trigger-width)] min-w-[240px] rounded-xl border bg-popover p-2 text-popover-foreground shadow-xl outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
}

function ComboboxSearch({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <div className="relative mb-2">
      <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input className={cn("ps-9", className)} autoComplete="off" {...props} />
    </div>
  )
}

function ComboboxList({ className, ...props }: React.ComponentProps<"div">) {
  return <div role="listbox" className={cn("max-h-72 overflow-y-auto overscroll-contain", className)} {...props} />
}

function ComboboxOption({ className, selected, children, ...props }: React.ComponentProps<"button"> & { selected?: boolean }) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      className={cn(
        "relative flex min-h-9 w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 pe-8 text-start text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:ring-[2px] focus-visible:ring-ring/20",
        selected && "bg-accent/70",
        className,
      )}
      {...props}
    >
      <span className="min-w-0 flex-1">{children}</span>
      {selected ? <Check className="absolute end-2 size-4 text-primary" /> : null}
    </button>
  )
}

function ComboboxEmpty({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("px-3 py-5 text-center text-sm text-muted-foreground", className)} {...props} />
}


export { Combobox, ComboboxContent, ComboboxEmpty, ComboboxList, ComboboxOption, ComboboxSearch, ComboboxTrigger }
