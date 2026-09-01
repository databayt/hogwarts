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
import { isOwnStorageUrl } from "@/lib/storage-key"
import {
  buildProtectedFileUrl,
  buildProtectedVideoUrl,
  isExternallyHostedVideo,
} from "@/components/lumos/video/media-access"

import { DEFAULT_SCHOOL_TZ, schoolDayWindow } from "./day-window"

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

/**
 * The landing strip's own include: the list's shape plus the two catalog image
 * fields its session cards render.
 *
 * `Subject` IS the catalog subject — it carries `concept`, `thumbnail` and
 * `color` — and `Conference.subjectId` points straight at it, so a card gets
 * its subject's artwork with no extra join. Kept separate from
 * `liveClassListInclude` so the table, which renders no imagery, keeps paying
 * for two columns instead of four.
 */
const landingSessionInclude = {
  ...liveClassListInclude,
  subject: {
    select: { id: true, name: true, thumbnail: true, color: true },
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
    // Membership (a student row) is what matters — a student not yet placed
    // in a section returns an EMPTY scope, not "none", so school-wide
    // sessions (assemblies) still reach them via buildLiveClassWhere's OR.
    if (students.length === 0) return "none"
    const ids = students
      .map((s) => s.sectionId)
      .filter((x): x is string => Boolean(x))
    return { sectionIds: ids }
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
    if (guardians.length === 0) return "none"
    const ids = [
      ...new Set(
        guardians
          .flatMap((g) => g.studentGuardians.map((sg) => sg.student?.sectionId))
          .filter((x): x is string => Boolean(x))
      ),
    ]
    return { sectionIds: ids }
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

// Hard ceiling on rows per page. list-params' URL parser has no upper bound,
// so clamp at the query layer — the one choke point every caller (action +
// content.tsx SSR) goes through. Without this, `?perPage=999999999` is an
// unbounded findMany any authenticated viewer can trigger.
const MAX_PER_PAGE = 200

export function buildPagination(page: number, perPage: number) {
  const safePage = Math.max(1, Math.floor(page) || 1)
  const safePerPage = Math.min(
    Math.max(1, Math.floor(perPage) || 20),
    MAX_PER_PAGE
  )
  return {
    skip: (safePage - 1) * safePerPage,
    take: safePerPage,
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
  /**
   * Catalog subjects this school actually teaches, each carrying the grades
   * that adopted it — the client narrows the picker to the chosen section's
   * grade so a Grade 1 class can't be scheduled against a Grade 12 subject.
   */
  subjects: { id: string; name: string; gradeIds: string[] }[]
  /** `gradeNumber` drives the catalog lesson filter (Chapter.grades). */
  sections: { id: string; name: string; gradeId: string; gradeNumber: number }[]
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
  const [teachers, selections, sections] = await Promise.all([
    db.teacher.findMany({
      where: { schoolId },
      select: { id: true, firstName: true, lastName: true },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    }),
    // Catalog Subject is global (no schoolId) — the SubjectSelection bridge is
    // what makes it a subject THIS school teaches, per grade. Keep every row
    // (no `distinct`) so we can build the subject → grades map; `customName` is
    // the school's own name for the subject and wins over the catalog name.
    db.subjectSelection.findMany({
      where: { schoolId, isActive: true },
      select: {
        gradeId: true,
        customName: true,
        subject: { select: { id: true, name: true } },
      },
      orderBy: { subject: { name: "asc" } },
    }),
    db.section.findMany({
      where: { schoolId },
      select: {
        id: true,
        name: true,
        gradeId: true,
        grade: { select: { gradeNumber: true } },
      },
      orderBy: { name: "asc" },
    }),
  ])

  // Collapse the per-grade selection rows into one option per catalog subject.
  const bySubject = new Map<
    string,
    { id: string; name: string; gradeIds: string[] }
  >()
  for (const sel of selections) {
    const existing = bySubject.get(sel.subject.id)
    if (existing) {
      existing.gradeIds.push(sel.gradeId)
      continue
    }
    bySubject.set(sel.subject.id, {
      id: sel.subject.id,
      name: sel.customName || sel.subject.name,
      gradeIds: [sel.gradeId],
    })
  }

  return {
    teachers: teachers.map((t) => ({
      id: t.id,
      name: `${t.firstName ?? ""} ${t.lastName ?? ""}`.trim(),
    })),
    subjects: [...bySubject.values()],
    sections: sections.map((s) => ({
      id: s.id,
      name: s.name,
      gradeId: s.gradeId,
      gradeNumber: s.grade?.gradeNumber ?? 0,
    })),
  }
}

export type LiveSlotOption = {
  timetableId: string
  dayOfWeek: number
  periodName: string
  /** "HH:mm" wall-clock, from the Period's UTC-anchored TIME column. */
  startTime: string
  endTime: string
  teacherId: string
  teacherName: string
  subjectId: string | null
  subjectName: string
  sectionId: string
  sectionName: string
  gradeNumber: number
}

/**
 * Period times are `DateTime @db.Time()` — epoch-anchored and stored in UTC.
 * Read them with the UTC getters; the local ones drift by the server offset
 * (the documented timetable-seed bug). Mirrors settings/content.tsx.
 */
function periodTimeString(date: Date): string {
  const d = new Date(date)
  const h = String(d.getUTCHours()).padStart(2, "0")
  const m = String(d.getUTCMinutes()).padStart(2, "0")
  return `${h}:${m}`
}

/**
 * The school's real (physical) class slots for the active term — the options
 * behind the wizard's "Class" picker. Anchoring a session to one of these is
 * what turns it into the online delivery of a real class: it fills
 * teacher/subject/section from the schedule, lights the slot up on the weekly
 * timetable grid (`getLiveClassIndicators` keys on `timetableId`), and makes
 * the session attendance-capable (the sync needs sectionId + timetableId).
 *
 * Excluded: break periods (never a class — `Period.isBreak` is the source of
 * truth, never the name), slots with no section (nothing to take attendance
 * for) and slots with no teacher (`Conference.teacherId` is required).
 *
 * @param schoolId - School ID for multi-tenant filtering (REQUIRED)
 * @param teacherId - When set, only this teacher's slots (TEACHER-scoped view)
 */
/**
 * Hard ceiling on wizard slot options. Above any realistic term timetable —
 * see the note at the `take` below. Exported so the action can tell the caller
 * it truncated instead of silently serving a short list.
 */
export const SLOT_OPTION_CAP = 2000

export async function getLiveSlotOptions(
  schoolId: string,
  termId: string,
  teacherId?: string
): Promise<{ slots: LiveSlotOption[]; truncated: boolean }> {
  const slots = await db.timetable.findMany({
    where: {
      schoolId,
      termId,
      weekOffset: 0,
      sectionId: { not: null },
      teacherId: teacherId ?? { not: null },
      period: { isBreak: false },
    },
    select: {
      id: true,
      dayOfWeek: true,
      teacherId: true,
      subjectId: true,
      sectionId: true,
      subject: { select: { name: true } },
      section: {
        select: { name: true, grade: { select: { gradeNumber: true } } },
      },
      teacher: { select: { firstName: true, lastName: true } },
      period: { select: { name: true, startTime: true, endTime: true } },
    },
    orderBy: [{ dayOfWeek: "asc" }, { period: { startTime: "asc" } }],
    // A 15-section school running 6 days × 8 periods is 720 slots, and the
    // seeded Albayan term is 840 — the old cap of 500 silently dropped the end
    // of the WEEK (the ordering is day-then-time), so Thursday's classes could
    // not be scheduled online at all, with nothing in the UI to say so.
    // Raised past any realistic single-term timetable; the caller reports the
    // count so a school that somehow exceeds it is told, not truncated.
    take: SLOT_OPTION_CAP + 1,
  })

  const truncated = slots.length > SLOT_OPTION_CAP
  const rows = truncated ? slots.slice(0, SLOT_OPTION_CAP) : slots

  const options = rows.flatMap((s) =>
    s.teacherId && s.sectionId
      ? [
          {
            timetableId: s.id,
            dayOfWeek: s.dayOfWeek,
            periodName: s.period.name,
            startTime: periodTimeString(s.period.startTime),
            endTime: periodTimeString(s.period.endTime),
            teacherId: s.teacherId,
            teacherName:
              `${s.teacher?.firstName ?? ""} ${s.teacher?.lastName ?? ""}`.trim(),
            subjectId: s.subjectId,
            subjectName: s.subject?.name ?? "",
            sectionId: s.sectionId,
            sectionName: s.section?.name ?? "",
            gradeNumber: s.section?.grade?.gradeNumber ?? 0,
          },
        ]
      : []
  )
  return { slots: options, truncated }
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
 *
 * Catalog *structure* is platform-global, but the contributed content hanging
 * off a lesson is NOT: videos and materials carry their own approval state and
 * visibility, and this used to ignore both. Filtering only on
 * `catalogLessonId` listed every school's PRIVATE and still-PENDING
 * contributions to anyone who could open the session page, and handed out a
 * PAID video's URL with no purchase check. The gate below is the same one
 * `lumos/data/catalog/get-lesson-with-progress.ts` applies — keep them in
 * step.
 *
 * PAID videos are omitted outright rather than gated: this listing has no
 * per-user purchase context to gate them with.
 */
export async function getLessonReferenceContent(
  catalogLessonId: string,
  schoolId: string | null
): Promise<LessonReferenceContent> {
  const [videos, attachments, materials, questionCount] = await Promise.all([
    db.video.findMany({
      where: {
        catalogLessonId,
        approvalStatus: "APPROVED",
        OR: schoolId
          ? [
              { schoolId, visibility: { in: ["SCHOOL", "PUBLIC"] } },
              { visibility: "PUBLIC" },
            ]
          : [{ visibility: "PUBLIC" }],
        ...(schoolId
          ? { NOT: { overrides: { some: { schoolId, isHidden: true } } } }
          : {}),
      },
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
      where: {
        catalogLessonId,
        approvalStatus: "APPROVED",
        status: "PUBLISHED",
        OR: [
          { visibility: "PUBLIC" },
          ...(schoolId ? [{ contributedSchoolId: schoolId }] : []),
        ],
      },
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

  // Self-hosted files resolve to the authorizing Lumos routes; external links
  // (YouTube, someone else's host) stay as they are.
  return {
    videos: videos.map((v) => ({
      id: v.id,
      title: v.title,
      videoUrl: isExternallyHostedVideo(v.videoUrl)
        ? v.videoUrl
        : buildProtectedVideoUrl(v.id),
    })),
    attachments: attachments.map((a) => ({
      id: a.id,
      name: a.name,
      url: isOwnStorageUrl(a.url)
        ? buildProtectedFileUrl("attachment", a.id)
        : a.url,
    })),
    materials: materials.map((m) => ({
      id: m.id,
      title: m.title,
      type: m.type,
      fileUrl: m.fileUrl ? buildProtectedFileUrl("material", m.id) : null,
      externalUrl: m.externalUrl,
    })),
    questionCount,
  }
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
 * @param gradeNumber - When set, narrows lessons to chapters taught at this
 *   grade. `Chapter.grades` defaults to `[]` (not yet grade-tagged), so an
 *   `isEmpty` branch keeps untagged chapters visible instead of silently
 *   hiding most of the catalog.
 */
export async function getLiveClassReferenceData(
  schoolId: string,
  subjectId: string,
  gradeNumber?: number
): Promise<LiveClassReferenceData> {
  const [lessons, exams, assignments] = await Promise.all([
    db.lesson.findMany({
      where: {
        chapter: {
          subjectId,
          ...(gradeNumber
            ? {
                OR: [
                  { grades: { has: gradeNumber } },
                  { grades: { isEmpty: true } },
                ],
              }
            : {}),
        },
        status: "PUBLISHED",
      },
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

/**
 * Whether this school has opted into writing attendance from live-class
 * presence. One boolean, read on the session detail page so it can say which
 * way attendance is being handled for the session in front of you.
 */
export async function getAttendanceSyncEnabled(
  schoolId: string
): Promise<boolean> {
  const school = await db.school.findUnique({
    where: { id: schoolId },
    select: { conferenceAttendanceSync: true },
  })
  return school?.conferenceAttendanceSync ?? false
}

/**
 * The landing page's shared `where`.
 *
 * A teacher is staff, so `resolveViewerSectionScope` hands them the whole
 * school — right for the strip ("what is running here"), wrong for the hero,
 * which answers "when is YOUR next class". `teacherId` narrows to their own,
 * and is the only extra axis: students and guardians are already answered by
 * section scope.
 */
function landingScope(
  schoolId: string,
  opts: { sectionIds?: string[]; teacherId?: string }
): Prisma.ConferenceWhereInput {
  return {
    schoolId,
    deletedAt: null,
    ...(opts.sectionIds ? { sectionId: { in: opts.sectionIds } } : {}),
    ...(opts.teacherId ? { teacherId: opts.teacherId } : {}),
  }
}

/**
 * Two numbers for the landing hero: how many sessions are live right now, and
 * how many the whole school day holds.
 *
 * The day bounds come from `schoolDayWindow` in the SCHOOL's timezone, not the
 * runtime's — on Vercel the runtime is UTC, which would roll "today" over at
 * the wrong hour for every school that is not on it.
 *
 * Counts, not rows: the hero needs a number, and the strip below it is already
 * fetching the rows it shows.
 */
export async function getLiveLandingCounts(
  schoolId: string,
  opts: {
    sectionIds?: string[]
    teacherId?: string
    now: Date
    timeZone?: string
  }
): Promise<{ liveNow: number; todayTotal: number }> {
  const scope = landingScope(schoolId, opts)
  const { start, end } = schoolDayWindow(
    opts.timeZone || DEFAULT_SCHOOL_TZ,
    opts.now
  )

  const [liveNow, todayTotal] = await Promise.all([
    db.conference.count({ where: { ...scope, status: "live" } }),
    db.conference.count({
      where: {
        ...scope,
        status: { in: ["scheduled", "live", "ended"] },
        scheduledStart: { gte: start, lt: end },
      },
    }),
  ])

  return { liveNow, todayTotal }
}

/**
 * The handful of sessions the landing page puts in front of the reader:
 * everything currently live, then the next few still to start.
 *
 * Separate from `getLiveClassesList` because the landing page wants two
 * differently-ordered slices, not one paginated table — live sessions newest
 * first (you join the one that just started), upcoming soonest first (you look
 * at what is next). Both are section-scoped by the caller so a student never
 * sees another section's room.
 */
export async function getLiveLandingSessions(
  schoolId: string,
  opts: {
    sectionIds?: string[]
    teacherId?: string
    now: Date
    take?: number
  } = {
    now: new Date(),
  }
) {
  const take = opts.take ?? 4
  const scope = landingScope(schoolId, opts)

  const [live, upcoming] = await Promise.all([
    db.conference.findMany({
      where: { ...scope, status: "live" },
      orderBy: { scheduledStart: "desc" },
      take,
      include: landingSessionInclude,
    }),
    db.conference.findMany({
      where: {
        ...scope,
        status: "scheduled",
        scheduledStart: { gte: opts.now },
      },
      orderBy: { scheduledStart: "asc" },
      take,
      include: landingSessionInclude,
    }),
  ])

  return { live, upcoming }
}

/**
 * Live sessions attached to a catalog lesson, for the lesson page.
 *
 * `Conference.catalogLessonId` already pulls the lesson's videos and materials
 * onto the session detail page; nothing pointed the other way, so a student on
 * the lesson never learned a live session on it was running. Section-scoped by
 * the caller (`resolveViewerSectionScope`), same as every other list read.
 *
 * Live rows first, then today's upcoming ones — never ended sessions, which
 * are recordings territory. Small `take`: this decorates a page, it is not a
 * list.
 */
export async function getLiveSessionsForLesson(
  schoolId: string,
  catalogLessonId: string,
  opts: { sectionIds?: string[]; now?: Date; take?: number } = {}
): Promise<
  Array<{
    id: string
    title: string
    status: "live" | "scheduled"
    provider: "livekit" | "external"
    scheduledStart: Date
    scheduledEnd: Date
    sectionName: string | null
  }>
> {
  const now = opts.now ?? new Date()
  const take = opts.take ?? 3
  const rows = await db.conference.findMany({
    where: {
      schoolId,
      catalogLessonId,
      deletedAt: null,
      ...(opts.sectionIds ? { sectionId: { in: opts.sectionIds } } : {}),
      OR: [
        { status: "live" },
        // Today's remaining sessions: scheduled and not yet over.
        { status: "scheduled", scheduledEnd: { gte: now } },
      ],
    },
    select: {
      id: true,
      title: true,
      status: true,
      provider: true,
      scheduledStart: true,
      scheduledEnd: true,
      section: { select: { name: true } },
    },
    orderBy: [{ status: "asc" }, { scheduledStart: "asc" }],
    take,
  })
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    status: r.status as "live" | "scheduled",
    provider: r.provider,
    scheduledStart: r.scheduledStart,
    scheduledEnd: r.scheduledEnd,
    sectionName: r.section?.name ?? null,
  }))
}
