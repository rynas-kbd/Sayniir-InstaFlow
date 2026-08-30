"use client"

import * as React from "react"
import { Dialog as SheetPrimitive } from "@base-ui/react/dialog"
import { motion, useDragControls } from "framer-motion"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useDragDismiss } from "@/lib/motion/use-drag-dismiss"
import { XIcon } from "lucide-react"

function Sheet({ ...props }: SheetPrimitive.Root.Props) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({ ...props }: SheetPrimitive.Trigger.Props) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({ ...props }: SheetPrimitive.Close.Props) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({ ...props }: SheetPrimitive.Portal.Props) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({ className, ...props }: SheetPrimitive.Backdrop.Props) {
  return (
    <SheetPrimitive.Backdrop
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-[100] bg-black/30 transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-backdrop-filter:backdrop-blur-sm",
        className
      )}
      {...props}
    />
  )
}

type SheetSide = "top" | "right" | "bottom" | "left" | "inline-start" | "inline-end"

// Base UI's Dialog primitive has no concept of "side" — it's implemented
// here as plain physical `data-[side=left/right]` CSS, and Base UI's
// DirectionProvider (wired in components/i18n-provider.tsx) doesn't reach
// it either. Resolving "inline-start"/"inline-end" here — by reading `dir`
// directly off <html> instead of via useLocale()/useT() — means this stays
// usable from routes with no I18nProvider mounted (e.g. the marketing
// navbar's mobile sheet), which would otherwise throw.
function resolvePhysicalSide(side: SheetSide): "top" | "right" | "bottom" | "left" {
  if (side !== "inline-start" && side !== "inline-end") return side
  const isRtl = typeof document !== "undefined" && document.documentElement.dir === "rtl"
  if (side === "inline-start") return isRtl ? "right" : "left"
  return isRtl ? "left" : "right"
}

function SheetContent({
  className,
  children,
  side: sideProp = "right",
  showCloseButton = true,
  ...props
}: SheetPrimitive.Popup.Props & {
  side?: SheetSide
  showCloseButton?: boolean
}) {
  const side = resolvePhysicalSide(sideProp)
  // Only bottom sheets get a drag handle for now — that's the one side
  // actually used with tall, scrollable content (flow-canvas.tsx) in this
  // app, so the drag gesture is scoped to a small handle instead of the
  // whole popup to avoid fighting that content's own scroll.
  const isBottomSheet = side === "bottom"
  const closeRef = React.useRef<HTMLButtonElement>(null)
  const dragControls = useDragControls()
  const dragDismiss = useDragDismiss({
    onDismiss: () => closeRef.current?.click(),
  })

  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Popup
        data-slot="sheet-content"
        data-side={side}
        className={cn(
          "fixed z-[100] flex flex-col gap-4 bg-clip-padding text-sm text-popover-foreground shadow-2xl transition duration-200 ease-in-out data-ending-style:opacity-0 data-starting-style:opacity-0 data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-0 data-[side=bottom]:h-auto data-[side=bottom]:border-t data-[side=bottom]:data-ending-style:translate-y-[2.5rem] data-[side=bottom]:data-starting-style:translate-y-[2.5rem] data-[side=left]:inset-y-0 data-[side=left]:left-0 data-[side=left]:h-full data-[side=left]:w-3/4 data-[side=left]:border-r data-[side=left]:data-ending-style:translate-x-[-2.5rem] data-[side=left]:data-starting-style:translate-x-[-2.5rem] data-[side=right]:inset-y-0 data-[side=right]:right-0 data-[side=right]:h-full data-[side=right]:w-3/4 data-[side=right]:border-l data-[side=right]:data-ending-style:translate-x-[2.5rem] data-[side=right]:data-starting-style:translate-x-[2.5rem] data-[side=top]:inset-x-0 data-[side=top]:top-0 data-[side=top]:h-auto data-[side=top]:border-b data-[side=top]:data-ending-style:translate-y-[-2.5rem] data-[side=top]:data-starting-style:translate-y-[-2.5rem] data-[side=left]:sm:max-w-sm data-[side=right]:sm:max-w-sm",
          className
        )}
        style={{
          background: 'color-mix(in srgb, var(--organic-bg) 90%, transparent)',
          backdropFilter: 'blur(24px) saturate(1.6)',
          borderColor: 'color-mix(in srgb, var(--organic-sand-300) 40%, transparent)',
        }}
        {...props}
      >
        {isBottomSheet ? (
          <motion.div
            {...dragDismiss}
            dragListener={false}
            dragControls={dragControls}
            className="flex min-h-0 flex-1 flex-col gap-4"
          >
            <div
              onPointerDown={(event) => dragControls.start(event)}
              className="mx-auto -mt-1 h-1 w-10 shrink-0 cursor-grab touch-none rounded-full bg-foreground/15 active:cursor-grabbing"
              aria-hidden="true"
            />
            {children}
          </motion.div>
        ) : (
          children
        )}
        <SheetPrimitive.Close
          ref={closeRef}
          data-slot="sheet-drag-close-trigger"
          className="hidden"
          aria-hidden="true"
          tabIndex={-1}
        />
        {showCloseButton && (
          <SheetPrimitive.Close
            data-slot="sheet-close"
            render={
              <Button
                variant="ghost"
                className="absolute top-3 end-3"
                size="icon-sm"
              />
            }
          >
            <XIcon
            />
            <span className="sr-only">Fermer</span>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Popup>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-0.5 p-4", className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  )
}

function SheetTitle({ className, ...props }: SheetPrimitive.Title.Props) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn(
        "font-heading text-base font-normal text-foreground",
        className
      )}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: SheetPrimitive.Description.Props) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
