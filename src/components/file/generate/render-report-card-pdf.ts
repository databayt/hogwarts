// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Render-and-upload helper for ReportCard PDFs.
 *
 * Factored out of `school-dashboard/reports/actions.ts` so the same logic
 * can be invoked from:
 *   - the legacy sync caller (`reports/actions.ts > generateReportCards`)
 *   - the new async cron (`api/cron/process-report-card-pdfs`)
 *
 * The cron is the long-term home; the sync caller is deprecated in
 * Phase 2b once the cron proves itself in production.
 *
 * Returns `{ ok, pdfUrl, durationMs, reason? }`.
 * - `ok: true` + `pdfUrl` on success
 * - `ok: false` + `reason` on any failure (logged; caller decides retry)
 */

import React from "react"
import { renderToBuffer } from "@react-pdf/renderer"

import { db } from "@/lib/db"
import { ReportCardTemplate } from "@/components/file/generate/report-card"
import type {
  ReportCardData,
  ReportCardSubject,
} from "@/components/file/generate/types"
import { getProvider } from "@/components/file/providers/factory"

interface RenderResult {
  ok: boolean
  pdfUrl?: string
  durationMs: number
  reason?: string
}

export async function renderAndUploadReportCardPdf(
  reportCardId: string
): Promise<RenderResult> {
  const startedAt = Date.now()

  // Pull everything needed for a self-contained render. We don't trust
  // the caller to have hydrated the ReportCard — cron and sync paths
  // call this with just an id.
  const rc = await db.reportCard.findUnique({
    where: { id: reportCardId },
    include: {
      student: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          studentId: true,
        },
      },
      term: {
        select: {
          termNumber: true,
          schoolYear: { select: { yearName: true } },
        },
      },
      grades: {
        select: {
          grade: true,
          score: true,
          maxScore: true,
          percentage: true,
          subject: { select: { name: true } },
        },
        orderBy: { subject: { name: "asc" } },
      },
    },
  })

  if (!rc) {
    return {
      ok: false,
      durationMs: Date.now() - startedAt,
      reason: "report_card_not_found",
    }
  }

  if (rc.grades.length === 0) {
    // No subjects → nothing meaningful to render. Mark as a non-error
    // skip so the cron doesn't retry forever.
    return {
      ok: false,
      durationMs: Date.now() - startedAt,
      reason: "no_grades",
    }
  }

  const school = await db.school.findUnique({
    where: { id: rc.schoolId },
    select: {
      name: true,
      logoUrl: true,
      address: true,
      phoneNumber: true,
      email: true,
      preferredLanguage: true,
    },
  })

  const locale = (school?.preferredLanguage === "en" ? "en" : "ar") as
    | "en"
    | "ar"

  const subjects: ReportCardSubject[] = rc.grades.map((g) => ({
    name: g.subject?.name ?? "",
    grade: g.grade,
    score: g.score ? Number(g.score) : undefined,
    maxScore: g.maxScore ? Number(g.maxScore) : undefined,
    percentage: g.percentage ?? undefined,
  }))

  const data: ReportCardData = {
    schoolName: school?.name ?? "",
    schoolLogo: school?.logoUrl ?? undefined,
    schoolAddress: school?.address ?? undefined,
    schoolPhone: school?.phoneNumber ?? undefined,
    schoolEmail: school?.email ?? undefined,
    issueDate: rc.publishedAt ?? new Date(),
    locale,
    studentName: `${rc.student.firstName} ${rc.student.lastName}`,
    studentId: rc.student.studentId ?? rc.student.id,
    studentPhoto: undefined,
    className: "",
    yearLevel: "",
    termName: rc.term ? `Term ${rc.term.termNumber}` : "",
    academicYear: rc.term?.schoolYear?.yearName ?? "",
    subjects,
    overallGrade: rc.overallGrade ?? undefined,
    overallPercentage: subjects.length
      ? Math.round(
          (subjects.reduce((s, x) => s + (x.percentage ?? 0), 0) /
            subjects.length) *
            100
        ) / 100
      : undefined,
    gpa: rc.overallGPA ? Number(rc.overallGPA) : undefined,
    rank: rc.rank ?? undefined,
    totalStudents: rc.totalStudents ?? undefined,
    totalDays:
      (rc.daysPresent ?? 0) + (rc.daysAbsent ?? 0) + (rc.daysLate ?? 0),
    presentDays: rc.daysPresent ?? undefined,
    absentDays: rc.daysAbsent ?? undefined,
    teacherComments: rc.teacherComments ?? undefined,
    principalComments: rc.principalComments ?? undefined,
  }

  try {
    // The Document tree must be created via React.createElement here
    // (not JSX) because the helper lives outside the React tree — this
    // is the same pattern used by reports/actions.ts and certificate-pdf.ts.
    const doc = React.createElement(ReportCardTemplate, { data })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(doc as any)

    // Filename intentionally uses a UUID-ish suffix + cuid id rather than
    // {schoolId}/{studentName}/{Date.now()} (the old enumerable pattern).
    // The path is still organized by school + term for ops/cleanup, but
    // the leaf is non-guessable.
    const studentSlug =
      `${rc.student.firstName}-${rc.student.lastName}`.replace(
        /[^a-zA-Z0-9-_]/g,
        "-"
      )
    const filename = `report-cards/${rc.schoolId}/term-${rc.term?.termNumber ?? "x"}/${studentSlug}-${rc.id}.pdf`

    const provider = getProvider("aws_s3")
    const blob = new Blob([buffer], { type: "application/pdf" })
    const pdfUrl = await provider.upload(blob, filename, {
      contentType: "application/pdf",
      // Private ACL so the only way to fetch is through the gated
      // /api/parent/report-cards/[id]/download endpoint (which signs).
      // For buckets configured with public-by-default ACL, this option
      // is currently no-op at the provider level — the gate is the
      // endpoint NOT returning raw pdfUrl to clients.
      access: "private",
    })

    await db.reportCard.update({
      where: { id: rc.id },
      data: { pdfUrl },
    })

    return {
      ok: true,
      pdfUrl,
      durationMs: Date.now() - startedAt,
    }
  } catch (error) {
    console.error("[renderAndUploadReportCardPdf] failed", {
      reportCardId,
      studentId: rc.studentId,
      termId: rc.termId,
      error: error instanceof Error ? error.message : String(error),
    })
    return {
      ok: false,
      durationMs: Date.now() - startedAt,
      reason: error instanceof Error ? error.message : "render_failed",
    }
  }
}
