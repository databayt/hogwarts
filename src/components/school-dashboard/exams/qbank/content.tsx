// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import type {
  BloomLevel,
  DifficultyLevel,
  Prisma,
  QuestionSource,
  QuestionType,
} from "@prisma/client"
import { SearchParams } from "nuqs/server"

import { getDisplayText } from "@/lib/content-display"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import type { SupportedLanguage } from "@/components/translation/types"

import type { QuestionBankRow } from "./columns"
import { questionBankSearchParams } from "./list-params"
import PracticeContent from "./practice-content"
import { QBankTabbedLayout } from "./tabbed-layout"
import { QuestionBankTable } from "./table"

/**
 * Compute quality flags based on question analytics.
 * Used for showing quality badges (green/yellow/red) in the QBank table.
 */
function computeQualityFlags(
  successRate: number | null,
  avgScore: number | null,
  timesUsed: number,
  assignedDifficulty: string,
  perceivedDifficulty: string | null
): string[] {
  const flags: string[] = []

  // Not enough data
  if (timesUsed < 3) {
    flags.push("low-usage")
    return flags
  }

  // Success rate based flags
  if (successRate !== null) {
    if (successRate >= 90) flags.push("too-easy")
    else if (successRate >= 70) flags.push("good")
    else if (successRate >= 40) flags.push("moderate")
    else flags.push("too-hard")
  }

  // Difficulty mismatch detection
  if (perceivedDifficulty && perceivedDifficulty !== assignedDifficulty) {
    flags.push("difficulty-mismatch")
  }

  return flags
}

interface Props {
  searchParams: Promise<SearchParams>
  dictionary: Dictionary
  lang: Locale
}

export default async function QuestionBankContent({
  searchParams,
  dictionary,
  lang,
}: Props) {
  const sp = await questionBankSearchParams.parse(await searchParams)
  const { schoolId } = await getTenantContext()
  const session = await auth()
  const role = session?.user?.role

  // For students/guardians/teachers, scope questions to enrolled/assigned subjects
  let enrolledSubjectIds: string[] | null = null
  if (schoolId && role === "STUDENT") {
    const student = await db.student.findFirst({
      where: { userId: session?.user?.id, schoolId },
      select: { id: true },
    })
    if (student) {
      const classes = await db.studentClass.findMany({
        where: { studentId: student.id, schoolId },
        include: { class: { select: { subjectId: true } } },
      })
      enrolledSubjectIds = classes
        .map((sc) => sc.class.subjectId)
        .filter(Boolean) as string[]
    }
  } else if (schoolId && role === "GUARDIAN") {
    const guardian = await db.guardian.findFirst({
      where: { userId: session?.user?.id, schoolId },
      select: { id: true },
    })
    if (guardian) {
      const sgs = await db.studentGuardian.findMany({
        where: { guardianId: guardian.id, schoolId },
        select: { studentId: true },
      })
      const classes = await db.studentClass.findMany({
        where: {
          studentId: { in: sgs.map((sg) => sg.studentId) },
          schoolId,
        },
        include: { class: { select: { subjectId: true } } },
      })
      enrolledSubjectIds = [
        ...new Set(
          classes.map((sc) => sc.class.subjectId).filter(Boolean) as string[]
        ),
      ]
    }
  } else if (schoolId && role === "TEACHER") {
    // Teacher sees questions from subjects they teach
    const teacher = await db.teacher.findFirst({
      where: { userId: session?.user?.id, schoolId },
      select: { id: true },
    })
    if (teacher) {
      const teacherClasses = await db.class.findMany({
        where: { teacherId: teacher.id, schoolId },
        select: { subjectId: true },
      })
      enrolledSubjectIds = [
        ...new Set(
          teacherClasses.map((c) => c.subjectId).filter(Boolean) as string[]
        ),
      ]
    }
  }

  let data: QuestionBankRow[] = []
  let total = 0
  let subjects: { label: string; value: string }[] = []
  let subjectOptions: { label: string; value: string }[] = []

  if (schoolId) {
    // Fetch subjects for filter dropdown (scoped for teacher/student/guardian)
    const rawSubjects = await db.subject.findMany({
      where: {
        schoolId,
        ...(enrolledSubjectIds ? { id: { in: enrolledSubjectIds } } : {}),
      },
      select: { id: true, subjectName: true },
      orderBy: { subjectName: "asc" },
    })
    // Table filter uses subject name as value (matches row data)
    subjects = rawSubjects.map((s) => ({
      label: s.subjectName || s.id,
      value: s.subjectName || s.id,
    }))
    // Form uses subject ID as value (for subjectId field)
    subjectOptions = rawSubjects.map((s) => ({
      label: s.subjectName || s.id,
      value: s.id,
    }))

    try {
      const where: Prisma.QuestionBankWhereInput = {
        schoolId, // CRITICAL: Multi-tenant scope
        ...(sp.subjectId ? { subjectId: sp.subjectId } : {}),
        // Scope to enrolled subjects for students/guardians
        ...(enrolledSubjectIds && !sp.subjectId
          ? { subjectId: { in: enrolledSubjectIds } }
          : {}),
        ...(sp.questionType
          ? { questionType: sp.questionType as QuestionType }
          : {}),
        ...(sp.difficulty
          ? { difficulty: sp.difficulty as DifficultyLevel }
          : {}),
        ...(sp.bloomLevel ? { bloomLevel: sp.bloomLevel as BloomLevel } : {}),
        ...(sp.source ? { source: sp.source as QuestionSource } : {}),
        ...(sp.search
          ? {
              questionText: {
                contains: sp.search,
                mode: "insensitive",
              },
            }
          : {}),
      }

      const skip = (sp.page - 1) * sp.perPage
      const take = sp.perPage
      const orderBy: Prisma.QuestionBankOrderByWithRelationInput[] =
        sp.sort && Array.isArray(sp.sort) && sp.sort.length
          ? [
              {
                [sp.sort[0]]: sp.sort[1] === "desc" ? "desc" : "asc",
              } as Prisma.QuestionBankOrderByWithRelationInput,
            ]
          : [{ createdAt: "desc" as const }]

      const [rows, count] = await Promise.all([
        db.questionBank.findMany({
          where,
          orderBy,
          skip,
          take,
          include: {
            subject: {
              select: {
                id: true,
                subjectName: true,
                lang: true,
              },
            },
            analytics: {
              select: {
                timesUsed: true,
                successRate: true,
                avgScore: true,
                perceivedDifficulty: true,
              },
            },
          },
        }),
        db.questionBank.count({ where }),
      ])

      // CRITICAL FIX: Safe date serialization - handle null/undefined dates
      data = await Promise.all(
        rows.map(async (q) => ({
          id: q.id,
          questionText: q.questionText,
          questionType: q.questionType,
          difficulty: q.difficulty,
          bloomLevel: q.bloomLevel,
          subjectName: q.subject?.subjectName
            ? await getDisplayText(
                q.subject.subjectName,
                (q.subject.lang || "ar") as SupportedLanguage,
                lang,
                schoolId!
              )
            : "Unknown",
          points: Number(q.points),
          source: q.source,
          timesUsed: q.analytics?.timesUsed || 0,
          successRate: q.analytics?.successRate
            ? Number(q.analytics.successRate)
            : null,
          avgScore: q.analytics?.avgScore ? Number(q.analytics.avgScore) : null,
          qualityFlags: computeQualityFlags(
            q.analytics?.successRate ? Number(q.analytics.successRate) : null,
            q.analytics?.avgScore ? Number(q.analytics.avgScore) : null,
            q.analytics?.timesUsed || 0,
            q.difficulty,
            q.analytics?.perceivedDifficulty || null
          ),
          createdAt: q.createdAt
            ? new Date(q.createdAt).toISOString()
            : new Date().toISOString(),
        }))
      )
      total = count
    } catch (error) {
      // Log error for debugging but don't crash the page
      console.error(
        "[QuestionBankContent] Error fetching question bank:",
        error
      )
      // Return empty data - page will show "No questions" instead of crashing
      data = []
      total = 0
    }
  }

  // Student sees practice mode instead of the DataTable
  if (role === "STUDENT") {
    return <PracticeContent lang={lang} />
  }

  const isReadOnly = role === "GUARDIAN"

  return (
    <QBankTabbedLayout>
      <QuestionBankTable
        initialData={data}
        total={total}
        perPage={sp.perPage}
        dictionary={dictionary}
        readOnly={isReadOnly}
        subjects={subjects}
        subjectOptions={subjectOptions}
      />
    </QBankTabbedLayout>
  )
}
