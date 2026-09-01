"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { randomUUID } from "node:crypto"
import { revalidatePath } from "next/cache"
import { after } from "next/server"
import { auth } from "@/auth"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import type { Role } from "@/lib/rbac/types"
import { getTenantContext } from "@/lib/tenant-context"
import { resolveActiveTerm } from "@/lib/term-resolver"
import {
  schoolCalendarDayOf,
  schoolTimeStringOf,
  schoolWallTimeToUtc,
} from "@/lib/timezone"
import { prewarm } from "@/components/translation/prewarm"
import { detectLang, withLang } from "@/components/translation/util"

import {
  conferenceListRevalidatePaths,
  conferenceRevalidatePath,
} from "./actions/helpers"
import {
  notifyClassCancelled,
  notifyClassScheduled,
} from "./actions/notifications"
import { DEFAULT_SCHOOL_TZ } from "./day-window"
import { canDeleteLiveClasses, canManageLiveClasses } from "./list-permissions"
import {
  getLiveClassesSchema,
  liveClassSchema,
  updateLiveClassSchema,
  type LiveClassFormData,
  type LiveClassResourceInput,
  type UpdateLiveClassData,
} from "./list-validation"
import { isLiveKitConfigured } from "./livekit/client"
import { roomNameFor } from "./livekit/room-naming"
import { getProviderAdapter, type ProviderId } from "./providers"
import {
  getConferenceSlotOptions,
  getLiveClassDetail,
  getLiveClassesList,
  getLiveClassReferenceData,
  resolveViewerSectionScope,
  type ConferenceSlotOption,
  type LiveClassReferenceData,
} from "./queries"

/** Form tri-state → stored override: default = inherit the school. */
function joinMutedFromForm(
  v: "default" | "muted" | "open" | undefined
): boolean | null | undefined {
  if (v === undefined) return undefined
  return v === "default" ? null : v === "muted"
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Combine a picked calendar day and an "HH:mm" wall-clock time into the UTC
 * instant they denote in the SCHOOL's timezone. Never combine with
 * `setHours()` — that reads the server TZ (UTC on Vercel), which shifts every
 * stored instant by the school's UTC offset (10:00 entered → 14:00 shown in
 * Dubai) and breaks the reminder/live-now windows.
 *
 * The wizard sends the picked day as a browser-local-midnight Date; the day
 * the user MEANT is that instant read in the school TZ (browser ≈ school TZ
 * for school staff). Known edge: a browser far east of the school TZ
 * submitting near midnight can land on the previous school day — accepted.
 */
function combineDateAndTime(date: Date, time: string, timeZone: string): Date {
  const { year, month, day } = schoolCalendarDayOf(date, timeZone)
  const [h, m] = time.split(":").map((n) => parseInt(n, 10))
  return schoolWallTimeToUtc(timeZone, year, month, day, h ?? 0, m ?? 0)
}

/** Map the form's free-text provider label to a provider-adapter id. */
function mapMeetingProviderToId(provider?: string | null): ProviderId {
  const p = (provider ?? "").toLowerCase()
  if (p.includes("google") || p.includes("meet")) return "google_meet"
  if (p.includes("zoom")) return "zoom"
  if (p.includes("teams")) return "teams"
  return "external"
}

/**
 * Tenant-verify attached references before writing ConferenceResource rows.
 * Every exam/assignment id must belong to this school — a foreign id is a
 * validation failure, never a silent skip. Returns the rows ready to insert.
 */
async function verifyResourceRefs(
  schoolId: string,
  resources: LiveClassResourceInput[]
): Promise<
  { ok: true; rows: Omit<LiveClassResourceInput, "url">[] } | { ok: false }
> {
  const examIds = [
    ...new Set(
      resources.map((r) => r.schoolExamId).filter((x): x is string => !!x)
    ),
  ]
  const assignmentIds = [
    ...new Set(
      resources.map((r) => r.schoolAssignmentId).filter((x): x is string => !!x)
    ),
  ]
  const [examCount, assignmentCount] = await Promise.all([
    examIds.length
      ? db.schoolExam.count({ where: { id: { in: examIds }, schoolId } })
      : Promise.resolve(0),
    assignmentIds.length
      ? db.schoolAssignment.count({
          where: { id: { in: assignmentIds }, schoolId },
        })
      : Promise.resolve(0),
  ])
  if (examCount !== examIds.length) return { ok: false }
  if (assignmentCount !== assignmentIds.length) return { ok: false }
  return { ok: true, rows: resources }
}

/** Replace a session's resource rows (tenant-scoped, ordered). */
async function writeResources(
  schoolId: string,
  sessionId: string,
  resources: LiveClassResourceInput[]
): Promise<void> {
  await db.$transaction([
    db.conferenceResource.deleteMany({ where: { schoolId, sessionId } }),
    ...(resources.length
      ? [
          db.conferenceResource.createMany({
            data: resources.map((r, i) => ({
              schoolId,
              sessionId,
              schoolExamId: r.schoolExamId || null,
              schoolAssignmentId: r.schoolAssignmentId || null,
              url: r.url || null,
              title: r.title || null,
              order: i,
            })),
          }),
        ]
      : []),
  ])
}

/** A catalog lesson id must exist before we point a session at it. */
async function lessonExists(catalogLessonId: string): Promise<boolean> {
  const n = await db.lesson.count({ where: { id: catalogLessonId } })
  return n > 0
}

// ============================================================================
// Read actions
// ============================================================================

export async function getLiveClasses(params: {
  page?: number
  perPage?: number
  title?: string
  status?: string
}): Promise<ActionResponse<{ rows: unknown[]; total: number }>> {
  try {
    const session = await auth()
    const { schoolId } = await getTenantContext()
    const role = session?.user?.role as Role | undefined

    if (!session?.user) return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    if (!role) return actionError(ACTION_ERRORS.UNAUTHORIZED)

    // Server actions are public endpoints — never feed raw client params into
    // a query. The schema clamps perPage (≤200) and types page/title/status.
    const parsedParams = getLiveClassesSchema.safeParse(params ?? {})
    if (!parsedParams.success) {
      return actionError(ACTION_ERRORS.VALIDATION_ERROR)
    }
    const q = parsedParams.data

    // Role-scope rows: STUDENT/GUARDIAN only see their own section's sessions
    // (and never another section's meetingUrl); staff see the whole school.
    const scope = await resolveViewerSectionScope(
      schoolId,
      session.user.id,
      role
    )
    if (scope === "none") {
      return { success: true, data: { rows: [], total: 0 } }
    }

    const { rows, count } = await getLiveClassesList(schoolId, {
      title: q.title,
      status: q.status,
      page: q.page,
      perPage: q.perPage,
      sectionIds: scope === "all" ? undefined : scope.sectionIds,
    })

    return {
      success: true,
      data: {
        rows: rows.map((r) => ({
          id: r.id,
          title: r.title,
          lang: r.lang,
          teacherId: r.teacherId,
          teacherName:
            `${r.teacher?.firstName ?? ""} ${r.teacher?.lastName ?? ""}`.trim(),
          subjectId: r.subjectId,
          subjectName: r.subject?.name ?? null,
          sectionId: r.sectionId,
          sectionName: r.section?.name ?? null,
          status: r.status,
          provider: r.provider,
          visibility: r.visibility,
          meetingUrl: r.meetingUrl,
          meetingProvider: r.meetingProvider,
          scheduledStart: r.scheduledStart.toISOString(),
          scheduledEnd: r.scheduledEnd.toISOString(),
          createdAt: r.createdAt.toISOString(),
        })),
        total: count,
      },
    }
  } catch (error) {
    console.error("[getLiveClasses]", error)
    return actionError(ACTION_ERRORS.LOAD_FAILED)
  }
}

export async function getLiveClass(params: { id: string }): Promise<
  ActionResponse<{
    id: string
    title: string
    description: string | null
    /** Non-null = anchored to a timetable slot; the form locks who/what then. */
    timetableId: string | null
    teacherId: string
    subjectId: string | null
    sectionId: string | null
    provider: string
    visibility: string
    meetingUrl: string | null
    meetingProvider: string | null
    scheduledStart: string
    scheduledEnd: string
    status: string
    recordingEnabled: boolean
    studentsJoinMuted: boolean | null
    maxParticipants: number
    catalogLessonId: string | null
    resources: {
      schoolExamId: string | null
      schoolAssignmentId: string | null
      url: string | null
      title: string | null
    }[]
  }>
> {
  try {
    const session = await auth()
    const { schoolId } = await getTenantContext()
    const role = session?.user?.role as Role | undefined

    if (!session?.user) return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const liveClass = await getLiveClassDetail(schoolId, params.id)
    if (!liveClass) return actionError(ACTION_ERRORS.NOT_FOUND)

    // Enrollment-level access: STUDENT/GUARDIAN may only read a session in a
    // section they (or their ward) belong to — or any school-wide session
    // (`visibility: school`), mirroring buildLiveClassWhere's list OR. Return
    // NOT_FOUND (not UNAUTHORIZED) so the existence of other sections'
    // sessions isn't revealed.
    const scope = await resolveViewerSectionScope(
      schoolId,
      session.user.id,
      role
    )
    if (
      scope === "none" ||
      (scope !== "all" &&
        liveClass.visibility !== "school" &&
        (!liveClass.sectionId ||
          !scope.sectionIds.includes(liveClass.sectionId)))
    ) {
      return actionError(ACTION_ERRORS.NOT_FOUND)
    }

    return {
      success: true,
      data: {
        id: liveClass.id,
        title: liveClass.title,
        description: liveClass.description,
        timetableId: liveClass.timetableId,
        teacherId: liveClass.teacherId,
        subjectId: liveClass.subjectId,
        sectionId: liveClass.sectionId,
        provider: liveClass.provider,
        visibility: liveClass.visibility,
        meetingUrl: liveClass.meetingUrl,
        meetingProvider: liveClass.meetingProvider,
        scheduledStart: liveClass.scheduledStart.toISOString(),
        scheduledEnd: liveClass.scheduledEnd.toISOString(),
        status: liveClass.status,
        recordingEnabled: liveClass.recordingEnabled,
        studentsJoinMuted: liveClass.studentsJoinMuted ?? null,
        maxParticipants: liveClass.maxParticipants,
        catalogLessonId: liveClass.catalogLessonId,
        resources: liveClass.resources.map((r) => ({
          schoolExamId: r.schoolExamId,
          schoolAssignmentId: r.schoolAssignmentId,
          url: r.url,
          title: r.title,
        })),
      },
    }
  } catch (error) {
    console.error("[getLiveClass]", error)
    return actionError(ACTION_ERRORS.LOAD_FAILED)
  }
}

/**
 * Reference-picker options for the wizard's References step, scoped to one
 * subject. Management data — same gate as the form rosters. Called on demand
 * when a subject is chosen (never on form mount — request-storm rule).
 */
export async function getLiveClassReferenceOptions(params: {
  subjectId: string
  /** Section's grade — narrows catalog lessons to that grade's chapters. */
  gradeNumber?: number
}): Promise<ActionResponse<LiveClassReferenceData>> {
  try {
    const session = await auth()
    const { schoolId } = await getTenantContext()
    const role = session?.user?.role as Role | undefined

    if (!session?.user) return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    if (!canManageLiveClasses(role)) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }
    if (!params.subjectId) {
      return {
        success: true,
        data: { lessons: [], exams: [], assignments: [] },
      }
    }

    const data = await getLiveClassReferenceData(
      schoolId,
      params.subjectId,
      params.gradeNumber
    )
    return { success: true, data }
  } catch (error) {
    console.error("[getLiveClassReferenceOptions]", error)
    return actionError(ACTION_ERRORS.LOAD_FAILED)
  }
}

/**
 * The school's real class slots for the active term — the wizard's "Class"
 * picker. Fetched on demand when the wizard opens (never as page props: a
 * term's timetable is easily 1000+ rows and would bloat every /live
 * load). TEACHERs see only their own slots; staff see the whole schedule.
 */
export async function getConferenceSlots(): Promise<
  ActionResponse<ConferenceSlotOption[]>
> {
  try {
    const session = await auth()
    const { schoolId } = await getTenantContext()
    const role = session?.user?.role as Role | undefined

    if (!session?.user) return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    if (!canManageLiveClasses(role)) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    const { term } = await resolveActiveTerm(schoolId)
    if (!term) return { success: true, data: [] }

    // A teacher scheduling online classes picks from their OWN timetable —
    // mirrors the ownership rule the rich `createLiveClassFromTimetable` path
    // enforces. Staff/admins schedule for the whole school.
    let ownTeacherId: string | undefined
    if (role === "TEACHER") {
      const teacher = await db.teacher.findFirst({
        where: { schoolId, userId: session.user.id },
        select: { id: true },
      })
      if (!teacher) return { success: true, data: [] }
      ownTeacherId = teacher.id
    }

    const { slots, truncated } = await getConferenceSlotOptions(
      schoolId,
      term.id,
      ownTeacherId
    )
    if (truncated) {
      // Never truncate silently — a wizard that quietly omits half the week
      // looks like a school with half a timetable.
      console.warn("[getConferenceSlots] slot options truncated", {
        schoolId,
        termId: term.id,
        returned: slots.length,
      })
    }
    return { success: true, data: slots }
  } catch (error) {
    console.error("[getConferenceSlots]", error)
    return actionError(ACTION_ERRORS.LOAD_FAILED)
  }
}

// ============================================================================
// Write actions
// ============================================================================

export async function createLiveClass(
  data: LiveClassFormData
): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await auth()
    const { schoolId } = await getTenantContext()
    const role = session?.user?.role as Role | undefined

    if (!session?.user) return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    if (!canManageLiveClasses(role)) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    const validated = liveClassSchema.safeParse(data)
    if (!validated.success) {
      return actionError(ACTION_ERRORS.VALIDATION_ERROR)
    }
    const d = validated.data

    // When the session is anchored to a real class, the TIMETABLE SLOT is
    // authoritative: teacher/subject/section come from the schedule row, not
    // from the client's copies (which a crafted payload could mismatch —
    // e.g. section A's roster attached to section B's period). Mirrors the
    // derivation in actions/sessions.ts createLiveClassFromTimetable so the
    // two entry points can never disagree.
    let timetableId: string | null = null
    let teacherId = d.teacherId
    let subjectId = d.subjectId || null
    let sectionId = d.sectionId || null

    if (d.timetableId) {
      const slot = await db.timetable.findFirst({
        where: { id: d.timetableId, schoolId },
        select: {
          id: true,
          teacherId: true,
          subjectId: true,
          sectionId: true,
        },
      })
      if (!slot) return actionError(ACTION_ERRORS.NOT_FOUND)
      // Conference.teacherId is required and attendance needs a roster, so an
      // unassigned or sectionless slot can't anchor a session.
      if (!slot.teacherId || !slot.sectionId) {
        return actionError(ACTION_ERRORS.VALIDATION_ERROR)
      }
      timetableId = slot.id
      teacherId = slot.teacherId
      subjectId = slot.subjectId
      sectionId = slot.sectionId
    }

    // Verify the teacher belongs to this school (tenant safety on a FK we
    // set). userId feeds the HOST participant upsert on the in-app-room path.
    // A slot-derived teacherId is already school-scoped; this also covers the
    // ad-hoc path where the client picked the teacher.
    const teacher = await db.teacher.findFirst({
      where: { id: teacherId, schoolId },
      select: { id: true, userId: true },
    })
    if (!teacher) return actionError(ACTION_ERRORS.TEACHER_NOT_FOUND)

    // Honor the school recording default AND the per-section opt-out (mirrors
    // actions/sessions.ts) so a section flagged "never record" stays off.
    const [schoolCfg, sectionCfg] = await Promise.all([
      db.school.findUnique({
        where: { id: schoolId },
        select: {
          conferenceRecordingDefault: true,
          conferenceMaxDuration: true,
          timezone: true,
        },
      }),
      sectionId
        ? db.section.findFirst({
            where: { id: sectionId, schoolId },
            select: { conferenceRecordingOptOut: true },
          })
        : Promise.resolve(null),
    ])
    // In-app rooms honor the form's recording toggle; external links keep the
    // school default (nothing to record without the SFU). The section opt-out
    // always wins.
    const recordingEnabled =
      (d.provider === "livekit"
        ? (d.recordingEnabled ?? schoolCfg?.conferenceRecordingDefault ?? true)
        : (schoolCfg?.conferenceRecordingDefault ?? true)) &&
      !(sectionCfg?.conferenceRecordingOptOut ?? false)

    const schoolTz = schoolCfg?.timezone || DEFAULT_SCHOOL_TZ
    const scheduledStart = combineDateAndTime(
      d.startDate,
      d.startTime,
      schoolTz
    )
    const scheduledEnd = combineDateAndTime(d.endDate, d.endTime, schoolTz)

    // Ordering is re-checked here, not just in the schema: the duration cap
    // below divides these two instants, and a negative duration is never
    // `> cap` — so without this an inverted schedule would slip BOTH guards.
    if (scheduledEnd.getTime() <= scheduledStart.getTime()) {
      return actionError(ACTION_ERRORS.VALIDATION_ERROR)
    }

    // In-app rooms hold an SFU slot — enforce the per-school duration cap
    // (external links are just calendar entries; no resource to cap).
    if (d.provider === "livekit") {
      const durationMin =
        (scheduledEnd.getTime() - scheduledStart.getTime()) / 60_000
      if (durationMin > (schoolCfg?.conferenceMaxDuration ?? 240)) {
        return actionError(ACTION_ERRORS.LIVE_CLASS_MAX_DURATION_EXCEEDED)
      }
    }

    // Tenant-verify attached references before anything is written.
    const resources = d.resources ?? []
    const verifiedRefs = await verifyResourceRefs(schoolId, resources)
    if (!verifiedRefs.ok) return actionError(ACTION_ERRORS.VALIDATION_ERROR)
    if (d.catalogLessonId && !(await lessonExists(d.catalogLessonId))) {
      return actionError(ACTION_ERRORS.VALIDATION_ERROR)
    }

    // Single-language storage: detect lang from title and stamp it.
    const content = withLang(
      { title: d.title, description: d.description ?? null },
      detectLang(d.title)
    )

    // Stable id reused as the SFU-less roomName AND the provider idempotency
    // key (sessionId), so a provider retry returns the same meeting instead of
    // colliding with another class at the same start time.
    const sessionRef = randomUUID()

    // Fields shared by both providers.
    const commonData = {
      schoolId,
      // Slot-derived when anchored to a real class, client-picked otherwise.
      timetableId,
      teacherId,
      subjectId,
      sectionId,
      scheduledStart,
      scheduledEnd,
      // Always born `scheduled` — status is not a create input (a crafted
      // payload must not mint a session already `live`, which would skip room
      // provisioning and inflate the concurrent-room cap).
      status: "scheduled" as const,
      visibility: d.visibility ?? "section",
      catalogLessonId: d.catalogLessonId || null,
      recordingEnabled,
      studentsJoinMuted: joinMutedFromForm(d.studentsJoinMuted) ?? null,
      maxParticipants: d.maxParticipants ?? 50,
      title: content.title,
      description: content.description,
      lang: content.lang,
    } as const

    // The wizard only offers LiveKit when the SFU is provisioned
    // (`liveKitAvailable` → `disabled` on the radio), but that is a CLIENT gate
    // and a server action is a public endpoint. Without this check a crafted
    // POST mints a `provider: "livekit"` row with a real roomName against an SFU
    // that does not exist — the row then fails at start/join time instead of at
    // create time, which reads to a teacher as a broken class rather than an
    // unavailable option. Provider is immutable on edit, so this is the only
    // place the choice can enter.
    if (d.provider === "livekit" && !isLiveKitConfigured()) {
      return actionError(ACTION_ERRORS.LIVE_CLASS_PROVIDER_UNAVAILABLE)
    }

    let created: { id: string }
    let meetingUrl: string | null = d.meetingUrl || null

    if (d.provider === "livekit") {
      // In-app SFU room — mirror actions/sessions.ts: create with a
      // placeholder, then stamp the tenant-namespaced roomName containing the
      // cuid so the SFU namespace can't collide or leak across schools.
      created = await db.conference.create({
        data: {
          ...commonData,
          provider: "livekit",
          roomName: `pending-${sessionRef}`,
          meetingUrl: null,
          meetingProvider: null,
        },
        select: { id: true },
      })
      await db.conference.update({
        where: { id: created.id },
        data: { roomName: roomNameFor(schoolId, created.id) },
      })
      // Auto-invite the teacher as HOST; students/observers resolve lazily on
      // join via the section roster (or school-wide visibility).
      if (teacher.userId) {
        await db.conferenceParticipant.upsert({
          where: {
            sessionId_userId: {
              sessionId: created.id,
              userId: teacher.userId,
            },
          },
          create: {
            schoolId,
            sessionId: created.id,
            userId: teacher.userId,
            role: "HOST",
          },
          update: { role: "HOST" },
        })
      }
      meetingUrl = null
    } else {
      // When a native provider (Meet/Zoom/Teams) is configured, auto-generate
      // a fresh meeting link via its API; otherwise keep the pasted URL. Ships
      // dark — a no-op until the provider's OAuth credentials are present.
      const providerId = mapMeetingProviderToId(d.meetingProvider)
      if (providerId !== "external") {
        const adapter = getProviderAdapter(providerId)
        if (adapter.isConfigured()) {
          try {
            const meeting = await adapter.createMeeting({
              schoolId,
              title: content.title,
              scheduledStart,
              scheduledEnd,
              hostUserId: session.user.id ?? "",
              sessionId: sessionRef,
            })
            meetingUrl = meeting.joinUrl
          } catch (err) {
            console.error(
              "[createLiveClass] provider createMeeting failed:",
              err
            )
            // Only fall back silently when the user supplied a manual URL as a
            // safety net; otherwise surface the failure instead of creating a
            // class with no working join link.
            if (!d.meetingUrl) {
              return actionError(ACTION_ERRORS.LIVE_CLASS_PROVIDER_UNAVAILABLE)
            }
          }
        }
      }

      created = await db.conference.create({
        data: {
          ...commonData,
          provider: "external",
          // External sessions have no SFU room; roomName is a required @unique
          // column, so reuse the synthetic, non-colliding session ref.
          roomName: `ext-${sessionRef}`,
          meetingUrl,
          meetingProvider: d.meetingProvider || null,
        },
        select: { id: true },
      })
    }

    // Attached references (already tenant-verified above). Best-effort is NOT
    // enough here — the teacher just picked them — but a failure after the
    // session exists shouldn't orphan the create either; surface via logs.
    if (resources.length > 0) {
      try {
        await writeResources(schoolId, created.id, resources)
      } catch (err) {
        console.error("[createLiveClass] resource write failed:", err)
      }
    }

    // Warm the other-language cache off the response path (seamless first read)
    after(() =>
      prewarm(
        "Conference",
        { title: content.title, description: content.description },
        { schoolId }
      )
    )

    // "Set once & reuse": persist the link as the section+subject default for
    // the active term so every weekly recurrence surfaces the same timetable
    // Join button without re-entering it. External links only — an in-app
    // room has no reusable URL (ConferenceLink.meetingUrl is required).
    // Best-effort — a default-link failure must not fail the schedule create.
    if (
      d.provider === "external" &&
      d.saveAsDefault &&
      meetingUrl &&
      subjectId &&
      sectionId
    ) {
      try {
        const { term } = await resolveActiveTerm(schoolId)
        if (term) {
          await db.conferenceLink.upsert({
            where: {
              schoolId_subjectId_sectionId_termId: {
                schoolId,
                subjectId,
                sectionId,
                termId: term.id,
              },
            },
            create: {
              schoolId,
              subjectId,
              sectionId,
              termId: term.id,
              provider: "external",
              meetingUrl,
              meetingProvider: d.meetingProvider || null,
              createdBy: session.user.id ?? null,
            },
            update: {
              meetingUrl,
              meetingProvider: d.meetingProvider || null,
            },
          })
        }
      } catch (err) {
        console.error("[createLiveClass] default-link upsert failed:", err)
      }
    }

    // Best-effort fan-out to the section roster + guardians + teacher. The
    // external-link path is the only live backend until LiveKit lands, so
    // without this a scheduled class would notify nobody. Failures here must
    // never fail the create.
    after(() => notifyClassScheduled(schoolId, created.id))

    for (const path of conferenceListRevalidatePaths()) {
      revalidatePath(path, "page")
    }
    revalidatePath("/[lang]/s/[subdomain]/timetable", "page")
    return { success: true, data: { id: created.id } }
  } catch (error) {
    console.error("[createLiveClass]", error)
    return actionError(ACTION_ERRORS.CREATE_FAILED)
  }
}

export async function updateLiveClass(
  data: UpdateLiveClassData
): Promise<ActionResponse> {
  try {
    const session = await auth()
    const { schoolId } = await getTenantContext()
    const role = session?.user?.role as Role | undefined

    if (!session?.user) return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    if (!canManageLiveClasses(role)) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    const validated = updateLiveClassSchema.safeParse(data)
    if (!validated.success) {
      return actionError(ACTION_ERRORS.VALIDATION_ERROR)
    }
    const d = validated.data

    // If a teacher is supplied, verify it belongs to this school.
    if (d.teacherId) {
      const teacher = await db.teacher.findFirst({
        where: { id: d.teacherId, schoolId },
        select: { id: true },
      })
      if (!teacher) return actionError(ACTION_ERRORS.TEACHER_NOT_FOUND)
    }

    // The existing row anchors the status-transition guard, the schedule
    // recompute, and the change-detection for notifications; the school row
    // supplies the timezone the schedule fields are expressed in.
    const [existing, schoolRow] = await Promise.all([
      db.conference.findFirst({
        where: { id: d.id, schoolId, deletedAt: null },
        select: {
          status: true,
          provider: true,
          actualEnd: true,
          scheduledStart: true,
          scheduledEnd: true,
          timetableId: true,
          teacherId: true,
          subjectId: true,
          sectionId: true,
        },
      }),
      db.school.findUnique({
        where: { id: schoolId },
        // The cap is re-applied on edit, not only at create — see the
        // schedule recompute below.
        select: { timezone: true, conferenceMaxDuration: true },
      }),
    ])
    if (!existing) return actionError(ACTION_ERRORS.NOT_FOUND)
    const schoolTz = schoolRow?.timezone || DEFAULT_SCHOOL_TZ

    // Build the update payload only from provided fields. Typed `any` (matching
    // the announcements pattern) so FK scalars (teacherId/subjectId/sectionId)
    // can be set directly on the unchecked updateMany input.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {}

    if (d.title !== undefined) {
      updateData.title = d.title
      updateData.lang = detectLang(d.title)
    }
    if (d.description !== undefined)
      updateData.description = d.description ?? null

    // On an anchored session the timetable slot stays authoritative for the
    // whole edit, not just at create: moving the section here (the edit form
    // leaves those selects open) would leave `sectionId` pointing at section B
    // while `timetableId` still points at slot A — and the attendance sync
    // would then mark section B's roster against slot A's period. The anchor
    // itself is immutable, so who/what can only change by re-anchoring, which
    // we don't allow.
    const anchored = Boolean(existing.timetableId)
    const wouldMoveAnchoredClass =
      anchored &&
      ((d.teacherId !== undefined && d.teacherId !== existing.teacherId) ||
        (d.subjectId !== undefined &&
          (d.subjectId || null) !== existing.subjectId) ||
        (d.sectionId !== undefined &&
          (d.sectionId || null) !== existing.sectionId))
    if (wouldMoveAnchoredClass) {
      return actionError(ACTION_ERRORS.VALIDATION_ERROR)
    }

    if (!anchored) {
      if (d.teacherId !== undefined) updateData.teacherId = d.teacherId
      if (d.subjectId !== undefined) updateData.subjectId = d.subjectId || null
      if (d.sectionId !== undefined) updateData.sectionId = d.sectionId || null
    }
    if (d.meetingUrl !== undefined) updateData.meetingUrl = d.meetingUrl
    if (d.meetingProvider !== undefined)
      updateData.meetingProvider = d.meetingProvider || null
    if (d.status !== undefined && d.status !== existing.status) {
      // The list layer is a CRUD surface, not the room lifecycle: it may
      // close or cancel, never resurrect an ended/cancelled session or flip
      // one to `live` (that path belongs to startLiveClass/the webhook, which
      // enforce the SFU room + concurrent cap). `live → ended` is allowed for
      // external links only — a LiveKit room must end via endLiveClass so the
      // SFU room and egress are torn down with it.
      const allowedTransition =
        (existing.status === "scheduled" &&
          (d.status === "cancelled" || d.status === "ended")) ||
        (existing.status === "live" &&
          d.status === "ended" &&
          existing.provider === "external")
      if (!allowedTransition) {
        return actionError(ACTION_ERRORS.LIVE_CLASS_INVALID_STATE)
      }
      updateData.status = d.status
      if (d.status === "ended" && !existing.actualEnd) {
        updateData.actualEnd = new Date()
      }
    }
    if (d.visibility !== undefined) updateData.visibility = d.visibility
    if (d.recordingEnabled !== undefined)
      updateData.recordingEnabled = d.recordingEnabled
    if (d.studentsJoinMuted !== undefined)
      updateData.studentsJoinMuted = joinMutedFromForm(d.studentsJoinMuted)
    if (d.maxParticipants !== undefined)
      updateData.maxParticipants = d.maxParticipants
    if (d.catalogLessonId !== undefined) {
      if (d.catalogLessonId && !(await lessonExists(d.catalogLessonId))) {
        return actionError(ACTION_ERRORS.VALIDATION_ERROR)
      }
      updateData.catalogLessonId = d.catalogLessonId || null
    }

    // Attached references: replace-all when the array is provided at all
    // (tenant-verified first — a foreign exam/assignment id fails validation).
    if (d.resources !== undefined) {
      const verifiedRefs = await verifyResourceRefs(schoolId, d.resources)
      if (!verifiedRefs.ok) return actionError(ACTION_ERRORS.VALIDATION_ERROR)
    }

    // Recompute schedule when date or time changed (school-TZ combine, same
    // as create). Missing halves fall back to the existing boundary read in
    // the school's timezone — never the server's.
    const needsStart = d.startDate !== undefined || d.startTime !== undefined
    const needsEnd = d.endDate !== undefined || d.endTime !== undefined
    if (needsStart) {
      const baseDate = d.startDate ?? existing.scheduledStart
      const baseTime =
        d.startTime ?? schoolTimeStringOf(existing.scheduledStart, schoolTz)
      updateData.scheduledStart = combineDateAndTime(
        baseDate,
        baseTime,
        schoolTz
      )
    }
    if (needsEnd) {
      const baseDate = d.endDate ?? existing.scheduledEnd
      const baseTime =
        d.endTime ?? schoolTimeStringOf(existing.scheduledEnd, schoolTz)
      updateData.scheduledEnd = combineDateAndTime(baseDate, baseTime, schoolTz)
    }

    // The same two guards create applies, against the EFFECTIVE boundaries —
    // a partial edit (new start time, untouched end) can invert a schedule or
    // stretch a room past the cap just as well as a full one, and the schema
    // can't see the stored half. Without this the cap was create-only: book a
    // 60-minute room, then edit it to 23 hours.
    if (needsStart || needsEnd) {
      const effectiveStart =
        (updateData.scheduledStart as Date | undefined) ??
        existing.scheduledStart
      const effectiveEnd =
        (updateData.scheduledEnd as Date | undefined) ?? existing.scheduledEnd
      if (effectiveEnd.getTime() <= effectiveStart.getTime()) {
        return actionError(ACTION_ERRORS.VALIDATION_ERROR)
      }
      // Provider is immutable on edit, so the stored one decides whether this
      // session holds an SFU slot.
      if (existing.provider === "livekit") {
        const durationMin =
          (effectiveEnd.getTime() - effectiveStart.getTime()) / 60_000
        if (durationMin > (schoolRow?.conferenceMaxDuration ?? 240)) {
          return actionError(ACTION_ERRORS.LIVE_CLASS_MAX_DURATION_EXCEEDED)
        }
      }
    }

    // Tenant-safe scoped write: updateMany with {id, schoolId}.
    const result = await db.conference.updateMany({
      where: { id: d.id, schoolId, deletedAt: null },
      data: updateData,
    })

    if (result.count === 0) return actionError(ACTION_ERRORS.NOT_FOUND)

    // Row exists and is ours — safe to swap the reference set now.
    if (d.resources !== undefined) {
      try {
        await writeResources(schoolId, d.id, d.resources)
      } catch (err) {
        console.error("[updateLiveClass] resource write failed:", err)
      }
    }

    // Warm the other-language cache when text content changed (off response path)
    if (updateData.title || updateData.description) {
      after(() =>
        prewarm(
          "Conference",
          { title: updateData.title, description: updateData.description },
          { schoolId }
        )
      )
    }

    // Re-notify enrolled students/guardians ONLY when something they care
    // about actually changed: a flip to "cancelled" sends the cancel notice;
    // a moved boundary re-sends the scheduled notice (carrying the new time).
    // The edit form always submits the schedule fields, so compare computed
    // instants against the row — a title typo fix must not ping the roster.
    // Best-effort — never fail the update.
    const startMoved =
      updateData.scheduledStart instanceof Date &&
      updateData.scheduledStart.getTime() !== existing.scheduledStart.getTime()
    const endMoved =
      updateData.scheduledEnd instanceof Date &&
      updateData.scheduledEnd.getTime() !== existing.scheduledEnd.getTime()
    if (updateData.status === "cancelled") {
      after(() => notifyClassCancelled(schoolId, d.id))
    } else if (startMoved || endMoved) {
      after(() => notifyClassScheduled(schoolId, d.id))
    }

    for (const path of conferenceListRevalidatePaths()) {
      revalidatePath(path, "page")
    }
    return { success: true, data: null }
  } catch (error) {
    console.error("[updateLiveClass]", error)
    return actionError(ACTION_ERRORS.UPDATE_FAILED)
  }
}

export async function deleteLiveClass(params: {
  id: string
}): Promise<ActionResponse> {
  try {
    const session = await auth()
    const { schoolId } = await getTenantContext()
    const role = session?.user?.role as Role | undefined

    if (!session?.user) return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    if (!canDeleteLiveClasses(role)) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    // Soft delete, tenant-scoped via updateMany on {id, schoolId}.
    const result = await db.conference.updateMany({
      where: { id: params.id, schoolId, deletedAt: null },
      data: { deletedAt: new Date() },
    })

    if (result.count === 0) return actionError(ACTION_ERRORS.NOT_FOUND)

    // Tell the section the class is off. loadSession resolves the row by
    // {id, schoolId} without a deletedAt filter, so it still works post-delete.
    after(() => notifyClassCancelled(schoolId, params.id))

    for (const path of conferenceListRevalidatePaths()) {
      revalidatePath(path, "page")
    }
    return { success: true, data: null }
  } catch (error) {
    console.error("[deleteLiveClass]", error)
    return actionError(ACTION_ERRORS.DELETE_FAILED)
  }
}
