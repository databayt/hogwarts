"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Subject-teacher assignment actions — the school-wide board and the
 * per-teacher editor (teacher wizard step + teachers row dialog) both save
 * through these. Admin-only: assigning a teacher rewrites the timetable.
 */
import { auth } from "@/auth"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { dispatchNotification } from "@/lib/dispatch-notification"
import { refreshPage } from "@/lib/refresh-page"
import { getTenantContext } from "@/lib/tenant-context"
import { resolveActiveTerm } from "@/lib/term-resolver"
import { getDisplayLang } from "@/components/translation/locale"
import { getLabels } from "@/components/translation/person"
import type { Lang } from "@/components/translation/types"

import { logTimetableAction } from "../permissions"
import { canModifyTimetable, type TimetableRole } from "../permissions-config"
import {
  applyAssignment,
  applyAssignmentsBatch,
  unassignPairs,
  type AssignmentOutcome,
} from "./apply"
import { cellKey } from "./keys"
import type { ResidualReason } from "./plan"
import {
  getAssignmentBoardData,
  getTeacherEditorData,
  type AssignmentBoardData,
  type TeacherEditorData,
} from "./queries"
import { suggestAssignments, type WaitingPair } from "./suggest"
import {
  assignTeacherSchema,
  saveTeacherSubjectsSchema,
  unassignTeacherSchema,
} from "./validation"

export interface AssignmentSummary {
  /** Periods the teacher now teaches out of those requested. */
  assigned: number
  scheduled: number
  /** Periods moved or swapped to make room. */
  moved: number
  residual: Array<{
    sectionName: string
    dayOfWeek: number
    periodName: string
    reason: ResidualReason
  }>
  load: { periodsPerWeek: number; cap: number }
}

type Ctx = { schoolId: string; userId: string; termId: string; lang: Lang }

async function authorize(): Promise<
  | { ok: true; ctx: Ctx }
  | { ok: false; response: ReturnType<typeof actionError> }
> {
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, response: actionError(ACTION_ERRORS.NOT_AUTHENTICATED) }
  }
  if (!canModifyTimetable(session.user.role as TimetableRole | undefined)) {
    return { ok: false, response: actionError(ACTION_ERRORS.UNAUTHORIZED) }
  }
  const { schoolId } = await getTenantContext()
  if (!schoolId) {
    return { ok: false, response: actionError(ACTION_ERRORS.MISSING_SCHOOL) }
  }
  const [{ term }, lang] = await Promise.all([
    resolveActiveTerm(schoolId),
    getDisplayLang(),
  ])
  if (!term) {
    return { ok: false, response: actionError(ACTION_ERRORS.NO_ACTIVE_TERM) }
  }
  return {
    ok: true,
    ctx: { schoolId, userId: session.user.id, termId: term.id, lang },
  }
}

/** Residual periods with display names, for the "couldn't place" list. */
async function summarize(
  ctx: Ctx,
  outcomes: AssignmentOutcome[]
): Promise<AssignmentSummary> {
  const residual = outcomes.flatMap((o) => o.residual)
  const [sections, periods] = residual.length
    ? await Promise.all([
        db.section.findMany({
          where: {
            schoolId: ctx.schoolId,
            id: { in: [...new Set(residual.map((r) => r.sectionId))] },
          },
          select: { id: true, name: true },
        }),
        db.period.findMany({
          where: {
            schoolId: ctx.schoolId,
            id: { in: [...new Set(residual.map((r) => r.periodId))] },
          },
          select: { id: true, name: true },
        }),
      ])
    : [[], []]
  const labels = await getLabels(
    [...sections.map((s) => s.name), ...periods.map((p) => p.name)],
    ctx.lang,
    ctx.schoolId
  )
  const sectionName = new Map(sections.map((s) => [s.id, s.name]))
  const periodName = new Map(periods.map((p) => [p.id, p.name]))
  const last = outcomes[outcomes.length - 1]
  return {
    assigned: outcomes.reduce((n, o) => n + o.assigned, 0),
    scheduled: outcomes.reduce((n, o) => n + o.scheduled, 0),
    moved: outcomes.reduce((n, o) => n + o.moved, 0),
    residual: residual.map((r) => {
      const s = sectionName.get(r.sectionId) ?? ""
      const p = periodName.get(r.periodId) ?? ""
      return {
        sectionName: labels.get(s) ?? s,
        dayOfWeek: r.dayOfWeek,
        periodName: labels.get(p) ?? p,
        reason: r.reason,
      }
    }),
    load: last?.load ?? { periodsPerWeek: 0, cap: 0 },
  }
}

/** Tell teachers whose periods moved to make room (in-app, non-blocking). */
async function notifyMoved(ctx: Ctx, teacherIds: string[]) {
  if (teacherIds.length === 0) return
  const [teachers, school] = await Promise.all([
    db.teacher.findMany({
      where: { schoolId: ctx.schoolId, id: { in: teacherIds } },
      select: { userId: true },
    }),
    db.school.findFirst({
      where: { id: ctx.schoolId },
      select: { preferredLanguage: true },
    }),
  ])
  const lang = school?.preferredLanguage === "en" ? "en" : "ar"
  for (const t of teachers) {
    if (!t.userId) continue
    dispatchNotification({
      schoolId: ctx.schoolId,
      userId: t.userId,
      type: "class_rescheduled",
      title: lang === "ar" ? "تغيير في الجدول" : "Schedule change",
      body:
        lang === "ar"
          ? "نُقلت بعض حصصك إلى أوقات جديدة لإفساح المجال لمعلم آخر."
          : "Some of your periods moved to new times to make room for another teacher.",
      lang,
      priority: "normal",
      channels: ["in_app"],
      metadata: { url: "/timetable" },
    }).catch((err) => console.error("[assignments] notification error:", err))
  }
}

function refresh() {
  refreshPage("/timetable")
  refreshPage("/teachers")
}

/**
 * A teacher's current weekly load and cap, plus a counter for how many
 * timetable periods a set of subject-in-section pairs holds — `taughtByTeacher`
 * counts only the periods this teacher already teaches (what removing frees),
 * otherwise only the ones they don't (what adding costs).
 */
async function projectLoad(
  ctx: Ctx,
  teacherId: string,
  pairs: Array<{ sectionId: string; subjectId: string }>
) {
  const sectionIds = [...new Set(pairs.map((p) => p.sectionId))]
  const [load, constraint, workload, slots] = await Promise.all([
    db.timetable.count({
      where: {
        schoolId: ctx.schoolId,
        termId: ctx.termId,
        weekOffset: 0,
        teacherId,
      },
    }),
    db.teacherConstraint.findFirst({
      where: {
        schoolId: ctx.schoolId,
        teacherId,
        OR: [{ termId: ctx.termId }, { termId: null }],
      },
      orderBy: { termId: "desc" },
      select: { maxPeriodsPerWeek: true },
    }),
    db.workloadConfig.findUnique({
      where: { schoolId: ctx.schoolId },
      select: { maxPeriodsPerWeek: true },
    }),
    sectionIds.length > 0
      ? db.timetable.findMany({
          where: {
            schoolId: ctx.schoolId,
            termId: ctx.termId,
            weekOffset: 0,
            sectionId: { in: sectionIds },
          },
          select: { sectionId: true, subjectId: true, teacherId: true },
        })
      : Promise.resolve([]),
  ])
  const cap = constraint?.maxPeriodsPerWeek || workload?.maxPeriodsPerWeek || 25
  const periodsOf = (
    list: Array<{ sectionId: string; subjectId: string }>,
    taughtByTeacher: boolean
  ) => {
    const keys = new Set(list.map((p) => cellKey(p.sectionId, p.subjectId)))
    return slots.filter(
      (s) =>
        !!s.sectionId &&
        !!s.subjectId &&
        keys.has(cellKey(s.sectionId, s.subjectId)) &&
        (s.teacherId === teacherId) === taughtByTeacher
    ).length
  }
  return { load, cap, periodsOf }
}

/**
 * Makes the teacher's specialties (TeacherSubjectExpertise) exactly
 * `specialtyIds` plus every subject they are assigned in `pairs` — teaching a
 * subject implies being qualified for it (apply.ts records that too). Ids are
 * validated by the caller. Returns whether anything changed.
 */
async function syncSpecialties(
  ctx: Ctx,
  teacherId: string,
  specialtyIds: string[],
  pairs: Array<{ subjectId: string }>
): Promise<boolean> {
  const wanted = new Set([...specialtyIds, ...pairs.map((p) => p.subjectId)])
  const current = await db.teacherSubjectExpertise.findMany({
    where: { schoolId: ctx.schoolId, teacherId },
    select: { subjectId: true },
  })
  const have = new Set(current.map((c) => c.subjectId))
  const drop = [...have].filter((id) => !wanted.has(id))
  const add = [...wanted].filter((id) => !have.has(id))
  if (drop.length === 0 && add.length === 0) return false
  await db.$transaction([
    db.teacherSubjectExpertise.deleteMany({
      where: { schoolId: ctx.schoolId, teacherId, subjectId: { in: drop } },
    }),
    db.teacherSubjectExpertise.createMany({
      data: add.map((subjectId) => ({
        schoolId: ctx.schoolId,
        teacherId,
        subjectId,
        expertiseLevel: "PRIMARY",
      })),
      skipDuplicates: true,
    }),
  ])
  return true
}

export async function getAssignmentBoard(): Promise<
  ActionResponse<AssignmentBoardData>
> {
  try {
    const authz = await authorize()
    if (!authz.ok) return authz.response
    const data = await getAssignmentBoardData(authz.ctx)
    return { success: true, data }
  } catch (error) {
    console.error("[assignments] board", error)
    return actionError(ACTION_ERRORS.LOAD_FAILED)
  }
}

export async function getTeacherSubjects(
  teacherId: string
): Promise<ActionResponse<TeacherEditorData>> {
  try {
    const authz = await authorize()
    if (!authz.ok) return authz.response
    const data = await getTeacherEditorData({ ...authz.ctx, teacherId })
    if (!data) return actionError(ACTION_ERRORS.TEACHER_NOT_FOUND)
    return { success: true, data }
  } catch (error) {
    console.error("[assignments] teacher subjects", error)
    return actionError(ACTION_ERRORS.LOAD_FAILED)
  }
}

/** Board cell / bulk: one teacher takes one subject in some sections. */
export async function assignTeacher(
  input: unknown
): Promise<ActionResponse<AssignmentSummary>> {
  try {
    const authz = await authorize()
    if (!authz.ok) return authz.response
    const { ctx } = authz
    const parsed = assignTeacherSchema.safeParse(input)
    if (!parsed.success) return actionError(ACTION_ERRORS.VALIDATION_ERROR)

    const result = await applyAssignment({
      schoolId: ctx.schoolId,
      termId: ctx.termId,
      teacherId: parsed.data.teacherId,
      subjectId: parsed.data.subjectId,
      sectionIds: parsed.data.sectionIds,
      assignedById: ctx.userId,
      respectCap: !parsed.data.overrideCap,
    })
    if (!result.ok) {
      return actionError(
        ACTION_ERRORS[result.code],
        result.load
          ? `${result.load.periodsPerWeek}/${result.load.cap}`
          : undefined
      )
    }

    await logTimetableAction("assign_teacher", {
      entityType: "assignment",
      entityId: parsed.data.teacherId,
      metadata: {
        subjectId: parsed.data.subjectId,
        sectionIds: parsed.data.sectionIds,
        assigned: result.assigned,
        moved: result.moved,
        residual: result.residual.length,
      },
    })
    await notifyMoved(ctx, result.affectedTeacherIds)
    refresh()
    return { success: true, data: await summarize(ctx, [result]) }
  } catch (error) {
    console.error("[assignments] assign", error)
    return actionError(ACTION_ERRORS.ASSIGNMENT_FAILED)
  }
}

/** Board cell: a subject in some sections goes back to "waiting". */
export async function unassignTeacher(
  input: unknown
): Promise<ActionResponse<{ cleared: number }>> {
  try {
    const authz = await authorize()
    if (!authz.ok) return authz.response
    const { ctx } = authz
    const parsed = unassignTeacherSchema.safeParse(input)
    if (!parsed.success) return actionError(ACTION_ERRORS.VALIDATION_ERROR)

    const sections = await db.section.count({
      where: { schoolId: ctx.schoolId, id: { in: parsed.data.sectionIds } },
    })
    if (sections !== new Set(parsed.data.sectionIds).size) {
      return actionError(ACTION_ERRORS.INVALID_SECTION)
    }

    const result = await unassignPairs({
      schoolId: ctx.schoolId,
      termId: ctx.termId,
      subjectId: parsed.data.subjectId,
      sectionIds: parsed.data.sectionIds,
    })
    await logTimetableAction("unassign_teacher", {
      entityType: "assignment",
      metadata: { ...parsed.data, cleared: result.cleared },
    })
    refresh()
    return { success: true, data: result }
  } catch (error) {
    console.error("[assignments] unassign", error)
    return actionError(ACTION_ERRORS.ASSIGNMENT_FAILED)
  }
}

/**
 * Teacher editor save: the teacher's complete set of subject-in-section
 * pairs. Pairs dropped go back to waiting; pairs added are assigned (taking
 * them over from another teacher if needed). The weekly cap is checked for
 * the whole edit before anything is written.
 */
export async function saveTeacherSubjects(
  input: unknown
): Promise<ActionResponse<AssignmentSummary>> {
  try {
    const authz = await authorize()
    if (!authz.ok) return authz.response
    const { ctx } = authz
    const parsed = saveTeacherSubjectsSchema.safeParse(input)
    if (!parsed.success) return actionError(ACTION_ERRORS.VALIDATION_ERROR)
    const { teacherId, pairs, overrideCap, specialtyIds } = parsed.data

    const teacher = await db.teacher.findFirst({
      where: { id: teacherId, schoolId: ctx.schoolId },
      select: { id: true },
    })
    if (!teacher) return actionError(ACTION_ERRORS.TEACHER_NOT_FOUND)

    const current = await db.subjectTeacher.findMany({
      where: { schoolId: ctx.schoolId, termId: ctx.termId, teacherId },
      select: { sectionId: true, subjectId: true },
    })
    const desired = new Set(pairs.map((p) => cellKey(p.sectionId, p.subjectId)))
    const held = new Set(current.map((p) => cellKey(p.sectionId, p.subjectId)))
    const removed = current.filter(
      (p) => !desired.has(cellKey(p.sectionId, p.subjectId))
    )
    const added = pairs.filter(
      (p) => !held.has(cellKey(p.sectionId, p.subjectId))
    )

    const bySubject = (
      list: Array<{ subjectId: string; sectionId: string }>
    ) => {
      const m = new Map<string, string[]>()
      for (const p of list)
        m.set(p.subjectId, [...(m.get(p.subjectId) ?? []), p.sectionId])
      return m
    }

    // Specialties must be subjects the school teaches (or ones the teacher
    // already holds — a subject the school later switched off must not block
    // the save). Checked before any write.
    if (specialtyIds && specialtyIds.length > 0) {
      const ids = [...new Set(specialtyIds)]
      const [offered, held] = await Promise.all([
        db.subjectSelection.findMany({
          where: { schoolId: ctx.schoolId, catalogSubjectId: { in: ids } },
          select: { catalogSubjectId: true },
          distinct: ["catalogSubjectId"],
        }),
        db.teacherSubjectExpertise.findMany({
          where: { schoolId: ctx.schoolId, teacherId, subjectId: { in: ids } },
          select: { subjectId: true },
        }),
      ])
      const known = new Set([
        ...offered.map((o) => o.catalogSubjectId),
        ...held.map((h) => h.subjectId),
      ])
      if (ids.some((sid) => !known.has(sid))) {
        return actionError(ACTION_ERRORS.VALIDATION_ERROR)
      }
    }

    // Whole-edit cap check, before any write.
    const {
      load: currentLoad,
      cap,
      periodsOf,
    } = await projectLoad(ctx, teacherId, [...removed, ...added])
    const projected =
      currentLoad - periodsOf(removed, true) + periodsOf(added, false)
    if (!overrideCap && added.length > 0 && projected > cap) {
      return actionError(ACTION_ERRORS.TEACHER_OVER_CAP, `${projected}/${cap}`)
    }

    for (const [subjectId, sectionIds] of bySubject(removed)) {
      await unassignPairs({
        schoolId: ctx.schoolId,
        termId: ctx.termId,
        subjectId,
        sectionIds,
      })
    }

    const outcomes: AssignmentOutcome[] = []
    for (const [subjectId, sectionIds] of bySubject(added)) {
      const result = await applyAssignment({
        schoolId: ctx.schoolId,
        termId: ctx.termId,
        teacherId,
        subjectId,
        sectionIds,
        assignedById: ctx.userId,
        respectCap: false, // checked above for the whole edit
      })
      if (!result.ok) return actionError(ACTION_ERRORS[result.code])
      outcomes.push(result)
    }

    const specialtiesChanged = specialtyIds
      ? await syncSpecialties(ctx, teacherId, specialtyIds, pairs)
      : false
    if (specialtiesChanged && removed.length === 0 && added.length === 0) {
      refresh()
    }

    if (removed.length > 0 || added.length > 0) {
      await logTimetableAction("assign_teacher", {
        entityType: "assignment",
        entityId: teacherId,
        metadata: { added: added.length, removed: removed.length },
      })
      await notifyMoved(ctx, [
        ...new Set(outcomes.flatMap((o) => o.affectedTeacherIds)),
      ])
      refresh()
    }

    const summary = await summarize(ctx, outcomes)
    // Removals don't come back through the planner: report the real load.
    summary.load = {
      periodsPerWeek: await db.timetable.count({
        where: {
          schoolId: ctx.schoolId,
          termId: ctx.termId,
          weekOffset: 0,
          teacherId,
        },
      }),
      cap,
    }
    return { success: true, data: summary }
  } catch (error) {
    console.error("[assignments] save teacher subjects", error)
    return actionError(ACTION_ERRORS.ASSIGNMENT_FAILED)
  }
}

/**
 * Board "Suggest": every subject still waiting for a teacher goes to a
 * teacher qualified for it who has room (suggest.ts), and is assigned right
 * away. Never touches a subject that already has a teacher.
 */
export async function suggestTeacherAssignments(): Promise<
  ActionResponse<{
    pairs: number
    assigned: number
    moved: number
    residual: number
  }>
> {
  try {
    const authz = await authorize()
    if (!authz.ok) return authz.response
    const { ctx } = authz

    const board = await getAssignmentBoardData(ctx)
    const waiting: WaitingPair[] = []
    for (const grade of board.grades) {
      for (const section of grade.sections) {
        for (const subject of grade.subjects) {
          const cell =
            board.cells[cellKey(section.sectionId, subject.subjectId)]
          if (cell?.teacherId) continue
          waiting.push({
            sectionId: section.sectionId,
            gradeId: grade.gradeId,
            subjectId: subject.subjectId,
            periods: cell?.scheduled || subject.weeklyPeriods || 0,
          })
        }
      }
    }

    const suggestions = suggestAssignments(
      waiting,
      board.teachers.map((t) => ({
        teacherId: t.teacherId,
        subjectIds: t.subjectIds,
        load: t.load,
        cap: t.cap,
      }))
    )

    // One transaction for every suggestion (suggest.ts already kept each
    // teacher under their cap).
    const { outcomes } = await applyAssignmentsBatch({
      schoolId: ctx.schoolId,
      termId: ctx.termId,
      requests: suggestions,
      assignedById: ctx.userId,
    })

    if (outcomes.length > 0) {
      await logTimetableAction("assign_teacher", {
        entityType: "assignment",
        metadata: { suggested: outcomes.length },
      })
      await notifyMoved(ctx, [
        ...new Set(outcomes.flatMap((o) => o.affectedTeacherIds)),
      ])
      refresh()
    }

    return {
      success: true,
      data: {
        pairs: suggestions
          .filter((s) =>
            outcomes.some(
              (o) => o.teacherId === s.teacherId && o.subjectId === s.subjectId
            )
          )
          .reduce((n, s) => n + s.sectionIds.length, 0),
        assigned: outcomes.reduce((n, o) => n + o.assigned, 0),
        moved: outcomes.reduce((n, o) => n + o.moved, 0),
        residual: outcomes.reduce((n, o) => n + o.residual.length, 0),
      },
    }
  } catch (error) {
    console.error("[assignments] suggest", error)
    return actionError(ACTION_ERRORS.ASSIGNMENT_FAILED)
  }
}
