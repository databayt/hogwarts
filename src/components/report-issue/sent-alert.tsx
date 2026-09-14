// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "radix-ui"

/** How long the confirmation stays up before it dismisses itself. */
const AUTO_DISMISS_MS = 2500

interface ReportSentAlertProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dir: "ltr" | "rtl"
  title: string
  body: string
}

/**
 * The phone's "report sent" confirmation (#415), drawn in the shape of the
 * library's borrow / return alert (`library/book-detail/borrow-alert.tsx`):
 * a small glass card, no overlay tint, no button. It dismisses itself after
 * `AUTO_DISMISS_MS`, on an outside tap or on Escape, and leaves the reporter
 * on the page they reported from. Copied rather than imported so the report
 * dialog stays a self-contained block that kun can sync.
 *
 * Focus is not returned to the trigger on close: the trigger sits in the page
 * footer, and moving focus there would scroll the page away from where the
 * reporter was reading.
 */
export function ReportSentAlert({
  open,
  onOpenChange,
  dir,
  title,
  body,
}: ReportSentAlertProps) {
  React.useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => onOpenChange(false), AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [open, onOpenChange])

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-transparent" />
        <DialogPrimitive.Content
          dir={dir}
          onCloseAutoFocus={(e) => e.preventDefault()}
          className="bg-muted/85 text-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-90 data-[state=closed]:zoom-out-95 fixed inset-0 z-50 m-auto flex h-fit w-[250px] max-w-[calc(100%-2rem)] flex-col items-center rounded-[28px] px-6 pt-[41px] pb-[41px] text-center shadow-[0_8px_48px_rgba(0,0,0,0.25),0_0_0_0.5px_rgba(0,0,0,0.12)] backdrop-blur-[30px] duration-200 outline-none"
        >
          <svg
            viewBox="0 0 57 57"
            className="text-foreground/65 size-[57px] shrink-0"
            fill="none"
            aria-hidden
          >
            <circle cx="28.5" cy="28.5" r="27" fill="currentColor" />
            <path
              d="M17 29.5l8 8 16-17"
              className="stroke-muted"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          <DialogPrimitive.Title className="mt-[33px] text-[24px] leading-[30px] font-bold">
            {title}
          </DialogPrimitive.Title>

          <DialogPrimitive.Description className="mt-[11px] text-[17px] leading-6">
            {body}
          </DialogPrimitive.Description>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
