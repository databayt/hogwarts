"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { AlertDialog as AlertDialogPrimitive } from "radix-ui"

import {
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogPortal,
} from "@/components/ui/alert-dialog"

export type BorrowNotice = {
  tone: "success" | "error"
  title: string
  body: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Kept by the caller after close, so the card doesn't empty mid-fade. */
  notice: BorrowNotice | null
  confirmLabel: string
}

/**
 * The borrow / return confirmation, drawn as Apple Books' "Added" alert
 * (`public/books-app/IMG_2575.png`). Replaces the sonner toasts this row used
 * to fire: a toast in the corner of a phone screen is gone before it is read,
 * and borrowing is a promise with a date on it.
 *
 * Every size here was measured off the 3x capture at 390pt, not taken from
 * blueprint §4 — its 300 wide is wrong, the card spans x 71→319, so 248:
 *   card 250 wide, radius 28, fill #f7f7f7 glass (`bg-muted/85` + blur 30)
 *   41 top → 57 icon → 33 → title → 11 → 24px body lines → 10 → 44 button → 13
 *
 * The page behind the capture measures pure white, so there is NO dimming
 * overlay — the card's shadow is what lifts it. The overlay still renders,
 * transparent, because it is what blocks clicks on the page behind.
 *
 * No `font-serif` on the title even though the reference is serif: under `ar`
 * that hands Arabic Georgia, which has no Arabic glyphs (see library/CLAUDE.md).
 */
export function BorrowAlert({
  open,
  onOpenChange,
  notice,
  confirmLabel,
}: Props) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogPortal>
        <AlertDialogOverlay className="bg-transparent" />
        <AlertDialogPrimitive.Content
          // `inset-0 m-auto h-fit` centres without a translate, so the
          // zoom-in keyframes own `transform` outright and nothing needs an
          // RTL counter-translate.
          className="bg-muted/85 text-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-90 data-[state=closed]:zoom-out-95 fixed inset-0 z-50 m-auto flex h-fit w-[250px] max-w-[calc(100%-2rem)] flex-col items-center rounded-[28px] px-6 pt-[41px] pb-[13px] text-center shadow-[0_8px_48px_rgba(0,0,0,0.25),0_0_0_0.5px_rgba(0,0,0,0.12)] backdrop-blur-[30px] duration-200 outline-none"
        >
          {notice?.tone === "error" ? <ErrorGlyph /> : <CheckListGlyph />}

          <AlertDialogPrimitive.Title className="mt-[33px] text-[24px] leading-[30px] font-bold">
            {notice?.title}
          </AlertDialogPrimitive.Title>

          <AlertDialogPrimitive.Description className="mt-[11px] text-[17px] leading-6">
            {notice?.body}
          </AlertDialogPrimitive.Description>

          {/* A bare word, no separator and no fill — the reference's GOT IT.
              Radix's Action is unstyled and closes the dialog on its own. */}
          <AlertDialogPrimitive.Action className="hover:bg-foreground/5 focus-visible:bg-foreground/5 mt-[10px] h-11 w-full rounded-full text-[17px] font-semibold tracking-[0.04em] uppercase transition-colors outline-none">
            {confirmLabel}
          </AlertDialogPrimitive.Action>
        </AlertDialogPrimitive.Content>
      </AlertDialogPortal>
    </AlertDialog>
  )
}

/**
 * `text.badge.checkmark`, traced from the capture at its measured 61×57pt —
 * SF Symbols can't ship in a web app. A filled disc with the tick knocked out,
 * two short rules beside it, two full rules under it. Mirrored in RTL, as the
 * symbol is, so the rules still trail the disc — except the tick itself.
 */
function CheckListGlyph() {
  return (
    <svg
      viewBox="0 0 61 57"
      className="text-foreground/65 h-[57px] w-[61px] shrink-0 rtl:-scale-x-100"
      fill="none"
      aria-hidden
    >
      <circle cx="15" cy="15" r="15" fill="currentColor" />
      {/* Flipped back on its own box: the layout mirrors, a tick never does —
          reversed it reads as a chevron. */}
      <path
        d="M8.5 15.5l4.5 4.5 9-9"
        className="stroke-muted origin-center [transform-box:fill-box] rtl:-scale-x-100"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <g stroke="currentColor" strokeWidth="3.4" strokeLinecap="round">
        <path d="M37.5 7.6h21.8M37.5 21.9h21.8M1.7 39.2h57.6M1.7 54.4h57.6" />
      </g>
    </svg>
  )
}

/** The same disc with an exclamation, for a borrow or return that failed. */
function ErrorGlyph() {
  return (
    <svg
      viewBox="0 0 57 57"
      className="text-foreground/65 size-[57px] shrink-0"
      fill="none"
      aria-hidden
    >
      <circle cx="28.5" cy="28.5" r="27" fill="currentColor" />
      <path
        d="M28.5 15v17"
        className="stroke-muted"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <circle cx="28.5" cy="41.5" r="2.8" className="fill-muted" />
    </svg>
  )
}
