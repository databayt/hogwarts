"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect } from "react"

import type { Dictionary } from "@/components/internationalization/dictionaries"
import { PlacementDialog } from "@/components/school-dashboard/admission/placement-dialog"

import {
  closePlacementDialog,
  ensurePlacementSections,
  usePlacementDialogState,
} from "./placement-store"

/**
 * The admission block's PlacementDialog, driven by the students-list store —
 * one dialog for every intake channel. The admission block renders the same
 * component from the Enrollment tab for PORTAL admits; this renders it for a
 * direct-admit or imported student who has a grade but no seat.
 */
export function StudentPlacementDialog({
  dictionary,
  onPlaced,
}: {
  dictionary: Dictionary["school"]["admission"]
  onPlaced?: () => void
}) {
  const { open, student, sections, isLoading, loaded } =
    usePlacementDialogState()

  // Remount-safe: no-ops while the sections exist or a fetch is in flight.
  useEffect(() => {
    if (open && student && !loaded && !isLoading) {
      void ensurePlacementSections()
    }
  }, [open, student, loaded, isLoading])

  if (!open || !student) return null

  return (
    <PlacementDialog
      studentId={student.id}
      applicantName={student.name}
      applyingForClass={student.gradeName ?? undefined}
      gradeId={student.academicGradeId}
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
