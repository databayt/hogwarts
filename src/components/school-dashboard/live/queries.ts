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

import { Prisma, type ConferenceVisibility } from "@prisma/client"

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
  // The byline's avatar. Overridden here rather than in the list include for
  // the same reason `subject` is: the sessions TABLE renders no imagery and
  // should not pay for the column.
  teacher: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      profilePhotoUrl: true,
    },
  },
  // The card's second and third rows. Only a session a teacher has ANCHORED to
  // a catalog lesson has these — a slot materialized from the timetable knows
  // its subject but not which lesson of it is being taught today, because
  // nothing in this product schedules curriculum against dates. So both rows
  // are legitimately absent most of the time and the card omits them rather
  // than printing empties.
  catalogLesson: {
    select: {
      id: true,
      name: true,
      chapter: { select: { id: true, name: true } },
    },
  },
  // The badge beside the card's heading. `Section.name` is "Grade 7-A" — the
  // section INCLUDING its letter — so the grade has to come off the grade row
  // itself rather than be parsed back out of it.
  section: {
    select: {
      id: true,
      name: true,
      grade: { select: { id: true, name: true } },
    },
  },
  // Is there anything to catch up WITH. Only `ready` counts: a row still
  // `pending` or `processing` has no S3 object behind it, and `expired` has
  // had it deleted by the retention cron — offering any of the three sends a
  // student who missed a class to a player that cannot play. `take: 1` because
  // the card asks a yes/no question, not for the list.
  recordings: {
    where: { status: "ready" as const, deletedAt: null },
    select: { id: true },
    take: 1,
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
 * school. On the landing page that is the wrong question: a teacher opening
 * /live is asking "what am *I* teaching", not "what is running in the
 * building". So `teacherId` narrows BOTH the strip and the counts, and the
 * school-wide view stays one click away on /live/dashboard.
 *
 * `Conference.teacherId` references Teacher.id, not User.id — callers must map
 * the session's user through `db.teacher`, the way the schedule form does.
 *
 * It is the only extra axis: students and guardians are already answered by
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
 * Classes that already happened AND that this reader was not in — the catch-up
 * shelf.
 *
 * "Missed" is answered from presence, not from attendance: a
 * `ConferenceParticipant` row carries `joinedAt` only once someone actually
 * reached the room, and rows are created lazily at join time rather than
 * fanned out to a roster in advance. So "no row with a `joinedAt`" IS the
 * signal, and it needs no opt-in — unlike `Attendance`, which is written only
 * by schools that turned `conferenceAttendanceSync` on, and only for LiveKit
 * sessions.
 *
 * `attendeeUserIds` is WHOSE presence counts, which is not always the reader's:
 * a guardian catches up on the classes their CHILDREN missed, not the ones
 * they personally did not sit in. Empty or omitted means no attendance filter
 * at all, and the shelf degrades to "recently ended" — which is what it
 * amounts to for an admin anyway, since a school administrator joins none of
 * these rooms and has therefore missed every one of them.
 *
 * Deliberately NOT a recordings list. Every recording surface in this block is
 * gated on `isRecordingConfigured()`, and a school that has never provisioned
 * the bucket has none at all — the shelf would be permanently invisible. An
 * ended session exists the moment the room closes, carries the same subject
 * artwork as a live one, and links to the session page, which is where the
 * lesson's materials live whether or not a recording was ever made.
 */
export async function getLiveLandingCatchUp(
  schoolId: string,
  opts: {
    sectionIds?: string[]
    teacherId?: string
    attendeeUserIds?: string[]
    take?: number
  } = {}
) {
  const scope = landingScope(schoolId, opts)
  const attended = opts.attendeeUserIds?.length
    ? {
        NOT: {
          participants: {
            some: {
              userId: { in: opts.attendeeUserIds },
              joinedAt: { not: null },
            },
          },
        },
      }
    : {}

  return db.conference.findMany({
    where: { ...scope, ...attended, status: "ended" },
    // `id` breaks the tie: a seeded school schedules a whole grade into the
    // same minute, and without it the page reorders between renders.
    orderBy: [{ scheduledStart: "desc" }, { id: "desc" }],
    take: opts.take ?? 12,
    include: landingSessionInclude,
  })
}

/**
 * The handful of recordings worth putting in front of THIS reader.
 *
 * Relevance is two rules, and both are per-reader rather than per-school. A
 * recording of a class the reader MISSED outranks one of a class they sat
 * through — the recording of a lesson you were in is a revision aid, the
 * recording of one you missed is the lesson — and recency breaks the tie.
 * Two students in the same section are therefore shown different pairs.
 *
 * The miss is resolved from the same presence rows the catch-up shelf reads,
 * but it cannot be a `where` here the way it is there: a reader who missed
 * nothing would then be offered no recordings at all, when what they want is
 * simply the most recent ones. So the filter comes back as a per-row PROBE —
 * a `take: 1` include of the attendee's own joined participant row — and the
 * ranking happens in memory over a small candidate set.
 *
 * `status: "ready"` only, on the recording: `pending` and `processing` have no
 * S3 object yet and `expired` has had it deleted by the retention cron, so any
 * of the three would hand a reader a player that cannot play.
 */
export async function getLiveLandingRecordings(
  schoolId: string,
  opts: {
    sectionIds?: string[]
    teacherId?: string
    attendeeUserIds?: string[]
    take?: number
    candidates?: number
  } = {}
) {
  const scope = landingScope(schoolId, opts)
  const attendees = opts.attendeeUserIds ?? []

  const rows = await db.conference.findMany({
    where: {
      ...scope,
      status: "ended",
      recordings: { some: { status: "ready", deletedAt: null } },
    },
    orderBy: [{ scheduledStart: "desc" }, { id: "desc" }],
    // Over-fetch, then rank: the ordering the reader gets is not the ordering
    // the database can express, so the candidate set has to be big enough that
    // a missed class further back can still overtake a recent attended one.
    take: opts.candidates ?? 20,
    include: {
      ...landingSessionInclude,
      // The probe. With no attendee to check — a reader the page could not
      // resolve a user id for — `id: ""` matches nothing on purpose, so every
      // row comes back with an empty array and the ranking below degrades to
      // plain recency. It is a deliberate no-op, not a stray filter.
      participants: attendees.length
        ? {
            where: { userId: { in: attendees }, joinedAt: { not: null } },
            select: { id: true },
            take: 1,
          }
        : { where: { id: "" }, select: { id: true }, take: 1 },
    },
  })

  return rankRecordings(rows).slice(0, opts.take ?? 2)
}

/**
 * The ranking itself, kept pure so it can be pinned by a test.
 *
 * Missed first, then newest. The input arrives newest-first from the database
 * and `Array.prototype.sort` is stable, so ordering on the one boolean key
 * preserves recency INSIDE each group without a second comparator. Extracted
 * from the query because this is the behaviour the section exists for: a
 * refactor that quietly reduced it to "the two most recent" would look right
 * on any demo where the missed classes happen to also be the recent ones.
 */
export function rankRecordings<T extends { participants: unknown[] }>(
  rows: T[]
): T[] {
  return [...rows].sort(
    (a, b) =>
      Number(a.participants.length > 0) - Number(b.participants.length > 0)
  )
}

/**
 * Whose presence decides that a class was missed.
 *
 * The reader themselves, except for a GUARDIAN: a parent opening /live is
 * asking what their children have to catch up on, and their own attendance
 * says nothing about that. A guardian with no ward rows falls back to their
 * own id rather than to an empty list — an empty list disables the filter
 * entirely, which would quietly turn "what my child missed" into "everything
 * that ended".
 *
 * Staff get their own id too, and that is not a mistake: an admin who never
 * joins a room has genuinely missed every class, so the filter removes nothing
 * and the shelf reads as "recently taught" for them.
 */
export async function resolveCatchUpAttendees(
  schoolId: string,
  userId: string | undefined | null,
  role: string | null | undefined
): Promise<string[]> {
  if (!userId || !role) return []
  if (role !== "GUARDIAN") return [userId]

  const guardians = await db.guardian.findMany({
    where: { schoolId, userId },
    select: {
      studentGuardians: {
        select: { student: { select: { userId: true } } },
      },
    },
  })
  const wards = [
    ...new Set(
      guardians
        .flatMap((g) => g.studentGuardians.map((sg) => sg.student?.userId))
        .filter((x): x is string => Boolean(x))
    ),
  ]
  return wards.length > 0 ? wards : [userId]
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

/**
 * The one session behind the room's title card.
 *
 * Deliberately `landingSessionInclude` rather than a third select: the card in
 * front of the room and the cards on the landing page show the same facts
 * about the same row — subject artwork, the grade off the section, the
 * teacher, the anchored chapter and lesson — and a select written twice is a
 * select that disagrees with itself by next month.
 *
 * NOT a permission gate. The caller has already proved this viewer may see
 * this session (the room page runs `getLiveClass`, which is enrollment-gated);
 * this is the read that follows, scoped by the tenant it was authorized in.
 */
export async function findRoomCardSession(schoolId: string, id: string) {
  return db.conference.findFirst({
    where: { id, schoolId, deletedAt: null },
    include: landingSessionInclude,
  })
}

/**
 * The rest of the class's own series — the shelf that runs under the room's
 * title card, the reference app's "Season 2".
 *
 * "Its series" is the SECTION's other sessions: a class is one meeting of a
 * group that meets many times, and the group is the only axis that is
 * populated for every session in the product. The obvious alternative —
 * sibling lessons of the anchored catalog lesson — exists only when a teacher
 * anchored one through the wizard, which `landingSessionInclude` already
 * records as the uncommon case, so a shelf built on it would be empty on most
 * classes and the page would be one screen again.
 *
 * Ordered as a season reads: the few that already happened, then the ones
 * still to come. Two queries rather than one window because the interesting
 * slice is around NOW, and a single `orderBy` over the whole table would
 * either start at the beginning of the year or need an offset nobody can
 * compute.
 *
 * NOT a permission gate — but it MUST NOT widen the one that already ran, and
 * the branch here is what keeps it honest. `canAccessSession` admits a
 * STUDENT or GUARDIAN to a `visibility: "school"` session on school membership
 * ALONE, whatever section the row happens to name — so keying the shelf on
 * `sectionId` would list a stranger section's `section`-visible classes, with
 * their subject, time and lesson, to a reader who was only ever let in
 * school-wide. `getLiveClass` returns NOT_FOUND rather than UNAUTHORIZED
 * precisely so other sections' sessions are not revealed to EXIST; a shelf
 * that names them undoes that.
 *
 * So the series is whatever admitted the reader: a school-wide session gets
 * the school's other school-wide sessions, and only a section-scoped one gets
 * the section's timetable.
 */
export async function findRoomShelfSessions(
  schoolId: string,
  opts: {
    sessionId: string
    sectionId: string | null
    visibility: ConferenceVisibility
    now: Date
  }
) {
  const base: Prisma.ConferenceWhereInput = {
    schoolId,
    deletedAt: null,
    id: { not: opts.sessionId },
    ...(opts.sectionId && opts.visibility !== "school"
      ? { sectionId: opts.sectionId }
      : { visibility: "school" }),
  }

  const [past, upcoming] = await Promise.all([
    db.conference.findMany({
      where: { ...base, scheduledStart: { lt: opts.now } },
      orderBy: { scheduledStart: "desc" },
      take: 4,
      include: landingSessionInclude,
    }),
    db.conference.findMany({
      where: { ...base, scheduledStart: { gte: opts.now } },
      orderBy: { scheduledStart: "asc" },
      take: 8,
      include: landingSessionInclude,
    }),
  ])

  return [...past.reverse(), ...upcoming]
}

/**
 * The catalog lessons of the class's subject — the reference's "Related".
 *
 * Its own related row offers other things to WATCH, so this offers the same:
 * the self-study lessons behind the subject being taught, which is where a
 * student goes when the class has ended and they are still lost. Deliberately
 * NOT other sections' sessions of the same subject — those are exactly the
 * rows `findRoomShelfSessions` refuses to name, for the reason recorded there.
 *
 * `Subject` IS the catalog subject and `Conference.subjectId` reaches it with
 * no extra join, so this needs nothing the card did not already fetch.
 *
 * The school's own hides apply: `ContentOverride.isHidden` is the row the
 * lumos catalog filters on, and offering a lesson the school has switched off
 * would send a reader to a page their own LMS does not serve.
 */
export async function findRoomRelatedLessons(
  schoolId: string,
  opts: { subjectId: string | null; excludeLessonId?: string | null }
) {
  if (!opts.subjectId) return []
  return db.lesson.findMany({
    where: {
      chapter: { subjectId: opts.subjectId },
      status: "PUBLISHED",
      ...(opts.excludeLessonId ? { id: { not: opts.excludeLessonId } } : {}),
      NOT: { overrides: { some: { schoolId, isHidden: true } } },
    },
    orderBy: [{ sequenceOrder: "asc" }, { id: "asc" }],
    take: 12,
    select: {
      id: true,
      name: true,
      description: true,
      thumbnail: true,
      color: true,
      durationMinutes: true,
      chapter: {
        select: { name: true, subject: { select: { slug: true } } },
      },
    },
  })
}

/**
 * Who is in the class — the reference's "Cast & Crew".
 *
 * The host first, then the section's roster, which is the honest reading of
 * that row for something thirty people attend together.
 *
 * The roster is returned ONLY for a section-scoped session, and that is a
 * privacy boundary rather than a tidiness one. `canAccessSession` admits a
 * STUDENT or GUARDIAN to a `visibility: "school"` session on school membership
 * alone, so a school-wide assembly can be opened by anyone in the school —
 * naming one section's children to all of them is not something the assembly
 * gave permission for. For a section-scoped session every viewer is either
 * staff or a member of that same section, which is the group already listed to
 * each other on the roster, the attendance sheet and the in-room panel.
 */
export async function findRoomClassPeople(
  schoolId: string,
  opts: {
    sectionId: string | null
    visibility: ConferenceVisibility
  }
) {
  if (!opts.sectionId || opts.visibility === "school") return []
  return db.student.findMany({
    where: { schoolId, sectionId: opts.sectionId },
    orderBy: [{ firstName: "asc" }, { id: "asc" }],
    take: 24,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      profilePhotoUrl: true,
    },
  })
}
