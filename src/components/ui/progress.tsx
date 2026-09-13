import { cn } from "@/lib/utils"

function Progress({ value, className }: { value: number; className?: string }) {
  const bounded = Math.max(0, Math.min(100, value))
  return (
    <div data-slot="progress" className={cn("relative h-2 w-full overflow-hidden rounded-full bg-primary/15", className)}>
      <div data-slot="progress-indicator" className="h-full w-full flex-1 bg-primary transition-transform duration-300" style={{ transform: `translateX(-${100 - bounded}%)` }} />
    </div>
  )
}

export { Progress }
