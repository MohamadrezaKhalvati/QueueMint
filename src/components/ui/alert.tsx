import * as React from "react"

import { cn } from "@/lib/utils"

function Alert({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="alert" role="alert" className={cn("relative grid w-full grid-cols-[0_1fr] items-start gap-y-0.5 rounded-lg border px-4 py-3 text-sm has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] has-[>svg]:gap-x-3 [&>svg]:size-4 [&>svg]:translate-y-0.5", className)} {...props} />
}

export { Alert }
