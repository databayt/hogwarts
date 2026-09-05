"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect } from "react"

import type { Dictionary } from "@/components/internationalization/dictionaries"

import { PlacementDialog } from "./placement-dialog"
import {
  closePlacementDialog,
  ensurePlacementSections,
  usePlacementDialogState,
} from "./placement-store"

/**
 * Mount ONCE per listing table (Enrollment tab, students list). Row actions
 * call `openPlacementDialog(target)`; this renders the shared PlacementDialog
 * from the store so a table remount cannot close it.
 */
export function PlacementDialogHost({
  dictionary,
  onPlaced,
}: {
  dictionary: Dictionary["school"]["admission"]
  onPlaced?: () => void
}) {
  const { open, target, sections, isLoading, loaded } =
    usePlacementDialogState()

  // Remount-safe: no-ops while the sections exist or a fetch is in flight.
  useEffect(() => {
    if (open && target && !loaded && !isLoading) {
      void ensurePlacementSections()
    }
  }, [open, target, loaded, isLoading])

  if (!open || !target) return null

  return (
    <PlacementDialog
      applicationId={target.applicationId}
      studentId={target.studentId}
      applicantName={target.name}
      applyingForClass={target.applyingForClass ?? undefined}
      gradeId={target.gradeId}
      sections={sections}
      sectionsLoading={!loaded}
      open
      onOpenChange={(next) => {
        if (!next) closePlacementDialog()
      }}
      dictionary={dictionary}
      onPlaced={onPlaced}
    />
  )
}
