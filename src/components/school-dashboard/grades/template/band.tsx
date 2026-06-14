"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Compact "table-grid" mocks of each report-card band. Each is intentionally
 * small (a strip / a few rows) — NOT a full A4 page — so a wizard step can show
 * just the one band it edits.
 */
import { cn } from "@/lib/utils"

import type {
  ReportCardFooterBand,
  ReportCardHeaderBand,
  ReportCardScoresBand,
  ScoreColumn,
} from "./types"

const COLUMN_LABEL: Record<ScoreColumn, string> = {
  subject: "Subject",
  score: "Score",
  maxScore: "Max",
  percentage: "%",
  grade: "Grade",
  gpa: "GPA",
  credits: "Cr",
  comments: "Comments",
}

function Cell({
  children,
  className,
}: {
  children?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "border-border/60 flex items-center border px-2 py-1 text-[10px]",
        className
      )}
    >
      {children}
    </div>
  )
}

export function HeaderBandMock({ band }: { band: ReportCardHeaderBand }) {
  return (
    <div className="bg-card overflow-hidden rounded-md border">
      <div className="flex items-center gap-2 border-b px-2 py-1.5">
        {band.showLogo && (
          <div className="bg-muted size-6 shrink-0 rounded-sm" />
        )}
        <div className="min-w-0 flex-1">
          {band.showSchoolName && (
            <div className="bg-muted/70 h-1.5 w-20 rounded" />
          )}
          <div className="mt-1 text-[11px] font-medium">
            {band.title || "—"}
          </div>
        </div>
        {band.showTerm && (
          <div className="bg-muted/70 h-1.5 w-12 shrink-0 rounded" />
        )}
      </div>
      <div className="grid grid-cols-3">
        {band.showStudentName && <Cell>Name</Cell>}
        {band.showStudentId && <Cell>ID</Cell>}
        {band.showClass && <Cell>Class</Cell>}
        {!band.showStudentName && !band.showStudentId && !band.showClass && (
          <Cell className="text-muted-foreground col-span-3">
            No student fields
          </Cell>
        )}
      </div>
    </div>
  )
}

export function ScoresBandMock({ band }: { band: ReportCardScoresBand }) {
  const cols = band.columns.length || 1
  return (
    <div className="bg-card overflow-hidden rounded-md border">
      <div
        className="bg-muted/40 grid"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {band.columns.map((c) => (
          <Cell key={c} className="font-medium">
            {COLUMN_LABEL[c]}
          </Cell>
        ))}
      </div>
      {[0, 1].map((r) => (
        <div
          key={r}
          className="grid"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {band.columns.map((c) => (
            <Cell key={c} className="text-muted-foreground">
              {c === "subject" ? (r === 0 ? "Math" : "Science") : "—"}
            </Cell>
          ))}
        </div>
      ))}
      {band.showOverallRow && (
        <div
          className="bg-muted/20 grid"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {band.columns.map((c, i) => (
            <Cell key={c} className="font-medium">
              {i === 0 ? "Overall" : c === "grade" ? "A" : "—"}
            </Cell>
          ))}
        </div>
      )}
    </div>
  )
}

export function FooterBandMock({ band }: { band: ReportCardFooterBand }) {
  const chips: string[] = []
  if (band.showAttendance) chips.push("Attendance")
  if (band.showGpa) chips.push("GPA")
  if (band.showTeacherComments) chips.push("Teacher note")
  if (band.showPrincipalComments) chips.push("Principal note")
  return (
    <div className="bg-card space-y-1.5 rounded-md border p-2">
      <div className="flex flex-wrap gap-1.5">
        {chips.length === 0 ? (
          <span className="text-muted-foreground text-[10px]">No footer</span>
        ) : (
          chips.map((c) => (
            <span
              key={c}
              className="bg-muted rounded px-1.5 py-0.5 text-[10px]"
            >
              {c}
            </span>
          ))
        )}
      </div>
      {band.note ? (
        <div className="text-muted-foreground text-[10px] italic">
          {band.note}
        </div>
      ) : null}
      {band.showSignatures && (
        <div className="flex gap-4 pt-1">
          <div className="bg-muted/70 h-px w-16 self-end" />
          <div className="bg-muted/70 h-px w-16 self-end" />
        </div>
      )}
    </div>
  )
}
