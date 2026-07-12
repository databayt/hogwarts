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
import { prewarm } from "@/components/translation/prewarm"
import { detectLang, withLang } from "@/components/translation/util"

import { conferenceRevalidatePath } from "./actions/helpers"
import {
  notifyClassCancelled,
  notifyClassScheduled,
} from "./actions/notifications"
import { canDeleteLiveClasses, canManageLiveClasses } from "./list-permissions"
import {
  liveClassSchema,
  updateLiveClassSchema,
  type LiveClassFormData,
  type LiveClassResourceInput,
  type UpdateLiveClassData,
} from "./list-validation"
import { roomNameFor } from "./livekit/room-naming"
import { getProviderAdapter, type ProviderId } from "./providers"
import {
  getLiveClassDetail,
  getLiveClassesList,
  getLiveClassReferenceData,
  resolveViewerSectionScope,
  type LiveClassReferenceData,
} from "./queries"

// ============================================================================
// Helpers
// ============================================================================

/**
 * Combine a date and an "HH:mm" time string into a single Date.
 * The date provides the day; the time string provides hours/minutes.
 */
function combineDateAndTime(date: Date, time: string): Date {
  const [h, m] = time.split(":").map((n) => parseInt(n, 10))
  const result = new Date(date)
  result.setHours(h ?? 0, m ?? 0, 0, 0)
  return result
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
      title: params.title,
      status: params.status,
      page: params.page,
      perPage: params.perPage,
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
    // section they (or their ward) belong to. Return NOT_FOUND (not UNAUTHORIZED)
    // so the existence of other sections' sessions isn't revealed.
    const scope = await resolveViewerSectionScope(
      schoolId,
      session.user.id,
      role
    )
    if (
      scope === "none" ||
      (scope !== "all" &&
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

    const data = await getLiveClassReferenceData(schoolId, params.subjectId)
    return { success: true, data }
  } catch (error) {
    console.error("[getLiveClassReferenceOptions]", error)
    return actionError(ACTION_ERRORS.LOAD_FAILED)
  }
}

/**
 * Load the dropdown data for the create/edit form (teachers, subjects,
 * sections) — all scoped to the school. The teacher select is required, so the
 * caller must handle the empty-teacher case gracefully.
 */
export async function getLiveClassFormData(): Promise<
  ActionResponse<{
    teachers: { id: string; name: string }[]
    subjects: { id: string; name: string }[]
    sections: { id: string; name: string }[]
  }>
> {
  try {
    const session = await auth()
    const { schoolId } = await getTenantContext()
    const role = session?.user?.role as Role | undefined

    if (!session?.user) return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    // Form rosters (teachers/subjects/sections) are management data — only
    // roles that can create/edit a class may load them.
    if (!canManageLiveClasses(role)) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

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
      success: true,
      data: {
        teachers: teachers.map((t) => ({
          id: t.id,
          name: `${t.firstName ?? ""} ${t.lastName ?? ""}`.trim(),
        })),
        subjects: subjects.map((s) => ({
          id: s.subject.id,
          name: s.subject.name,
        })),
        sections: sections.map((s) => ({ id: s.id, name: s.name })),
      },
    }
  } catch (error) {
    console.error("[getLiveClassFormData]", error)
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

    // Verify the teacher belongs to this school (tenant safety on a FK we
    // set). userId feeds the HOST participant upsert on the in-app-room path.
    const teacher = await db.teacher.findFirst({
      where: { id: d.teacherId, schoolId },
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
        },
      }),
      d.sectionId
        ? db.section.findFirst({
            where: { id: d.sectionId, schoolId },
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

    const scheduledStart = combineDateAndTime(d.startDate, d.startTime)
    const scheduledEnd = combineDateAndTime(d.endDate, d.endTime)

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
      teacherId: d.teacherId,
      subjectId: d.subjectId || null,
      sectionId: d.sectionId || null,
      scheduledStart,
      scheduledEnd,
      status: d.status ?? "scheduled",
      visibility: d.visibility ?? "section",
      catalogLessonId: d.catalogLessonId || null,
      recordingEnabled,
      maxParticipants: d.maxParticipants ?? 50,
      title: content.title,
      description: content.description,
      lang: content.lang,
    } as const

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
      d.subjectId &&
      d.sectionId
    ) {
      try {
        const { term } = await resolveActiveTerm(schoolId)
        if (term) {
          await db.conferenceLink.upsert({
            where: {
              schoolId_subjectId_sectionId_termId: {
                schoolId,
                subjectId: d.subjectId,
                sectionId: d.sectionId,
                termId: term.id,
              },
            },
            create: {
              schoolId,
              subjectId: d.subjectId,
              sectionId: d.sectionId,
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
    void notifyClassScheduled(schoolId, created.id)

    revalidatePath(conferenceRevalidatePath())
    revalidatePath("/[lang]/s/[subdomain]/timetable")
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
    if (d.teacherId !== undefined) updateData.teacherId = d.teacherId
    if (d.subjectId !== undefined) updateData.subjectId = d.subjectId || null
    if (d.sectionId !== undefined) updateData.sectionId = d.sectionId || null
    if (d.meetingUrl !== undefined) updateData.meetingUrl = d.meetingUrl
    if (d.meetingProvider !== undefined)
      updateData.meetingProvider = d.meetingProvider || null
    if (d.status !== undefined) updateData.status = d.status
    if (d.visibility !== undefined) updateData.visibility = d.visibility
    if (d.recordingEnabled !== undefined)
      updateData.recordingEnabled = d.recordingEnabled
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

    // Recompute schedule when date or time changed. Need both date+time for a
    // boundary; load the existing row if only one half changed.
    const needsStart = d.startDate !== undefined || d.startTime !== undefined
    const needsEnd = d.endDate !== undefined || d.endTime !== undefined
    if (needsStart || needsEnd) {
      const existing = await db.conference.findFirst({
        where: { id: d.id, schoolId, deletedAt: null },
        select: { scheduledStart: true, scheduledEnd: true },
      })
      if (!existing) return actionError(ACTION_ERRORS.NOT_FOUND)

      if (needsStart) {
        const baseDate = d.startDate ?? existing.scheduledStart
        const baseTime =
          d.startTime ?? formatTimeFromDate(existing.scheduledStart)
        updateData.scheduledStart = combineDateAndTime(baseDate, baseTime)
      }
      if (needsEnd) {
        const baseDate = d.endDate ?? existing.scheduledEnd
        const baseTime = d.endTime ?? formatTimeFromDate(existing.scheduledEnd)
        updateData.scheduledEnd = combineDateAndTime(baseDate, baseTime)
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

    // Re-notify enrolled students/guardians when the class moved or its status
    // changed. A status flip to "cancelled" sends the cancel notice; any other
    // schedule/status change re-sends the scheduled notice (carrying the new
    // time). Best-effort — never fail the update.
    if (d.status === "cancelled") {
      void notifyClassCancelled(schoolId, d.id)
    } else if (needsStart || needsEnd || d.status !== undefined) {
      void notifyClassScheduled(schoolId, d.id)
    }

    revalidatePath(conferenceRevalidatePath())
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
    void notifyClassCancelled(schoolId, params.id)

    revalidatePath(conferenceRevalidatePath())
    return { success: true, data: null }
  } catch (error) {
    console.error("[deleteLiveClass]", error)
    return actionError(ACTION_ERRORS.DELETE_FAILED)
  }
}

/** Format a Date into an "HH:mm" string. */
function formatTimeFromDate(date: Date): string {
  const h = String(date.getHours()).padStart(2, "0")
  const m = String(date.getMinutes()).padStart(2, "0")
  return `${h}:${m}`
}
