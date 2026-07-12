// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Read-only query builders for live classes.
 *
 * Single-Language Storage:
 * - Conference has title, description, and a `lang` field
 * - Content is stored in one language; translate on demand for display
 *
 * Multi-tenant: every where clause includes `schoolId` and `deletedAt: null`.
 */

import { Prisma } from "@prisma/client"

import { db } from "@/lib/db"

// ============================================================================
// Types
// ============================================================================

export type LiveClassListFilters = {
  title?: string // Searches title field
  status?: string
  // Role-scoped row restriction: when set, only sessions in these sections —
  // plus any school-wide (`visibility: school`) session — are returned
  // (STUDENT/GUARDIAN). Omit for staff (whole-school) views.
  sectionIds?: string[]
}

export type PaginationParams = {
  page: number
  perPage: number
}

export type SortParam = {
  id: string
  desc: boolean
}

export type LiveClassQueryParams = LiveClassListFilters &
  PaginationParams & { sort?: SortParam[] }

// Relations included for display (teacher name, subject name, section name).
const liveClassListInclude = {
  teacher: {
    select: { id: true, firstName: true, lastName: true },
  },
  subject: {
    select: { id: true, name: true },
  },
  section: {
    select: { id: true, name: true },
  },
} as const

// ============================================================================
// Query builders
// ============================================================================

export function buildLiveClassWhere(
  schoolId: string,
  filters: LiveClassListFilters = {}
): Prisma.ConferenceWhereInput {
  const where: Prisma.ConferenceWhereInput = {
    schoolId,
    deletedAt: null,
  }

  if (filters.title) {
    where.title = {
      contains: filters.title,
      mode: Prisma.QueryMode.insensitive,
    }
  }

  if (filters.status) {
    where.status = filters.status as Prisma.ConferenceWhereInput["status"]
  }

  if (filters.sectionIds) {
    // Scoped viewers see their own sections' sessions AND every school-wide
    // session. Never plain `sectionId in` alone — that would hide assemblies.
    where.OR = [
      { sectionId: { in: filters.sectionIds } },
      { visibility: "school" },
    ]
  }

  return where
}

/**
 * What sessions a viewer may see in the list/detail reads. Staff
 * (DEVELOPER/ADMIN/TEACHER/STAFF/ACCOUNTANT — the `read_school_dashboard`
 * set) see the whole school; STUDENT/GUARDIAN are scoped to the sections they
 * (or their wards) are enrolled in; everyone else sees nothing. Mirrors
 * `canAccessSession` in actions/helpers.ts.
 */
export type ViewerSectionScope = "all" | "none" | { sectionIds: string[] }

const LIST_STAFF_ROLES = [
  "DEVELOPER",
  "ADMIN",
  "TEACHER",
  "STAFF",
  "ACCOUNTANT",
]

export async function resolveViewerSectionScope(
  schoolId: string,
  userId: string | undefined | null,
  role: string | null | undefined
): Promise<ViewerSectionScope> {
  if (!userId || !role) return "none"
  if (LIST_STAFF_ROLES.includes(role)) return "all"
  if (role === "STUDENT") {
    const students = await db.student.findMany({
      where: { schoolId, userId },
      select: { sectionId: true },
    })
    const ids = students
      .map((s) => s.sectionId)
      .filter((x): x is string => Boolean(x))
    return ids.length ? { sectionIds: ids } : "none"
  }
  if (role === "GUARDIAN") {
    const guardians = await db.guardian.findMany({
      where: { schoolId, userId },
      select: {
        studentGuardians: {
          select: { student: { select: { sectionId: true } } },
        },
      },
    })
    const ids = [
      ...new Set(
        guardians
          .flatMap((g) => g.studentGuardians.map((sg) => sg.student?.sectionId))
          .filter((x): x is string => Boolean(x))
      ),
    ]
    return ids.length ? { sectionIds: ids } : "none"
  }
  return "none"
}

export function buildLiveClassOrderBy(
  sortParams?: SortParam[]
): Prisma.ConferenceOrderByWithRelationInput[] {
  if (sortParams && Array.isArray(sortParams) && sortParams.length > 0) {
    return sortParams.map((s) => ({
      [s.id]: s.desc ? Prisma.SortOrder.desc : Prisma.SortOrder.asc,
    }))
  }

  // Default: upcoming sessions first (most recent scheduledStart desc).
  return [{ scheduledStart: Prisma.SortOrder.desc }]
}

export function buildPagination(page: number, perPage: number) {
  return {
    skip: (page - 1) * perPage,
    take: perPage,
  }
}

// ============================================================================
// Query functions
// ============================================================================

/**
 * Get live classes list with filtering, sorting, and pagination.
 * @param schoolId - School ID for multi-tenant filtering (REQUIRED)
 * @param params - Filters, sort, and pagination
 * @returns { rows, count }
 */
export async function getLiveClassesList(
  schoolId: string,
  params: Partial<LiveClassQueryParams> = {}
) {
  const where = buildLiveClassWhere(schoolId, params)
  const orderBy = buildLiveClassOrderBy(params.sort)
  const { skip, take } = buildPagination(params.page ?? 1, params.perPage ?? 20)

  const [rows, count] = await Promise.all([
    db.conference.findMany({
      where,
      orderBy,
      skip,
      take,
      include: liveClassListInclude,
    }),
    db.conference.count({ where }),
  ])

  return { rows, count }
}

export type LiveClassFormOptions = {
  teachers: { id: string; name: string }[]
  subjects: { id: string; name: string }[]
  sections: { id: string; name: string }[]
}

/**
 * Dropdown options for the create/edit form (teachers, subjects, sections),
 * all scoped to the school. Resolved on the server and passed to the form as
 * props — the client must NOT re-fetch these on mount, or a parent re-render
 * loop turns into a request storm + flickering selects.
 * @param schoolId - School ID for multi-tenant filtering (REQUIRED)
 */
export async function getLiveClassFormOptions(
  schoolId: string
): Promise<LiveClassFormOptions> {
  const [teachers, subjects, sections] = await Promise.all([
    db.teacher.findMany({
      where: { schoolId },
      select: { id: true, firstName: true, lastName: true },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    }),
    // Catalog Subject is global (no schoolId) — scope to the subjects this
    // school offers via the SubjectSelection bridge. A subject can be selected
    // for multiple grades, so dedupe by catalogSubjectId.
    db.subjectSelection.findMany({
      where: { schoolId, isActive: true },
      select: { subject: { select: { id: true, name: true } } },
      distinct: ["catalogSubjectId"],
      orderBy: { subject: { name: "asc" } },
    }),
    db.section.findMany({
      where: { schoolId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ])

  return {
    teachers: teachers.map((t) => ({
      id: t.id,
      name: `${t.firstName ?? ""} ${t.lastName ?? ""}`.trim(),
    })),
    subjects: subjects.map((s) => ({ id: s.subject.id, name: s.subject.name })),
    sections: sections.map((s) => ({ id: s.id, name: s.name })),
  }
}

export type LessonReferenceContent = {
  videos: { id: string; title: string; videoUrl: string }[]
  attachments: { id: string; name: string; url: string }[]
  materials: {
    id: string
    title: string
    type: string
    fileUrl: string | null
    externalUrl: string | null
  }[]
  questionCount: number
}

/**
 * The linked catalog lesson's teachable content, surfaced on the session
 * detail page (videos, attachments, materials, practice-question count).
 * Catalog content is platform-global — no schoolId axis; access is gated by
 * the session read that precedes this call.
 */
export async function getLessonReferenceContent(
  catalogLessonId: string
): Promise<LessonReferenceContent> {
  const [videos, attachments, materials, questionCount] = await Promise.all([
    db.video.findMany({
      where: { catalogLessonId },
      select: { id: true, title: true, videoUrl: true },
      orderBy: { createdAt: "asc" },
      take: 20,
    }),
    db.attachment.findMany({
      where: { catalogLessonId },
      select: { id: true, name: true, url: true },
      orderBy: { createdAt: "asc" },
      take: 20,
    }),
    db.material.findMany({
      where: { catalogLessonId },
      select: {
        id: true,
        title: true,
        type: true,
        fileUrl: true,
        externalUrl: true,
      },
      orderBy: { createdAt: "asc" },
      take: 20,
    }),
    db.question.count({
      where: { catalogLessonId, approvalStatus: "APPROVED" },
    }),
  ])
  return { videos, attachments, materials, questionCount }
}

export type LiveClassReferenceData = {
  lessons: { id: string; name: string }[]
  exams: { id: string; title: string; examType: string; examDate: string }[]
  assignments: { id: string; title: string; dueDate: string }[]
}

/**
 * Picker data for the wizard's References step, scoped to one subject:
 * catalog lessons (global content, reached via the subject's chapters),
 * school exams/quizzes, and school assignments (via the Class↔Subject axis).
 * Fetched on demand when a subject is chosen — never on form mount.
 * @param schoolId - School ID for multi-tenant filtering (REQUIRED)
 * @param subjectId - Catalog subject id the session teaches
 */
export async function getLiveClassReferenceData(
  schoolId: string,
  subjectId: string
): Promise<LiveClassReferenceData> {
  const [lessons, exams, assignments] = await Promise.all([
    db.lesson.findMany({
      where: { chapter: { subjectId }, status: "PUBLISHED" },
      select: { id: true, name: true },
      orderBy: [
        { chapter: { sequenceOrder: "asc" } },
        { sequenceOrder: "asc" },
      ],
      take: 200,
    }),
    db.schoolExam.findMany({
      where: { schoolId, subjectId },
      select: { id: true, title: true, examType: true, examDate: true },
      orderBy: { examDate: "desc" },
      take: 50,
    }),
    db.schoolAssignment.findMany({
      where: { schoolId, class: { subjectId } },
      select: { id: true, title: true, dueDate: true },
      orderBy: { dueDate: "desc" },
      take: 50,
    }),
  ])

  return {
    lessons,
    exams: exams.map((e) => ({
      id: e.id,
      title: e.title,
      examType: e.examType,
      examDate: e.examDate.toISOString(),
    })),
    assignments: assignments.map((a) => ({
      id: a.id,
      title: a.title,
      dueDate: a.dueDate.toISOString(),
    })),
  }
}

/**
 * Get a single live class by ID, scoped by school. Excludes soft-deleted rows.
 * @param schoolId - School ID for multi-tenant filtering (REQUIRED)
 * @param id - Live class session ID
 */
export async function getLiveClassDetail(schoolId: string, id: string) {
  return db.conference.findFirst({
    where: {
      id,
      schoolId,
      deletedAt: null,
    },
    include: {
      ...liveClassListInclude,
      catalogLesson: { select: { id: true, name: true } },
      resources: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          url: true,
          title: true,
          schoolExamId: true,
          schoolAssignmentId: true,
          schoolExam: {
            select: { id: true, title: true, examType: true, examDate: true },
          },
          schoolAssignment: {
            select: { id: true, title: true, type: true, dueDate: true },
          },
        },
      },
    },
  })
}
