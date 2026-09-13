import { useRef, type ChangeEvent } from "react"
import { Bold, Code2, Italic, Link, List, ListOrdered, Quote } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  minHeight?: number
  helpText?: string
}

export function RichTextEditor({ value, onChange, placeholder, className, minHeight = 170, helpText }: RichTextEditorProps) {
  const ref = useRef<HTMLTextAreaElement>(null)

  function replaceSelection(prefix: string, suffix = prefix, fallback = "text") {
    const element = ref.current
    if (!element) return
    const start = element.selectionStart ?? value.length
    const end = element.selectionEnd ?? value.length
    const selected = value.slice(start, end) || fallback
    const next = `${value.slice(0, start)}${prefix}${selected}${suffix}${value.slice(end)}`
    onChange(next)
    window.requestAnimationFrame(() => {
      element.focus()
      element.setSelectionRange(start + prefix.length, start + prefix.length + selected.length)
    })
  }

  function prefixLines(prefix: string) {
    const element = ref.current
    if (!element) return
    const start = element.selectionStart ?? 0
    const end = element.selectionEnd ?? value.length
    const selected = value.slice(start, end) || "item"
    const replacement = selected.split("\n").map((line) => `${prefix}${line}`).join("\n")
    onChange(`${value.slice(0, start)}${replacement}${value.slice(end)}`)
  }

  const tools = [
    { label: "Bold", icon: Bold, action: () => replaceSelection("*", "*", "bold") },
    { label: "Italic", icon: Italic, action: () => replaceSelection("_", "_", "italic") },
    { label: "Bullet list", icon: List, action: () => prefixLines("* ") },
    { label: "Numbered list", icon: ListOrdered, action: () => prefixLines("# ") },
    { label: "Quote", icon: Quote, action: () => prefixLines("bq. ") },
    { label: "Code", icon: Code2, action: () => replaceSelection("{{", "}}", "code") },
    { label: "Link", icon: Link, action: () => replaceSelection("[", "|https://example.com]", "label") },
  ]

  return (
    <div className={cn("overflow-hidden rounded-xl border bg-background", className)}>
      <div className="flex flex-wrap items-center gap-1 border-b bg-muted/35 p-1.5">
        {tools.map(({ label, icon: Icon, action }) => (
          <Button key={label} variant="ghost" size="icon-sm" onClick={action} aria-label={label} title={label}>
            <Icon className="size-4" />
          </Button>
        ))}
        {helpText ? <span className="ms-auto hidden px-2 text-[11px] text-muted-foreground sm:inline">{helpText}</span> : null}
      </div>
      <Textarea
        ref={ref}
        value={value}
        onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onChange(event.target.value)}
        placeholder={placeholder}
        className="resize-y rounded-none border-0 bg-transparent px-3 py-3 leading-7 shadow-none focus-visible:ring-0"
        style={{ minHeight }}
      />
    </div>
  )
}
