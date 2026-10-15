"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * ID cards: scan at the desk (everyone who marks attendance), and — for
 * admins — the cards themselves. A card names its student, and the scan
 * records that student's own section for today.
 */
import { useState } from "react"

import { useDictionary } from "@/components/internationalization/use-dictionary"
import { Segmented } from "@/components/school-dashboard/school/configuration/ui/segmented"

import { AttendanceSectionNav } from "../ui/section-nav"
import { BarcodeScanner } from "./barcode-scanner"
import { StudentCards } from "./student-cards"

interface Props {
  locale?: string
  /** Card management is admin-only (identifiers map students to tokens). */
  canManageCards?: boolean
}

export default function BarcodeAttendanceContent({
  locale = "ar",
  canManageCards = false,
}: Props) {
  const { dictionary } = useDictionary()
  const t = (dictionary?.attendanceTake?.barcode ?? {}) as Record<
    string,
    string
  >
  const [view, setView] = useState<"scan" | "cards">("scan")

  return (
    <div className="space-y-6">
      <AttendanceSectionNav group="take" />
      {canManageCards ? (
        <Segmented
          value={view}
          onValueChange={setView}
          options={[
            { value: "scan", label: t.scanTab ?? "Scan" },
            { value: "cards", label: t.cardsTab ?? "Cards" },
          ]}
          aria-label={t.view ?? "View"}
        />
      ) : null}
      {view === "cards" && canManageCards ? (
        <StudentCards t={t} lang={locale} />
      ) : (
        <BarcodeScanner t={t} lang={locale} />
      )}
    </div>
  )
}
