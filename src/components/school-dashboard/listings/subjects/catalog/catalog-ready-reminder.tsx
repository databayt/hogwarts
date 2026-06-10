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

interface Props {
  schoolId: string
  pinnedSubjects: Array<{ id: string; name: string }>
  strings: {
    title: string
    body: string
    dismiss: string
  }
}

const storageKey = (schoolId: string) => `catalog-ready-dismissed:${schoolId}`

function readDismissed(schoolId: string): string[] {
  try {
    const raw = localStorage.getItem(storageKey(schoolId))
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed)
      ? parsed.filter((v) => typeof v === "string")
      : []
  } catch {
    return []
  }
}

/**
 * One-time reminder dialog: a subject this school requested was approved and
 * is ready to add. Shows once per newly approved subject (dismissal stored in
 * localStorage); the persistent pinned section in the picker is independent
 * of this dialog and stays until the subject is actually added.
 */
export function CatalogReadyReminder({
  schoolId,
  pinnedSubjects,
  strings,
}: Props) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const dismissed = readDismissed(schoolId)
    if (!pinnedSubjects.some((s) => !dismissed.includes(s.id))) return
    // Deferred so the dialog opens after hydration paint (also satisfies
    // react-hooks/set-state-in-effect).
    const timer = setTimeout(() => setOpen(true), 0)
    return () => clearTimeout(timer)
  }, [schoolId, pinnedSubjects])

  function dismiss() {
    try {
      const dismissed = readDismissed(schoolId)
      const union = [
        ...new Set([...dismissed, ...pinnedSubjects.map((s) => s.id)]),
      ]
      localStorage.setItem(storageKey(schoolId), JSON.stringify(union))
    } catch {
      // localStorage unavailable — the dialog will simply show again next visit
    }
    setOpen(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) dismiss()
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{strings.title}</DialogTitle>
          <DialogDescription>{strings.body}</DialogDescription>
        </DialogHeader>
        <ul className="list-disc space-y-1 ps-5 text-sm">
          {pinnedSubjects.map((s) => (
            <li key={s.id}>{s.name}</li>
          ))}
        </ul>
        <DialogFooter>
          <Button onClick={dismiss}>{strings.dismiss}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
