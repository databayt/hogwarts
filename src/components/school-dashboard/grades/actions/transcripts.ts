"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import crypto from "crypto"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

// ============================================================================
// HELPERS
// ============================================================================

function generateTranscriptNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = crypto.randomBytes(3).toString("hex").toUpperCase()
  return `TR-${timestamp}${random}`
}

function generateVerificationCode(): string {
  return crypto.randomBytes(8).toString("hex").toUpperCase()
}

interface TranscriptYearData {
  yearName: string
  terms: Array<{
    termName: string
    subjects: Array<{
      subjectName: string
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

// ============================================================================
// GENERATE TRANSCRIPT
// ============================================================================

export async function generateTranscript(input: {
  studentId: string
}): Promise<ActionResponse<{ id: string; transcriptNumber: string }>> {
  try {
    const session = await auth()
    if (!session?.user) return { success: false, error: "Not authenticated" }
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    // Fetch student
    const student = await db.student.findFirst({
      where: { id: input.studentId, schoolId },
      select: { id: true, givenName: true, surname: true },
    })
    if (!student) return { success: false, error: "Student not found" }

    const studentName = `${student.givenName} ${student.surname}`

    // Fetch all report cards for this student, grouped by year
    const reportCards = await db.reportCard.findMany({
      where: { schoolId, studentId: input.studentId },
      include: {
        term: {
          include: {
            schoolYear: { select: { yearName: true } },
          },
        },
        grades: {
          include: { subject: { select: { subjectName: true } } },
        },
      },
      orderBy: { term: { startDate: "asc" } },
    })

    if (reportCards.length === 0) {
      return { success: false, error: "No report cards found for this student" }
    }

    // Group by year
    const yearMap = new Map<string, TranscriptYearData>()

    for (const rc of reportCards) {
      const yearName = rc.term.schoolYear?.yearName || "Unknown"

      if (!yearMap.has(yearName)) {
        yearMap.set(yearName, { yearName, terms: [], yearGPA: undefined })
      }

      const yearData = yearMap.get(yearName)!
      yearData.terms.push({
        termName: `Term ${rc.term.termNumber}`,
        subjects: rc.grades.map((g) => ({
          subjectName: g.subject.subjectName,
          grade: g.grade,
          score: g.score ? Number(g.score) : undefined,
          maxScore: g.maxScore ? Number(g.maxScore) : undefined,
          percentage: g.percentage ?? undefined,
          credits: g.credits ? Number(g.credits) : undefined,
        })),
        termGPA: rc.overallGPA ? Number(rc.overallGPA) : undefined,
      })
    }

    // Calculate year GPAs
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

    // Calculate cumulative GPA
    const allGPAs = transcriptData
      .map((y) => y.yearGPA)
      .filter((g): g is number => g != null)
    const cumulativeGPA =
      allGPAs.length > 0
        ? Math.round(
            (allGPAs.reduce((a, b) => a + b, 0) / allGPAs.length) * 100
          ) / 100
        : undefined

    // Calculate total credits
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
        generatedBy: session.user.id || "",
      },
    })

    revalidatePath("/grades/transcripts")
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

// ============================================================================
// VERIFY TRANSCRIPT (public)
// ============================================================================

export async function verifyTranscript(input: { verificationCode: string }) {
  try {
    const transcript = await db.transcript.findUnique({
      where: { verificationCode: input.verificationCode },
      select: {
        transcriptNumber: true,
        studentName: true,
        cumulativeGPA: true,
        totalCredits: true,
        createdAt: true,
        school: { select: { name: true } },
      },
    })

    if (!transcript) {
      return { valid: false, error: "Transcript not found" }
    }

    return {
      valid: true,
      data: {
        transcriptNumber: transcript.transcriptNumber,
        studentName: transcript.studentName,
        schoolName: transcript.school.name,
        cumulativeGPA: transcript.cumulativeGPA
          ? Number(transcript.cumulativeGPA)
          : null,
        totalCredits: transcript.totalCredits
          ? Number(transcript.totalCredits)
          : null,
        issuedDate: transcript.createdAt.toISOString(),
      },
    }
  } catch {
    return { valid: false, error: "Verification failed" }
  }
}

// ============================================================================
// GET TRANSCRIPTS
// ============================================================================

export async function getTranscripts(input?: { search?: string }) {
  const session = await auth()
  if (!session?.user) return []
  const { schoolId } = await getTenantContext()
  if (!schoolId) return []

  const where: Record<string, unknown> = { schoolId }
  if (input?.search) {
    where.studentName = { contains: input.search, mode: "insensitive" }
  }

  return db.transcript.findMany({
    where,
    select: {
      id: true,
      studentName: true,
      transcriptNumber: true,
      cumulativeGPA: true,
      totalCredits: true,
      pdfUrl: true,
      createdAt: true,
      student: {
        select: { studentId: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  })
}
