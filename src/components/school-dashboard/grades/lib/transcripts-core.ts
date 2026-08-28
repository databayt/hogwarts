// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Transcript aggregation core — a plain (NOT "use server") module, mirroring
 * `report-cards-core.ts` and the gradebook spine. The `generateTranscript`
 * action calls `auth()` inside itself, which throws outside a request scope, so
 * anything without a session (the demo seed, a future cron or bulk issuer)
 * could not reach the logic at all. Here `schoolId` and `generatedBy` are
 * parameters and every query is scoped by `schoolId`; the auth/tenant guard and
 * the `revalidatePath` live in the action wrapper.
 *
 * A transcript is an ISSUED DOCUMENT, not a view: `transcriptData` freezes the
 * student's record at the moment of issue, and `transcriptNumber` /
 * `verificationCode` make that copy independently verifiable. Issuing twice for
 * the same student is therefore legitimate (a second certified copy) — there is
 * deliberately no unique constraint on `studentId`. Callers that want
 * at-most-one, like the seed, must guard themselves.
 */
import crypto from "crypto"

import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"

export interface TranscriptYearData {
  yearName: string
  terms: Array<{
    termName: string
    subjects: Array<{
      name: string
      grade: string
      score?: number
      maxScore?: number
      percentage?: number
      credits?: number
    }>
    termGPA?: number
  }>
  yearGPA?: number
}

function generateTranscriptNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = crypto.randomBytes(3).toString("hex").toUpperCase()
  return `TR-${timestamp}${random}`
}

function generateVerificationCode(): string {
  return crypto.randomBytes(8).toString("hex").toUpperCase()
}

/**
 * `transcriptData` is a DISPLAY SNAPSHOT of an issued document, so the term
 * label is written in the school's own language and frozen with the rest of the
 * record. It used to be a hardcoded `Term ${n}`, which printed English on every
 * Arabic school's official transcript.
 *
 * (Freezing a localized string is safe here precisely because it is a label on
 * an issued copy — unlike a match key such as `upsertGradebookResult`'s `title`,
 * where a translated value orphans rows when the school's language changes.)
 */
function termLabel(termNumber: number | null | undefined, lang: "ar" | "en") {
  if (termNumber == null) return lang === "ar" ? "فصل دراسي" : "Term"
  return lang === "ar" ? `الفصل ${termNumber}` : `Term ${termNumber}`
}

export interface GenerateTranscriptInput {
  studentId: string
  /** User id recorded on the issued document. */
  generatedBy: string
}

/**
 * Freeze a student's report-card history into a verifiable `Transcript` row.
 * Returns `TRANSCRIPT_NO_REPORT_CARDS` when the student has nothing to certify
 * — until report cards carry `ReportCardGrade` rows there is no transcript to
 * issue, which is why this path produced empty documents before 2026-08-14.
 */
export async function generateTranscriptCore(
  schoolId: string,
  input: GenerateTranscriptInput
): Promise<ActionResponse<{ id: string; transcriptNumber: string }>> {
  try {
    const student = await db.student.findFirst({
      where: { id: input.studentId, schoolId },
      select: { id: true, firstName: true, lastName: true },
    })
    if (!student) return { success: false, error: "Student not found" }

    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: { preferredLanguage: true },
    })
    const lang = school?.preferredLanguage === "en" ? "en" : "ar"

    const studentName = `${student.firstName} ${student.lastName}`

    const reportCards = await db.reportCard.findMany({
      where: { schoolId, studentId: input.studentId },
      include: {
        term: { include: { schoolYear: { select: { yearName: true } } } },
        grades: { include: { subject: { select: { name: true } } } },
      },
      orderBy: { term: { startDate: "asc" } },
    })

    if (reportCards.length === 0) {
      return { success: false, error: "No report cards found for this student" }
    }

    const yearMap = new Map<string, TranscriptYearData>()

    for (const rc of reportCards) {
      const yearName =
        rc.term.schoolYear?.yearName ?? (lang === "ar" ? "غير محدد" : "Unknown")

      let yearData = yearMap.get(yearName)
      if (!yearData) {
        yearData = { yearName, terms: [], yearGPA: undefined }
        yearMap.set(yearName, yearData)
      }

      yearData.terms.push({
        termName: termLabel(rc.term.termNumber, lang),
        subjects: rc.grades.map((g) => ({
          name: g.subject.name,
          grade: g.grade,
          score: g.score ? Number(g.score) : undefined,
          maxScore: g.maxScore ? Number(g.maxScore) : undefined,
          percentage: g.percentage ?? undefined,
          credits: g.credits ? Number(g.credits) : undefined,
        })),
        termGPA: rc.overallGPA ? Number(rc.overallGPA) : undefined,
      })
    }

    const transcriptData: TranscriptYearData[] = []
    for (const yearData of yearMap.values()) {
      const termGPAs = yearData.terms
        .map((t) => t.termGPA)
        .filter((g): g is number => g != null)
      yearData.yearGPA =
        termGPAs.length > 0
          ? termGPAs.reduce((a, b) => a + b, 0) / termGPAs.length
          : undefined
      transcriptData.push(yearData)
    }

    const allGPAs = transcriptData
      .map((y) => y.yearGPA)
      .filter((g): g is number => g != null)
    const cumulativeGPA =
      allGPAs.length > 0
        ? Math.round(
            (allGPAs.reduce((a, b) => a + b, 0) / allGPAs.length) * 100
          ) / 100
        : undefined

    const totalCredits = reportCards
      .flatMap((rc) => rc.grades)
      .reduce((sum, g) => sum + (g.credits ? Number(g.credits) : 0), 0)

    const transcriptNumber = generateTranscriptNumber()
    const verificationCode = generateVerificationCode()

    const transcript = await db.transcript.create({
      data: {
        schoolId,
        studentId: input.studentId,
        studentName,
        transcriptData: JSON.parse(JSON.stringify(transcriptData)),
        cumulativeGPA,
        totalCredits: totalCredits > 0 ? totalCredits : undefined,
        transcriptNumber,
        verificationCode,
        generatedBy: input.generatedBy,
      },
    })

    return {
      success: true,
      data: { id: transcript.id, transcriptNumber },
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to generate transcript",
    }
  }
}
