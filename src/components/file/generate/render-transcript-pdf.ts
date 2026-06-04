// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Render-and-upload helper for Transcript PDFs (Phase 5).
 *
 * Mirrors `render-report-card-pdf.ts`. Picked up by the
 * `process-transcript-pdfs` cron when `Transcript.pdfUrl IS NULL`.
 *
 * Uses the pre-existing `TranscriptTemplate` (shape: `DocumentMetadata`
 * + flat `TranscriptCourse[]`) and flattens the nested
 * `Transcript.transcriptData` JSON (years → terms → subjects) into
 * that shape at render time. The template already groups by term via
 * `groupCoursesByTerm`, so the flat list is recomposed for display.
 */

import React from "react"
import { renderToBuffer } from "@react-pdf/renderer"

import { db } from "@/lib/db"
import { TranscriptTemplate } from "@/components/file/generate/transcript"
import type {
  TranscriptCourse,
  TranscriptData,
} from "@/components/file/generate/types"
import { getProvider } from "@/components/file/providers/factory"

// Shape stored in `Transcript.transcriptData` JSON column by
// `generateTranscript`. Kept local rather than re-exported because
// the type is an implementation detail of the action's serialization.
interface NestedSubject {
  name: string
  grade: string
  score?: number
  maxScore?: number
  percentage?: number
  credits?: number
}

interface NestedTerm {
  termName: string
  subjects: NestedSubject[]
  termGPA?: number
}

interface NestedYear {
  yearName: string
  terms: NestedTerm[]
  yearGPA?: number
}

interface RenderResult {
  ok: boolean
  pdfUrl?: string
  durationMs: number
  reason?: string
}

function flattenToCourses(years: NestedYear[]): TranscriptCourse[] {
  const courses: TranscriptCourse[] = []
  for (const year of years) {
    for (const term of year.terms) {
      for (const subject of term.subjects) {
        courses.push({
          // No separate course code in the source data — repeat the
          // subject name so the template's code column isn't blank.
          code: subject.name,
          name: subject.name,
          credits: subject.credits,
          grade: subject.grade,
          term: term.termName,
          year: year.yearName,
        })
      }
    }
  }
  return courses
}

export async function renderAndUploadTranscriptPdf(
  transcriptId: string
): Promise<RenderResult> {
  const startedAt = Date.now()

  const t = await db.transcript.findUnique({
    where: { id: transcriptId },
    select: {
      id: true,
      schoolId: true,
      studentId: true,
      studentName: true,
      transcriptNumber: true,
      verificationCode: true,
      transcriptData: true,
      cumulativeGPA: true,
      totalCredits: true,
      createdAt: true,
    },
  })

  if (!t) {
    return {
      ok: false,
      durationMs: Date.now() - startedAt,
      reason: "transcript_not_found",
    }
  }

  // `transcriptData` is `Json?` in the schema. Treat as unknown and
  // validate shape before flattening — a malformed row shouldn't
  // crash the cron.
  const years = Array.isArray(t.transcriptData)
    ? (t.transcriptData as unknown as NestedYear[])
    : []

  if (years.length === 0) {
    return {
      ok: false,
      durationMs: Date.now() - startedAt,
      reason: "no_years",
    }
  }

  const courses = flattenToCourses(years)

  // Look up student enrollmentDate (required by the template).
  // Falls back to transcript createdAt so the template never blows up.
  const student = await db.student.findUnique({
    where: { id: t.studentId },
    select: { admissionDate: true },
  })

  const school = await db.school.findUnique({
    where: { id: t.schoolId },
    select: { name: true, preferredLanguage: true },
  })

  const locale = (school?.preferredLanguage === "en" ? "en" : "ar") as
    | "en"
    | "ar"

  const data: TranscriptData = {
    // DocumentMetadata
    schoolName: school?.name ?? "",
    issueDate: t.createdAt,
    locale,
    documentNumber: t.transcriptNumber,
    // Student
    studentName: t.studentName,
    studentId: t.studentId,
    enrollmentDate: student?.admissionDate ?? t.createdAt,
    // Program — Transcript schema has no program info; leave generic.
    programName: "",
    // Academic record
    courses,
    // Summary
    cumulativeGpa:
      t.cumulativeGPA !== null && t.cumulativeGPA !== undefined
        ? Number(t.cumulativeGPA)
        : undefined,
    totalCredits:
      t.totalCredits !== null && t.totalCredits !== undefined
        ? Number(t.totalCredits)
        : undefined,
  }

  try {
    const doc = React.createElement(TranscriptTemplate, { data })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(doc as any)

    // Non-enumerable filename. Verification code is unique per
    // transcript and not back-derivable to a student.
    const filename = `transcripts/${t.schoolId}/${t.transcriptNumber}.pdf`

    const provider = getProvider("aws_s3")
    const blob = new Blob([buffer], { type: "application/pdf" })
    const pdfUrl = await provider.upload(blob, filename, {
      contentType: "application/pdf",
      access: "private",
    })

    await db.transcript.update({
      where: { id: t.id },
      data: { pdfUrl },
    })

    return {
      ok: true,
      pdfUrl,
      durationMs: Date.now() - startedAt,
    }
  } catch (error) {
    console.error("[renderAndUploadTranscriptPdf] failed", {
      transcriptId,
      transcriptNumber: t.transcriptNumber,
      error: error instanceof Error ? error.message : String(error),
    })
    return {
      ok: false,
      durationMs: Date.now() - startedAt,
      reason: error instanceof Error ? error.message : "render_failed",
    }
  }
}
