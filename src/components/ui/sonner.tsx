import { createPortal } from "react-dom"
import { Toaster as Sonner, type ToasterProps } from "sonner"

function Toaster(props: ToasterProps) {
  const toaster = (
    <Sonner
      position="top-center"
      style={{ zIndex: 2147483647 }}
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: "!rounded-xl !border-border !bg-popover !text-popover-foreground !shadow-lg",
          description: "!text-muted-foreground",
          actionButton: "!bg-primary !text-primary-foreground",
          cancelButton: "!bg-muted !text-muted-foreground",
        },
      }}
      {...props}
    />
  )

  // Sheets and dialogs are portalled to <body>. QueueMint's application root is
  // intentionally isolated as its own stacking context, so keeping Sonner inside
  // that root can put notifications below a Sheet overlay even with a huge z-index.
  // Portal the toaster to body as well, then give it the topmost application layer.
  return typeof document === "undefined" ? toaster : createPortal(toaster, document.body)
}

export { Toaster }
