// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import type { Locale } from "@/components/internationalization/config"

interface Props {
  childId: string
  lang: Locale
}

type TabKey =
  | "overview"
  | "grades"
  | "report-cards"
  | "attendance"
  | "timetable"
  | "assignments"

const LABELS: Record<TabKey, { en: string; ar: string }> = {
  overview: { en: "Overview", ar: "نظرة عامة" },
  grades: { en: "Grades", ar: "الدرجات" },
  "report-cards": { en: "Report cards", ar: "بطاقات التقرير" },
  attendance: { en: "Attendance", ar: "الحضور" },
  timetable: { en: "Timetable", ar: "الجدول" },
  assignments: { en: "Assignments", ar: "الواجبات" },
}

const ORDER: TabKey[] = [
  "overview",
  "grades",
  "report-cards",
  "attendance",
  "timetable",
  "assignments",
]

export function ChildTabs({ childId, lang }: Props) {
  const pathname = usePathname()
  const base = `/${lang}/parent/children/${childId}`

  return (
    <nav className="border-border flex gap-2 overflow-x-auto border-b">
      {ORDER.map((key) => {
        const href = key === "overview" ? base : `${base}/${key}`
        const active =
          key === "overview"
            ? pathname?.endsWith(`/${childId}`)
            : pathname?.includes(`/${childId}/${key}`)

        return (
          <Link
            key={key}
            href={href}
            className={cn(
              "border-b-2 px-3 py-2 text-sm whitespace-nowrap transition-colors",
              active
                ? "border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground border-transparent"
            )}
          >
            {LABELS[key][lang]}
          </Link>
        )
      })}
    </nav>
  )
}
