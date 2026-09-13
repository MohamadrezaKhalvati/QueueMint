import { useMemo, useState, type ReactNode } from "react"
import { ChevronsUpDown, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxList,
  ComboboxOption,
  ComboboxSearch,
  ComboboxTrigger,
} from "@/components/ui/combobox"
import { cn } from "@/lib/utils"

export function SearchableSingle({
  items,
  value,
  onValueChange,
  itemLabel,
  placeholder,
  emptyLabel,
  disabled,
  leading,
  renderItem,
  allowClear = false,
  clearLabel = "Clear selection",
}: {
  items: string[]
  value?: string | null
  onValueChange: (value: string | null) => void
  itemLabel: (value: string) => string
  placeholder: string
  emptyLabel: string
  disabled?: boolean
  leading?: ReactNode
  renderItem?: (value: string) => ReactNode
  allowClear?: boolean
  clearLabel?: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? items.filter((item) => itemLabel(item).toLowerCase().includes(q)) : items
  }, [items, itemLabel, query])

  function choose(next: string) {
    onValueChange(next)
    setOpen(false)
    setQuery("")
  }

  return (
    <Combobox open={open} onOpenChange={setOpen}>
      <ComboboxTrigger asChild>
        <Button type="button" variant="outline" className="h-10 w-full min-w-0 justify-between px-3 font-normal" disabled={disabled} aria-haspopup="listbox">
          <span className="flex min-w-0 items-center gap-2">{leading}<span className={cn("truncate", !value && "text-muted-foreground")}>{value ? itemLabel(value) : placeholder}</span></span>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
        </Button>
      </ComboboxTrigger>
      <ComboboxContent>
        <ComboboxSearch value={query} onChange={(event) => setQuery(event.target.value)} placeholder={placeholder} autoFocus />
        <ComboboxList>
          {allowClear && value ? <ComboboxOption onClick={() => { onValueChange(null); setOpen(false); setQuery("") }}><span className="inline-flex items-center gap-2 text-muted-foreground"><X className="size-4" />{clearLabel}</span></ComboboxOption> : null}
          {filtered.length ? filtered.map((item) => <ComboboxOption key={item} selected={item === value} onClick={() => choose(item)}>{renderItem ? renderItem(item) : itemLabel(item)}</ComboboxOption>) : <ComboboxEmpty>{emptyLabel}</ComboboxEmpty>}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
