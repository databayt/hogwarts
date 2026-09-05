"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import type { Dictionary } from "@/components/internationalization/dictionaries"

/**
 * Statuses that ask the reviewer for an optional note before they apply.
 * A rejection or a waitlist with no "why" is what families phone the office
 * about — the note travels in their notice and on the status tracker.
 */
export const STATUSES_WITH_REASON: ReadonlySet<string> = new Set([
  "REJECTED",
  "WAITLISTED",
])

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Localized label of the status about to be applied. */
  statusLabel: string
  dictionary: Dictionary["school"]["admission"]
  isPending?: boolean
  onConfirm: (reason: string) => void
}

export function StatusReasonDialog({
  open,
  onOpenChange,
  statusLabel,
  dictionary,
  isPending = false,
  onConfirm,
}: Props) {
  const t = dictionary
  const [reason, setReason] = useState("")

  // A fresh note every time the dialog opens — never a leftover from the
  // previous applicant.
  useEffect(() => {
    if (!open) setReason("")
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t?.applications?.reasonTitle || "Add a note for the family"}
          </DialogTitle>
          <DialogDescription>
            {statusLabel}
            {" — "}
            {t?.applications?.reasonDescription ||
              "Optional. It is included in the notice the family receives and shown on their status page."}
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder={
            t?.applications?.reasonPlaceholder ||
            "e.g. Places in this grade are full this year."
          }
          maxLength={1000}
          rows={4}
          aria-label={
            t?.applications?.reasonTitle || "Add a note for the family"
          }
        />
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            {t?.toolbar?.cancel || "Cancel"}
          </Button>
          <Button onClick={() => onConfirm(reason)} disabled={isPending}>
            {t?.applications?.confirmStatus || "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
