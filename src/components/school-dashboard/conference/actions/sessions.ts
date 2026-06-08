"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"
import { isLiveKitConfigured } from "@/components/school-dashboard/conference/livekit/client"
import { stopEgress } from "@/components/school-dashboard/conference/livekit/egress"
import { roomNameFor } from "@/components/school-dashboard/conference/livekit/room-naming"
import {
  endRoom,
  ensureRoom,
} from "@/components/school-dashboard/conference/livekit/rooms"
import {
  cancelSchema,
  idOnlySchema,
  liveClassScheduleSchema,
  timetableStartSchema,
  type CancelInput,
  type IdOnly,
  type LiveClassServerInput,
} from "@/components/school-dashboard/conference/validation"

import { conferenceRevalidatePath, requireContext } from "./helpers"
import { notifyClassCancelled, notifyClassScheduled } from "./notifications"

/**
 * Create a scheduled or ad-hoc live class. Teachers schedule own; admins
 * can schedule for any teacher in the school. Returns the saved session
 * with its definitive roomName.
 */
export async function createLiveClass(input: LiveClassServerInput) {
  const ctx = await requireContext("manage_live_class")
  if (!ctx.ok) {
    // Teachers can create their own — fall back to start_live_class permission.
    const teacherCtx = await requireContext("start_live_class")
    if (!teacherCtx.ok) return teacherCtx.response
    return createLiveClassAsTeacher(input, teacherCtx)
  }
  return createLiveClassWithCtx(input, ctx)
}

async function createLiveClassAsTeacher(
  input: LiveClassServerInput,
  ctx: Extract<Awaited<ReturnType<typeof requireContext>>, { ok: true }>
) {
  // Resolve the teacher row for the current user. Teachers can only
  // schedule sessions where they themselves are the host.
  const teacher = await db.teacher.findFirst({
    where: { schoolId: ctx.schoolId, userId: ctx.userId },
    select: { id: true },
  })
  if (!teacher) return actionError(ACTION_ERRORS.UNAUTHORIZED)
  if (input.teacherId && input.teacherId !== teacher.id) {
    return actionError(ACTION_ERRORS.UNAUTHORIZED)
  }
  return createLiveClassWithCtx({ ...input, teacherId: teacher.id }, ctx)
}

async function createLiveClassWithCtx(
  input: LiveClassServerInput,
  ctx: Extract<Awaited<ReturnType<typeof requireContext>>, { ok: true }>
) {
  const parsed = liveClassScheduleSchema.safeParse(input)
  if (!parsed.success) {
    return actionError(ACTION_ERRORS.VALIDATION_ERROR, parsed.error.message)
  }
  const data = parsed.data

  try {
    // Enforce per-school max duration.
    const school = await db.school.findUnique({
      where: { id: ctx.schoolId },
      select: {
        conferenceMaxDuration: true,
        conferenceRecordingDefault: true,
        preferredLanguage: true,
      },
    })
    if (!school) return actionError(ACTION_ERRORS.SCHOOL_NOT_FOUND)

    const durationMin =
      (new Date(data.scheduledEnd).getTime() -
        new Date(data.scheduledStart).getTime()) /
      60_000
    if (durationMin > school.conferenceMaxDuration) {
      return actionError(ACTION_ERRORS.LIVE_CLASS_MAX_DURATION_EXCEEDED)
    }

    // Verify the teacher belongs to this school.
    const teacher = await db.teacher.findFirst({
      where: { id: data.teacherId, schoolId: ctx.schoolId },
      select: { id: true, userId: true },
    })
    if (!teacher) return actionError(ACTION_ERRORS.TEACHER_NOT_FOUND)

    // Two-step create so we can write the final roomName containing the cuid.
    const placeholder = `pending-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const created = await db.conference.create({
      data: {
        schoolId: ctx.schoolId,
        teacherId: teacher.id,
        timetableId: data.timetableId ?? null,
        sectionId: data.sectionId ?? null,
        subjectId: data.subjectId ?? null,
        title: data.title,
        description: data.description ?? null,
        lang: data.lang,
        scheduledStart: new Date(data.scheduledStart),
        scheduledEnd: new Date(data.scheduledEnd),
        recordingEnabled:
          data.recordingEnabled ?? school.conferenceRecordingDefault,
        maxParticipants: data.maxParticipants ?? 50,
        roomName: placeholder,
      },
    })
    const finalRoomName = roomNameFor(ctx.schoolId, created.id)
    const session = await db.conference.update({
      where: { id: created.id },
      data: { roomName: finalRoomName },
    })

    // Auto-invite the teacher as HOST. Students/observers are resolved
    // lazily on join via the section roster, so we don't pre-fan-out.
    if (teacher.userId) {
      await db.conferenceParticipant.upsert({
        where: {
          sessionId_userId: { sessionId: session.id, userId: teacher.userId },
        },
        create: {
          schoolId: ctx.schoolId,
          sessionId: session.id,
          userId: teacher.userId,
          role: "HOST",
        },
        update: { role: "HOST" },
      })
    }

    // Best-effort fan-out — failures here must not roll back the create.
    void notifyClassScheduled(ctx.schoolId, session.id)

    revalidatePath(conferenceRevalidatePath())
    return { success: true as const, data: session }
  } catch {
    return actionError(ACTION_ERRORS.LIVE_CLASS_CREATE_FAILED)
  }
}

/**
 * Start a live class straight from a Timetable slot (the teacher's
 * Current/Next card). Resolves the slot's teacher/section/subject + period
 * window, reuses any not-yet-ended session on the slot (idempotent re-click),
 * otherwise creates one, then starts it (provisions the SFU room and flips to
 * live). HOST-scoped via `start_live_class`; ownership is enforced downstream
 * by `createLiveClass` (teacher fallback) + `startLiveClass`.
 */
export async function createLiveClassFromTimetable(input: {
  timetableId: string
}) {
  const ctx = await requireContext("start_live_class")
  if (!ctx.ok) return ctx.response
  const parsed = timetableStartSchema.safeParse(input)
  if (!parsed.success) return actionError(ACTION_ERRORS.VALIDATION_ERROR)

  const slot = await db.timetable.findFirst({
    where: { id: parsed.data.timetableId, schoolId: ctx.schoolId },
    select: {
      id: true,
      teacherId: true,
      sectionId: true,
      subjectId: true,
      subject: { select: { name: true } },
      section: { select: { name: true } },
      period: { select: { startTime: true, endTime: true } },
    },
  })
  if (!slot) return actionError(ACTION_ERRORS.LIVE_CLASS_NOT_FOUND)
  if (!slot.teacherId) return actionError(ACTION_ERRORS.UNAUTHORIZED)

  // Idempotent: reuse a scheduled/live session already on this slot.
  const existing = await db.conference.findFirst({
    where: {
      schoolId: ctx.schoolId,
      timetableId: slot.id,
      status: { in: ["scheduled", "live"] },
      deletedAt: null,
    },
    select: { id: true },
    orderBy: { createdAt: "desc" },
  })

  let sessionId = existing?.id
  if (!sessionId) {
    const school = await db.school.findUnique({
      where: { id: ctx.schoolId },
      select: {
        conferenceMaxDuration: true,
        conferenceRecordingDefault: true,
        preferredLanguage: true,
      },
    })
    const maxDuration = school?.conferenceMaxDuration ?? 120
    const periodMin = slot.period
      ? Math.round(
          (new Date(slot.period.endTime).getTime() -
            new Date(slot.period.startTime).getTime()) /
            60_000
        )
      : 0
    const durationMin = Math.min(periodMin > 0 ? periodMin : 60, maxDuration)
    const now = new Date()
    const end = new Date(now.getTime() + durationMin * 60_000)

    const createRes = await createLiveClass({
      title: slot.subject?.name || slot.section?.name || "Live Class",
      teacherId: slot.teacherId,
      sectionId: slot.sectionId ?? undefined,
      subjectId: slot.subjectId ?? undefined,
      timetableId: slot.id,
      lang: school?.preferredLanguage ?? "ar",
      scheduledStart: now.toISOString(),
      scheduledEnd: end.toISOString(),
      recordingEnabled: school?.conferenceRecordingDefault ?? true,
      maxParticipants: 50,
    })
    if (!("success" in createRes) || !createRes.success) return createRes
    sessionId = createRes.data.id
  }

  if (!sessionId) return actionError(ACTION_ERRORS.LIVE_CLASS_CREATE_FAILED)

  const startRes = await startLiveClass({ id: sessionId })
  if (!("success" in startRes) || !startRes.success) return startRes
  return { success: true as const, data: { id: sessionId } }
}

/**
 * Cancel a scheduled (not yet live) class. Notifies enrolled students.
 */
export async function cancelLiveClass(input: CancelInput) {
  const ctx = await requireContext("manage_live_class")
  if (!ctx.ok) return ctx.response
  const parsed = cancelSchema.safeParse(input)
  if (!parsed.success) {
    return actionError(ACTION_ERRORS.VALIDATION_ERROR, parsed.error.message)
  }

  try {
    const session = await db.conference.findFirst({
      where: {
        id: parsed.data.id,
        schoolId: ctx.schoolId,
        deletedAt: null,
      },
      select: { id: true, status: true },
    })
    if (!session) return actionError(ACTION_ERRORS.LIVE_CLASS_NOT_FOUND)
    if (session.status !== "scheduled") {
      return actionError(ACTION_ERRORS.LIVE_CLASS_INVALID_STATE)
    }

    await db.conference.update({
      where: { id: session.id },
      data: { status: "cancelled" },
    })

    void notifyClassCancelled(ctx.schoolId, session.id, parsed.data.reason)

    revalidatePath(conferenceRevalidatePath())
    revalidatePath(conferenceRevalidatePath(session.id))
    return { success: true as const, data: { id: session.id } }
  } catch {
    return actionError(ACTION_ERRORS.LIVE_CLASS_UPDATE_FAILED)
  }
}

/**
 * Teacher hits "Start" — provisions the SFU room and flips status to live.
 * Idempotent: re-calling on a live class is a no-op.
 */
export async function startLiveClass(input: IdOnly) {
  const ctx = await requireContext("start_live_class")
  if (!ctx.ok) return ctx.response
  const parsed = idOnlySchema.safeParse(input)
  if (!parsed.success) return actionError(ACTION_ERRORS.VALIDATION_ERROR)

  try {
    const session = await db.conference.findFirst({
      where: { id: parsed.data.id, schoolId: ctx.schoolId, deletedAt: null },
      select: {
        id: true,
        status: true,
        roomName: true,
        maxParticipants: true,
        teacher: { select: { userId: true } },
      },
    })
    if (!session) return actionError(ACTION_ERRORS.LIVE_CLASS_NOT_FOUND)

    // Teachers can only start own classes; admins can start any.
    if (ctx.role === "TEACHER" && session.teacher.userId !== ctx.userId) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    if (session.status === "live") {
      return { success: true as const, data: { id: session.id } }
    }
    if (session.status !== "scheduled") {
      return actionError(ACTION_ERRORS.LIVE_CLASS_INVALID_STATE)
    }

    // Enforce the per-school concurrent-room cap before provisioning.
    const [school, liveCount] = await Promise.all([
      db.school.findUnique({
        where: { id: ctx.schoolId },
        select: { conferenceMaxConcurrent: true },
      }),
      db.conference.count({
        where: { schoolId: ctx.schoolId, status: "live", deletedAt: null },
      }),
    ])
    if (school && liveCount >= school.conferenceMaxConcurrent) {
      return actionError(ACTION_ERRORS.LIVE_CLASS_MAX_CONCURRENT)
    }

    try {
      await ensureRoom({
        roomName: session.roomName,
        maxParticipants: session.maxParticipants,
      })
    } catch {
      return actionError(ACTION_ERRORS.LIVE_CLASS_PROVIDER_UNAVAILABLE)
    }

    await db.conference.update({
      where: { id: session.id },
      data: { status: "live", actualStart: new Date() },
    })

    revalidatePath(conferenceRevalidatePath())
    revalidatePath(conferenceRevalidatePath(session.id))
    return { success: true as const, data: { id: session.id } }
  } catch {
    return actionError(ACTION_ERRORS.LIVE_CLASS_UPDATE_FAILED)
  }
}

/**
 * Teacher hits "End" — deletes the SFU room (kicks everyone) and flips
 * status to ended. Webhook `room_finished` also handles this, but we
 * proactively close to free the room slot.
 */
export async function endLiveClass(input: IdOnly) {
  const ctx = await requireContext("end_live_class")
  if (!ctx.ok) return ctx.response
  const parsed = idOnlySchema.safeParse(input)
  if (!parsed.success) return actionError(ACTION_ERRORS.VALIDATION_ERROR)

  try {
    const session = await db.conference.findFirst({
      where: { id: parsed.data.id, schoolId: ctx.schoolId, deletedAt: null },
      select: {
        id: true,
        status: true,
        roomName: true,
        teacher: { select: { userId: true } },
        recordings: {
          where: { status: { in: ["pending", "processing"] } },
          select: { egressId: true },
          take: 1,
        },
      },
    })
    if (!session) return actionError(ACTION_ERRORS.LIVE_CLASS_NOT_FOUND)
    if (ctx.role === "TEACHER" && session.teacher.userId !== ctx.userId) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }
    if (session.status === "ended" || session.status === "cancelled") {
      return { success: true as const, data: { id: session.id } }
    }

    // Stop any in-flight recording so the MP4 flushes promptly. Best-effort:
    // the SFU also stops egress on room close, then emits egress_ended which
    // the webhook finalizes.
    const activeEgressId = session.recordings?.[0]?.egressId
    if (activeEgressId && isLiveKitConfigured()) {
      try {
        await stopEgress(activeEgressId)
      } catch {
        // best-effort
      }
    }

    try {
      await endRoom(session.roomName)
    } catch {
      // best-effort — the room may have already auto-closed
    }
    await db.conference.update({
      where: { id: session.id },
      data: { status: "ended", actualEnd: new Date() },
    })

    revalidatePath(conferenceRevalidatePath())
    revalidatePath(conferenceRevalidatePath(session.id))
    return { success: true as const, data: { id: session.id } }
  } catch {
    return actionError(ACTION_ERRORS.LIVE_CLASS_UPDATE_FAILED)
  }
}

/**
 * List sessions visible to the current user.
 *
 * - Admin / Staff / Accountant → all sessions in school
 * - Teacher → own sessions
 * - Student → sessions for own section
 * - Guardian → sessions for any child's section
 */
export async function listLiveClasses(filter?: {
  status?: ("scheduled" | "live" | "ended" | "cancelled" | "failed")[]
}) {
  const ctx = await requireContext("read_school_dashboard")
  if (!ctx.ok) {
    const studentCtx = await requireContext("join_as_participant")
    if (!studentCtx.ok) {
      const guardianCtx = await requireContext("join_as_observer")
      if (!guardianCtx.ok) return guardianCtx.response
      return listForGuardian(guardianCtx, filter)
    }
    return listForStudent(studentCtx, filter)
  }

  if (ctx.role === "TEACHER") {
    return listForTeacher(ctx, filter)
  }

  try {
    const sessions = await db.conference.findMany({
      where: {
        schoolId: ctx.schoolId,
        deletedAt: null,
        ...(filter?.status ? { status: { in: filter.status } } : {}),
      },
      include: {
        teacher: { select: { id: true, firstName: true, lastName: true } },
        section: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true } },
        _count: { select: { participants: true, recordings: true } },
      },
      orderBy: [{ scheduledStart: "desc" }],
      take: 200,
    })
    return { success: true as const, data: sessions }
  } catch {
    return actionError(ACTION_ERRORS.LOAD_FAILED)
  }
}

type Ctx = Extract<Awaited<ReturnType<typeof requireContext>>, { ok: true }>

async function listForTeacher(ctx: Ctx, filter?: { status?: string[] }) {
  const teacher = await db.teacher.findFirst({
    where: { schoolId: ctx.schoolId, userId: ctx.userId },
    select: { id: true },
  })
  if (!teacher) return { success: true as const, data: [] }
  const sessions = await db.conference.findMany({
    where: {
      schoolId: ctx.schoolId,
      teacherId: teacher.id,
      deletedAt: null,
      ...(filter?.status
        ? {
            status: {
              in: filter.status as (
                | "scheduled"
                | "live"
                | "ended"
                | "cancelled"
                | "failed"
              )[],
            },
          }
        : {}),
    },
    include: {
      teacher: { select: { id: true, firstName: true, lastName: true } },
      section: { select: { id: true, name: true } },
      subject: { select: { id: true, name: true } },
      _count: { select: { participants: true, recordings: true } },
    },
    orderBy: [{ scheduledStart: "desc" }],
    take: 200,
  })
  return { success: true as const, data: sessions }
}

async function listForStudent(ctx: Ctx, filter?: { status?: string[] }) {
  const student = await db.student.findFirst({
    where: { schoolId: ctx.schoolId, userId: ctx.userId },
    select: { sectionId: true },
  })
  if (!student?.sectionId) return { success: true as const, data: [] }
  const sessions = await db.conference.findMany({
    where: {
      schoolId: ctx.schoolId,
      sectionId: student.sectionId,
      deletedAt: null,
      ...(filter?.status
        ? {
            status: {
              in: filter.status as (
                | "scheduled"
                | "live"
                | "ended"
                | "cancelled"
                | "failed"
              )[],
            },
          }
        : {}),
    },
    include: {
      teacher: { select: { id: true, firstName: true, lastName: true } },
      section: { select: { id: true, name: true } },
      subject: { select: { id: true, name: true } },
      _count: { select: { participants: true, recordings: true } },
    },
    orderBy: [{ scheduledStart: "desc" }],
    take: 200,
  })
  return { success: true as const, data: sessions }
}

async function listForGuardian(ctx: Ctx, filter?: { status?: string[] }) {
  const guardian = await db.guardian.findFirst({
    where: { schoolId: ctx.schoolId, userId: ctx.userId },
    select: {
      id: true,
      studentGuardians: {
        select: { student: { select: { sectionId: true } } },
      },
    },
  })
  if (!guardian) return { success: true as const, data: [] }
  const sectionIds = guardian.studentGuardians
    .map((sg) => sg.student.sectionId)
    .filter((id): id is string => Boolean(id))
  if (sectionIds.length === 0) return { success: true as const, data: [] }
  const sessions = await db.conference.findMany({
    where: {
      schoolId: ctx.schoolId,
      sectionId: { in: sectionIds },
      deletedAt: null,
      ...(filter?.status
        ? {
            status: {
              in: filter.status as (
                | "scheduled"
                | "live"
                | "ended"
                | "cancelled"
                | "failed"
              )[],
            },
          }
        : {}),
    },
    include: {
      teacher: { select: { id: true, firstName: true, lastName: true } },
      section: { select: { id: true, name: true } },
      subject: { select: { id: true, name: true } },
      _count: { select: { participants: true, recordings: true } },
    },
    orderBy: [{ scheduledStart: "desc" }],
    take: 200,
  })
  return { success: true as const, data: sessions }
}

/**
 * Get a single session by id (tenant-scoped).
 *
 * Tenant safety: every read path resolves schoolId from the request
 * context — we NEVER trust the caller's id alone. Students/guardians can
 * read sessions in their own school via the participant role; if that
 * resolves no schoolId (truly anonymous), the request is denied.
 */
export async function getLiveClass(id: string) {
  // Try every role bucket — each requireContext call enforces auth +
  // schoolId + role. The first one that succeeds gives us the schoolId.
  const dashboardCtx = await requireContext("read_school_dashboard")
  let schoolId: string | null = dashboardCtx.ok ? dashboardCtx.schoolId : null
  if (!schoolId) {
    const studentCtx = await requireContext("join_as_participant")
    schoolId = studentCtx.ok ? studentCtx.schoolId : null
  }
  if (!schoolId) {
    const guardianCtx = await requireContext("join_as_observer")
    schoolId = guardianCtx.ok ? guardianCtx.schoolId : null
  }
  if (!schoolId) {
    return actionError(ACTION_ERRORS.UNAUTHORIZED)
  }

  try {
    const session = await db.conference.findFirst({
      where: { id, schoolId, deletedAt: null },
      include: {
        teacher: { select: { id: true, firstName: true, lastName: true } },
        section: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true } },
      },
    })
    if (!session) return actionError(ACTION_ERRORS.LIVE_CLASS_NOT_FOUND)
    return { success: true as const, data: session }
  } catch {
    return actionError(ACTION_ERRORS.LOAD_FAILED)
  }
}
