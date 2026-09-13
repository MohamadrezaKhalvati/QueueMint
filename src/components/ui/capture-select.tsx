import * as React from "react"
import { createPortal } from "react-dom"
import { Check, ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

type CaptureSelectContextValue = {
  value?: string
  disabled: boolean
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  onValueChange?: (value: string) => void
  triggerRef: React.RefObject<HTMLButtonElement | null>
  labels: Record<string, string>
  registerLabel: (value: string, label: string) => void
}

const CaptureSelectContext = React.createContext<CaptureSelectContextValue | null>(null)

function useCaptureSelect() {
  const context = React.useContext(CaptureSelectContext)
  if (!context) throw new Error("CaptureSelect components must be used inside <Select>.")
  return context
}

function nodeText(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node)
  if (Array.isArray(node)) return node.map(nodeText).join(" ").replace(/\s+/g, " ").trim()
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) return nodeText(node.props.children)
  return ""
}

type SelectProps = {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  children: React.ReactNode
}

function Select({ value: controlledValue, defaultValue, onValueChange, disabled = false, children }: SelectProps) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue)
  const [open, setOpen] = React.useState(false)
  const [labels, setLabels] = React.useState<Record<string, string>>({})
  const triggerRef = React.useRef<HTMLButtonElement | null>(null)
  const value = controlledValue ?? uncontrolledValue

  const registerLabel = React.useCallback((itemValue: string, label: string) => {
    if (!label) return
    setLabels((current) => current[itemValue] === label ? current : { ...current, [itemValue]: label })
  }, [])

  const handleValueChange = React.useCallback((nextValue: string) => {
    if (controlledValue === undefined) setUncontrolledValue(nextValue)
    onValueChange?.(nextValue)
    setOpen(false)
    window.requestAnimationFrame(() => triggerRef.current?.focus())
  }, [controlledValue, onValueChange])

  React.useEffect(() => {
    if (disabled && open) setOpen(false)
  }, [disabled, open])

  return (
    <CaptureSelectContext.Provider value={{ value, disabled, open, setOpen, onValueChange: handleValueChange, triggerRef, labels, registerLabel }}>
      {children}
    </CaptureSelectContext.Provider>
  )
}

function SelectTrigger({ className, children, disabled: triggerDisabled, onClick, onKeyDown, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { disabled, open, setOpen, triggerRef } = useCaptureSelect()

  return (
    <button
      ref={triggerRef}
      type="button"
      data-slot="select-trigger"
      data-state={open ? "open" : "closed"}
      aria-haspopup="listbox"
      aria-expanded={open}
      disabled={disabled || triggerDisabled}
      className={cn(
        "flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-none outline-none transition-[color,box-shadow,border-color,background-color] hover:bg-accent/35 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 data-[state=open]:border-ring data-[state=open]:ring-[3px] data-[state=open]:ring-ring/15",
        className,
      )}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) setOpen((current) => !current)
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event)
        if (event.defaultPrevented) return
        if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          setOpen(true)
        }
        if (event.key === "Escape") setOpen(false)
      }}
      {...props}
    >
      <span className="min-w-0 flex-1 truncate text-start">{children}</span>
      <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
    </button>
  )
}

function SelectValue({ placeholder, className }: { placeholder?: React.ReactNode; className?: string }) {
  const { value, labels } = useCaptureSelect()
  const label = value ? labels[value] : ""
  const fallback = value && !value.startsWith("__") ? value : placeholder
  return <span className={cn("block min-w-0 truncate", className)}>{label || fallback}</span>
}

type FloatingPosition = {
  left: number
  width: number
  top?: number
  bottom?: number
  maxHeight: number
}

function SelectContent({ className, children }: { className?: string; children: React.ReactNode }) {
  const { open, setOpen, triggerRef, value } = useCaptureSelect()
  const contentRef = React.useRef<HTMLDivElement | null>(null)
  const [position, setPosition] = React.useState<FloatingPosition | null>(null)

  const updatePosition = React.useCallback(() => {
    const trigger = triggerRef.current
    if (!trigger) return

    const rect = trigger.getBoundingClientRect()
    const gap = 6
    const edge = 8
    const viewportWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0)
    const viewportHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
    const below = Math.max(0, viewportHeight - rect.bottom - gap - edge)
    const above = Math.max(0, rect.top - gap - edge)
    const openUpward = below < 180 && above > below
    const available = openUpward ? above : below
    const maxHeight = Math.max(72, Math.min(320, available || 72))
    const width = Math.min(Math.max(rect.width, 180), Math.max(180, viewportWidth - edge * 2))
    const left = Math.min(Math.max(edge, rect.left), Math.max(edge, viewportWidth - width - edge))

    setPosition(openUpward
      ? { left, width, bottom: Math.max(edge, viewportHeight - rect.top + gap), maxHeight }
      : { left, width, top: Math.max(edge, rect.bottom + gap), maxHeight })
  }, [triggerRef])

  React.useLayoutEffect(() => {
    if (!open) return
    updatePosition()
    const onViewportChange = () => updatePosition()
    window.addEventListener("resize", onViewportChange)
    window.addEventListener("scroll", onViewportChange, true)
    return () => {
      window.removeEventListener("resize", onViewportChange)
      window.removeEventListener("scroll", onViewportChange, true)
    }
  }, [open, updatePosition])

  React.useEffect(() => {
    if (!open) return

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null
      if (target && (contentRef.current?.contains(target) || triggerRef.current?.contains(target))) return
      setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        setOpen(false)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener("pointerdown", onPointerDown, true)
    document.addEventListener("keydown", onKeyDown, true)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true)
      document.removeEventListener("keydown", onKeyDown, true)
    }
  }, [open, setOpen, triggerRef])

  React.useEffect(() => {
    if (!open || !contentRef.current) return
    const selected = contentRef.current.querySelector<HTMLElement>(`[data-capture-select-item][aria-selected="true"]`)
    const first = contentRef.current.querySelector<HTMLElement>("[data-capture-select-item]:not([data-disabled='true'])")
    window.requestAnimationFrame(() => (selected ?? first)?.focus({ preventScroll: true }))
  }, [open, value, position])

  const body = typeof document !== "undefined" ? document.body : null

  if (!open || !body) {
    return <div hidden aria-hidden="true">{children}</div>
  }

  return createPortal(
    <div
      ref={contentRef}
      data-slot="select-content"
      role="listbox"
      className={cn(
        "fixed z-[2147483000] overflow-y-auto overscroll-contain rounded-xl border bg-popover p-1.5 text-popover-foreground shadow-xl outline-none",
        className,
      )}
      style={position ? {
        left: `${position.left}px`,
        width: `${position.width}px`,
        top: position.top === undefined ? undefined : `${position.top}px`,
        bottom: position.bottom === undefined ? undefined : `${position.bottom}px`,
        maxHeight: `${position.maxHeight}px`,
      } : { visibility: "hidden" }}
      onKeyDown={(event) => {
        if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return
        event.preventDefault()
        const items = Array.from(contentRef.current?.querySelectorAll<HTMLElement>("[data-capture-select-item]:not([data-disabled='true'])") ?? [])
        if (!items.length) return
        const currentIndex = items.indexOf(document.activeElement as HTMLElement)
        const delta = event.key === "ArrowDown" ? 1 : -1
        const nextIndex = currentIndex < 0 ? 0 : (currentIndex + delta + items.length) % items.length
        items[nextIndex]?.focus({ preventScroll: true })
        items[nextIndex]?.scrollIntoView({ block: "nearest" })
      }}
    >
      {children}
    </div>,
    body,
  )
}

type SelectItemProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "value"> & {
  value: string
  children: React.ReactNode
}

function SelectItem({ className, children, value, disabled, onClick, onKeyDown, ...props }: SelectItemProps) {
  const { value: selectedValue, onValueChange, registerLabel } = useCaptureSelect()
  const selected = selectedValue === value
  const label = React.useMemo(() => nodeText(children), [children])

  React.useEffect(() => {
    registerLabel(value, label)
  }, [label, registerLabel, value])

  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      data-capture-select-item=""
      data-disabled={disabled ? "true" : "false"}
      disabled={disabled}
      className={cn(
        "relative flex min-h-9 w-full select-none items-center gap-2 rounded-lg px-2.5 py-2 pe-8 text-start text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground disabled:pointer-events-none disabled:opacity-50",
        selected && "bg-accent/65 text-accent-foreground",
        className,
      )}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented && !disabled) onValueChange?.(value)
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event)
        if (event.defaultPrevented || disabled) return
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onValueChange?.(value)
        }
      }}
      {...props}
    >
      <span className="min-w-0 flex-1">{children}</span>
      {selected ? <Check className="absolute end-2 size-4 text-primary" /> : null}
    </button>
  )
}

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue }
