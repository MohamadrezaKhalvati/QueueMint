import { Fragment, useEffect, useMemo, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { Command, Search, Star } from "lucide-react"

import { cn } from "@/lib/utils"

export type CommandPaletteItem = {
  id: string
  label: string
  description?: string
  keywords?: string
  shortcut?: string
  group?: string
  icon?: ReactNode
  disabled?: boolean
  favorite?: boolean
  onToggleFavorite?: () => void
  onSelect: () => void
}

function nextEnabledIndex(items: CommandPaletteItem[], start: number, direction: 1 | -1) {
  if (!items.length) return 0
  for (let offset = 1; offset <= items.length; offset += 1) {
    const index = (start + direction * offset + items.length) % items.length
    if (!items[index]?.disabled) return index
  }
  return start
}

function edgeEnabledIndex(items: CommandPaletteItem[], fromEnd = false) {
  const indices = Array.from({ length: items.length }, (_, index) => index)
  if (fromEnd) indices.reverse()
  return indices.find((index) => !items[index]?.disabled) ?? 0
}

export function CommandPalette({
  open,
  onOpenChange,
  items,
  title,
  placeholder,
  emptyLabel,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: CommandPaletteItem[]
  title: string
  placeholder: string
  emptyLabel: string
}) {
  const [query, setQuery] = useState("")
  const [activeIndex, setActiveIndex] = useState(0)

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase()
    if (!needle) return items
    const tokens = needle.split(/\s+/).filter(Boolean)
    return items.filter((item) => {
      const haystack = `${item.label} ${item.description ?? ""} ${item.keywords ?? ""} ${item.group ?? ""}`.toLocaleLowerCase()
      return tokens.every((token) => haystack.includes(token))
    })
  }, [items, query])

  useEffect(() => {
    if (!open) return
    setQuery("")
    setActiveIndex(edgeEnabledIndex(items))
  }, [open])

  useEffect(() => {
    if (!filtered.length) { setActiveIndex(0); return }
    if (activeIndex >= filtered.length || filtered[activeIndex]?.disabled) setActiveIndex(edgeEnabledIndex(filtered))
  }, [activeIndex, filtered])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); onOpenChange(false); return }
      if (event.key === "ArrowDown") { event.preventDefault(); setActiveIndex((current) => nextEnabledIndex(filtered, current, 1)); return }
      if (event.key === "ArrowUp") { event.preventDefault(); setActiveIndex((current) => nextEnabledIndex(filtered, current, -1)); return }
      if (event.key === "Home") { event.preventDefault(); setActiveIndex(edgeEnabledIndex(filtered)); return }
      if (event.key === "End") { event.preventDefault(); setActiveIndex(edgeEnabledIndex(filtered, true)); return }
      if (event.key === "Enter") {
        const item = filtered[activeIndex]
        if (!item || item.disabled) return
        event.preventDefault(); onOpenChange(false); item.onSelect()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [activeIndex, filtered, onOpenChange, open])

  if (!open || typeof document === "undefined") return null

  return createPortal(
    <div className="fixed inset-0 z-[2147483646] flex items-start justify-center bg-black/35 px-4 pt-[12vh] backdrop-blur-[2px]" onMouseDown={() => onOpenChange(false)}>
      <div role="dialog" aria-modal="true" aria-label={title} className="w-full max-w-[640px] overflow-hidden rounded-[var(--qm-panel-radius)] border bg-popover text-popover-foreground shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-center gap-3 border-b px-4 py-3">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input autoFocus value={query} onChange={(event) => { setQuery(event.target.value); setActiveIndex(0) }} placeholder={placeholder} aria-label={placeholder} className="h-8 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
          <kbd className="rounded-[var(--qm-control-radius)] border bg-muted/40 px-1.5 py-0.5 text-[10px] text-muted-foreground">Esc</kbd>
        </div>
        <div role="listbox" aria-label={title} className="max-h-[min(62vh,520px)] overflow-y-auto p-2">
          {filtered.length ? filtered.map((item, index) => {
            const showGroup = Boolean(item.group && item.group !== filtered[index - 1]?.group)
            return (
              <Fragment key={item.id}>
                {showGroup ? <div className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground first:pt-1">{item.group}</div> : null}
                <div role="option" aria-selected={index === activeIndex} className={cn("group flex w-full items-center rounded-[var(--qm-panel-radius)] transition-colors", index === activeIndex && "bg-accent text-accent-foreground", item.disabled && "opacity-45")} onMouseEnter={() => !item.disabled && setActiveIndex(index)}>
                  <button type="button" disabled={item.disabled} onClick={() => { if (!item.disabled) { onOpenChange(false); item.onSelect() } }} className={cn("flex min-w-0 flex-1 items-center gap-3 rounded-[var(--qm-panel-radius)] px-3 py-2.5 text-start outline-none", item.disabled && "cursor-not-allowed")}>
                    <span className="grid size-9 shrink-0 place-items-center rounded-[var(--qm-control-radius)] border bg-background text-muted-foreground">{item.icon ?? <Command className="size-4" />}</span>
                    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{item.label}</span>{item.description ? <span className="mt-0.5 block truncate text-xs text-muted-foreground">{item.description}</span> : null}</span>
                    {item.shortcut ? <kbd className="shrink-0 rounded-[var(--qm-control-radius)] border bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground">{item.shortcut}</kbd> : null}
                  </button>
                  {item.onToggleFavorite ? <button type="button" onClick={(event) => { event.stopPropagation(); item.onToggleFavorite?.() }} className="me-2 grid size-8 shrink-0 place-items-center rounded-[var(--qm-control-radius)] text-muted-foreground outline-none hover:bg-background/70 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring" aria-label={item.favorite ? `Remove ${item.label} from favorites` : `Add ${item.label} to favorites`} title={item.favorite ? "Remove favorite" : "Add favorite"}><Star className={cn("size-4", item.favorite && "fill-current text-warning")} /></button> : null}
                </div>
              </Fragment>
            )
          }) : <div className="grid min-h-28 place-items-center px-4 text-center text-sm text-muted-foreground">{emptyLabel}</div>}
        </div>
        <div className="flex items-center gap-2 border-t bg-muted/15 px-4 py-2 text-[10px] text-muted-foreground"><Command className="size-3" /><span>{title}</span><span className="ms-auto">↑↓ · Home/End · Enter</span></div>
      </div>
    </div>,
    document.body,
  )
}
