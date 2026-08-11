"use client"

import * as React from "react"

import { useMediaQuery } from "@/lib/use-media-query"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

const MOBILE_QUERY = "(max-width: 767px)"

/**
 * Dialog on desktop, bottom Sheet on mobile — for forms that are fine as a
 * centered modal on a wide screen but become a cramped ~343px-wide box on a
 * phone (rule-form-dialog, product-form-dialog, campaign-form-dialog were
 * all doing this before). Root/Trigger/Close are the same component either
 * way: Sheet and Dialog both wrap the identical base-ui Dialog primitive
 * (see components/ui/{dialog,sheet}.tsx) — only the popup chrome differs,
 * so only *Content/*Header/*Footer/*Title/*Description need to branch.
 */
const ResponsiveDialog = Dialog
const ResponsiveDialogTrigger = DialogTrigger
const ResponsiveDialogClose = DialogClose

function ResponsiveDialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogContent>) {
  const isMobile = useMediaQuery(MOBILE_QUERY)

  if (isMobile) {
    return (
      <SheetContent
        side="bottom"
        className={cn("max-h-[85dvh] overflow-y-auto", className)}
        {...props}
      >
        {children}
      </SheetContent>
    )
  }

  return (
    <DialogContent className={className} {...props}>
      {children}
    </DialogContent>
  )
}

function ResponsiveDialogHeader(props: React.ComponentProps<typeof DialogHeader>) {
  const isMobile = useMediaQuery(MOBILE_QUERY)
  return isMobile ? <SheetHeader {...props} /> : <DialogHeader {...props} />
}

function ResponsiveDialogFooter(props: React.ComponentProps<typeof DialogFooter>) {
  const isMobile = useMediaQuery(MOBILE_QUERY)
  return isMobile ? <SheetFooter {...props} /> : <DialogFooter {...props} />
}

function ResponsiveDialogTitle(props: React.ComponentProps<typeof DialogTitle>) {
  const isMobile = useMediaQuery(MOBILE_QUERY)
  return isMobile ? <SheetTitle {...props} /> : <DialogTitle {...props} />
}

function ResponsiveDialogDescription(props: React.ComponentProps<typeof DialogDescription>) {
  const isMobile = useMediaQuery(MOBILE_QUERY)
  return isMobile ? <SheetDescription {...props} /> : <DialogDescription {...props} />
}

export {
  ResponsiveDialog,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
}
