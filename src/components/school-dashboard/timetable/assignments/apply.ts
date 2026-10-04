// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Writes a teaching assignment: who teaches a subject in some sections, plus
 * every timetable change the planner needs to make room for them.
 *
 * Plain server module, deliberately NOT "use server" — callers (the
 * assignment actions, the teacher editor, seeds) authorize first and pass the
 * school they resolved. Everything runs in ONE transaction under a per-term
 * advisory lock, so two admins assigning at once can't plan against the same
 * stale timetable.
 */

import type { Prisma, PrismaClient } from "@prisma/client"

import { db as defaultDb } from "@/lib/db"

import {
  planAssignment,
  type PlanSlot,
  type PlanState,
  type ResidualReason,
  type SlotPatch,
  type TeacherRules,
} from "./plan"

type Tx = Prisma.TransactionClient

const DEFAULT_PER_DAY = 6
const DEFAULT_PER_WEEK = 25
const DEFAULT_WORKING_DAYS = [0, 1, 2, 3, 4]

export type AssignmentErrorCode =
  | "TEACHER_NOT_FOUND"
  | "INVALID_SECTION"
  | "SUBJECT_NOT_IN_GRADE"
  | "TEACHER_OVER_CAP"

export interface AssignmentLoad {
  periodsPerWeek: number
  cap: number
}

export interface AssignmentOutcome {
  ok: true
  termId: string
  teacherId: string
  subjectId: string
  /** Periods of this subject in these sections the teacher now teaches. */
  assigned: number
  /** Periods of this subject in these sections that exist in the timetable. */
  scheduled: number
  /** Periods that changed time or swapped to make room. */
  moved: number
  /** Periods another teacher taught before. */
  released: number
  residual: Array<{
    slotId: string
    sectionId: string
    dayOfWeek: number
    periodId: string
    reason: ResidualReason
  }>
  load: AssignmentLoad
  /** Other teachers whose periods moved (worth telling). */
  affectedTeacherIds: string[]
  dryRun: boolean
}

export type AssignmentResult =
  | AssignmentOutcome
  | { ok: false; code: AssignmentErrorCode; load?: AssignmentLoad }

export interface AssignmentInput {
  schoolId: string
  termId: string
  teacherId: string
  subjectId: string
  sectionIds: string[]
  assignedById?: string | null
  /** Refuse (TEACHER_OVER_CAP) instead of going past the weekly cap. */
  respectCap?: boolean
  dryRun?: boolean
}

/** Serializes timetable writes for one school's term. */
async function lockTerm(tx: Tx, schoolId: string, termId: string) {
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`timetable:${schoolId}:${termId}`})) IS NULL AS locked`
}

/**
 * Writes planner patches safely. Every changed row is first parked at
 * weekOffset -1 — outside the (section/room × day × period × weekOffset)
 * unique indexes — and then written with its final values. Moves and lesson
 * swaps can chain (A leaves a period B then takes; two lessons trade places),
 * and no write order alone avoids a transient unique clash; parking does.
 */
async function writePatches(tx: Tx, schoolId: string, patches: SlotPatch[]) {
  if (patches.length === 0) return
  await tx.timetable.updateMany({
    where: { schoolId, id: { in: patches.map((p) => p.id) } },
    data: { weekOffset: -1 },
  })
  for (const { id, ...data } of patches) {
    await tx.timetable.update({
      where: { id },
      data: { ...data, weekOffset: 0 },
    })
  }
}

/** The planner's result applied to a state, for chaining plans in memory. */
function applyPatches(state: PlanState, patches: SlotPatch[]): PlanState {
  if (patches.length === 0) return state
  const byId = new Map(patches.map((p) => [p.id, p]))
  return {
    ...state,
    slots: state.slots.map((slot) => {
      const p = byId.get(slot.id)
      return p ? { ...slot, ...p } : slot
    }),
  }
}

/** Final diff of `after` against `before`, one patch per changed row. */
function diffStates(before: PlanState, after: PlanState): SlotPatch[] {
  const original = new Map(before.slots.map((s) => [s.id, s]))
  const out: SlotPatch[] = []
  for (const s of after.slots) {
    const o = original.get(s.id)!
    const p: SlotPatch = { id: s.id }
    if (s.dayOfWeek !== o.dayOfWeek) p.dayOfWeek = s.dayOfWeek
    if (s.periodId !== o.periodId) p.periodId = s.periodId
    if (s.subjectId !== o.subjectId) p.subjectId = s.subjectId
    if (s.teacherId !== o.teacherId) p.teacherId = s.teacherId
    if (s.classroomId !== o.classroomId) p.classroomId = s.classroomId
    if (Object.keys(p).length > 1) out.push(p)
  }
  return out
}

/** The term's timetable as the pure planner sees it. */
export async function loadPlanState(
  tx: Tx,
  schoolId: string,
  termId: string,
  yearId: string
): Promise<PlanState> {
  const now = new Date()
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)

  const [rows, periods, weekConfig, workload, constraints] = await Promise.all([
    tx.timetable.findMany({
      where: { schoolId, termId, weekOffset: 0 },
      select: {
        id: true,
        dayOfWeek: true,
        periodId: true,
        sectionId: true,
        subjectId: true,
        teacherId: true,
        classroomId: true,
      },
    }),
    tx.period.findMany({
      where: { schoolId, yearId, isBreak: false },
      orderBy: { startTime: "asc" },
      select: { id: true },
    }),
    tx.schoolWeekConfig.findFirst({
      where: { schoolId, OR: [{ termId }, { termId: null }] },
      orderBy: { termId: "desc" },
      select: { workingDays: true },
    }),
    tx.workloadConfig.findUnique({
      where: { schoolId },
      select: { maxPeriodsPerWeek: true },
    }),
    tx.teacherConstraint.findMany({
      where: { schoolId, OR: [{ termId }, { termId: null }] },
      select: {
        teacherId: true,
        termId: true,
        maxPeriodsPerDay: true,
        maxPeriodsPerWeek: true,
        unavailableBlocks: { select: { dayOfWeek: true, periodId: true } },
      },
    }),
  ])

  const ids = rows.map((r) => r.id)
  const [liveOrUpcoming, substitutions] =
    ids.length > 0
      ? await Promise.all([
          tx.conference.findMany({
            where: {
              schoolId,
              timetableId: { in: ids },
              OR: [
                { status: "live" },
                { status: "scheduled", scheduledStart: { gt: now } },
              ],
            },
            select: { timetableId: true },
          }),
          tx.substitutionRecord.findMany({
            where: {
              schoolId,
              originalSlotId: { in: ids },
              status: { in: ["PENDING", "CONFIRMED"] },
              slotDate: { gte: startOfToday },
            },
            select: { originalSlotId: true },
          }),
        ])
      : [[], []]
  const fixed = new Set<string>([
    ...liveOrUpcoming.flatMap((c) => (c.timetableId ? [c.timetableId] : [])),
    ...substitutions.map((s) => s.originalSlotId),
  ])

  const defaultRules: TeacherRules = {
    maxPerDay: DEFAULT_PER_DAY,
    maxPerWeek: workload?.maxPeriodsPerWeek ?? DEFAULT_PER_WEEK,
    unavailable: new Set(),
  }
  // A term-specific constraint beats the school-wide one.
  const rules = new Map<string, TeacherRules>()
  for (const c of [...constraints].sort((a, b) =>
    a.termId === b.termId ? 0 : a.termId ? 1 : -1
  )) {
    rules.set(c.teacherId, {
      maxPerDay: c.maxPeriodsPerDay || defaultRules.maxPerDay,
      maxPerWeek: c.maxPeriodsPerWeek || defaultRules.maxPerWeek,
      unavailable: new Set(
        c.unavailableBlocks.map((b) => `${b.dayOfWeek}:${b.periodId}`)
      ),
    })
  }

  const slots: PlanSlot[] = rows.map((r) => ({
    ...r,
    fixed: fixed.has(r.id),
  }))

  return {
    slots,
    workingDays:
      Array.isArray(weekConfig?.workingDays) &&
      weekConfig.workingDays.length > 0
        ? weekConfig.workingDays
        : DEFAULT_WORKING_DAYS,
    periodOrder: periods.map((p) => p.id),
    rules,
    defaultRules,
  }
}

export async function applyAssignment(
  input: AssignmentInput,
  client: PrismaClient = defaultDb
): Promise<AssignmentResult> {
  const { schoolId, termId, teacherId, subjectId } = input
  const sectionIds = [...new Set(input.sectionIds)]

  return client.$transaction(
    async (tx) => {
      await lockTerm(tx, schoolId, termId)

      const [teacher, term, sections] = await Promise.all([
        tx.teacher.findFirst({
          where: { id: teacherId, schoolId, employmentStatus: "ACTIVE" },
          select: { id: true },
        }),
        tx.term.findFirst({
          where: { id: termId, schoolId },
          select: { yearId: true },
        }),
        tx.section.findMany({
          where: { id: { in: sectionIds }, schoolId },
          select: { id: true, gradeId: true },
        }),
      ])
      if (!teacher) return { ok: false, code: "TEACHER_NOT_FOUND" }
      if (!term || sections.length !== sectionIds.length) {
        return { ok: false, code: "INVALID_SECTION" }
      }

      // The subject must be one the section's grade takes.
      const gradeIds = [...new Set(sections.map((s) => s.gradeId))]
      const selections = await tx.subjectSelection.findMany({
        where: {
          schoolId,
          catalogSubjectId: subjectId,
          isActive: true,
          gradeId: { in: gradeIds },
        },
        select: { gradeId: true },
      })
      const taught = new Set(selections.map((s) => s.gradeId))
      if (gradeIds.some((g) => !taught.has(g))) {
        return { ok: false, code: "SUBJECT_NOT_IN_GRADE" }
      }

      const state = await loadPlanState(tx, schoolId, termId, term.yearId)
      const teacherRules = state.rules.get(teacherId) ?? state.defaultRules
      const targets = state.slots.filter(
        (s) =>
          s.subjectId === subjectId &&
          !!s.sectionId &&
          sectionIds.includes(s.sectionId)
      )
      const currentLoad = state.slots.filter(
        (s) => s.teacherId === teacherId
      ).length
      const projected =
        currentLoad + targets.filter((s) => s.teacherId !== teacherId).length
      if (input.respectCap && projected > teacherRules.maxPerWeek) {
        return {
          ok: false,
          code: "TEACHER_OVER_CAP",
          load: { periodsPerWeek: projected, cap: teacherRules.maxPerWeek },
        }
      }

      // Overriding the cap: the planner may go past this teacher's weekly cap.
      const planState: PlanState = input.respectCap
        ? state
        : {
            ...state,
            rules: new Map(state.rules).set(teacherId, {
              ...teacherRules,
              maxPerWeek: Number.POSITIVE_INFINITY,
            }),
          }
      const plan = planAssignment(planState, {
        teacherId,
        subjectId,
        sectionIds,
      })

      const before = new Map(state.slots.map((s) => [s.id, s]))
      const affectedTeacherIds = [
        ...new Set(
          plan.moved
            .map((id) => before.get(id)?.teacherId)
            .filter((t): t is string => !!t && t !== teacherId)
        ),
      ]
      const finalLoad =
        currentLoad +
        plan.patches.filter(
          (p) =>
            p.teacherId === teacherId &&
            before.get(p.id)?.teacherId !== teacherId
        ).length -
        plan.patches.filter(
          (p) =>
            p.teacherId !== undefined &&
            p.teacherId !== teacherId &&
            before.get(p.id)?.teacherId === teacherId
        ).length

      const outcome: AssignmentOutcome = {
        ok: true,
        termId,
        teacherId,
        subjectId,
        assigned: plan.assigned.length,
        scheduled: targets.length,
        moved: plan.moved.length,
        released: plan.released.length,
        residual: plan.residual.map((r) => {
          const slot = before.get(r.slotId)!
          return {
            slotId: r.slotId,
            sectionId: slot.sectionId!,
            dayOfWeek: slot.dayOfWeek,
            periodId: slot.periodId,
            reason: r.reason,
          }
        }),
        load: { periodsPerWeek: finalLoad, cap: teacherRules.maxPerWeek },
        affectedTeacherIds,
        dryRun: !!input.dryRun,
      }
      if (input.dryRun) return outcome

      await writePatches(tx, schoolId, plan.patches)

      // Scheduled online classes on changed periods were set up for the old
      // teacher, subject or time — cancel them; the daily sweep re-creates
      // them from the new timetable. A live class is never touched.
      const changedIds = plan.patches.map((p) => p.id)
      if (changedIds.length > 0) {
        await tx.conference.updateMany({
          where: {
            schoolId,
            timetableId: { in: changedIds },
            status: "scheduled",
            scheduledStart: { gt: new Date() },
          },
          data: { status: "cancelled" },
        })
      }

      for (const sectionId of sectionIds) {
        await tx.subjectTeacher.upsert({
          where: {
            schoolId_termId_sectionId_subjectId: {
              schoolId,
              termId,
              sectionId,
              subjectId,
            },
          },
          create: {
            schoolId,
            termId,
            sectionId,
            subjectId,
            teacherId,
            assignedById: input.assignedById ?? null,
          },
          update: { teacherId, assignedById: input.assignedById ?? null },
        })
      }

      // Teaching a subject implies being qualified for it — keeps the slot
      // editor's TEACHER_NOT_QUALIFIED guard and the generator consistent.
      await tx.teacherSubjectExpertise.upsert({
        where: {
          schoolId_teacherId_subjectId: { schoolId, teacherId, subjectId },
        },
        create: { schoolId, teacherId, subjectId, expertiseLevel: "PRIMARY" },
        update: {},
      })

      return outcome
    },
    { timeout: 20000, maxWait: 5000 }
  )
}

/**
 * Takes a subject in some sections away from whoever teaches it: the rows go
 * and its periods return to "waiting for a teacher". Qualification stays.
 */
export async function unassignPairs(
  input: {
    schoolId: string
    termId: string
    subjectId: string
    sectionIds: string[]
  },
  client: PrismaClient = defaultDb
): Promise<{ cleared: number }> {
  const { schoolId, termId, subjectId, sectionIds } = input
  return client.$transaction(async (tx) => {
    await lockTerm(tx, schoolId, termId)
    const slots = await tx.timetable.findMany({
      where: {
        schoolId,
        termId,
        subjectId,
        sectionId: { in: sectionIds },
        teacherId: { not: null },
      },
      select: { id: true },
    })
    const ids = slots.map((s) => s.id)
    if (ids.length > 0) {
      await tx.timetable.updateMany({
        where: { schoolId, id: { in: ids } },
        data: { teacherId: null },
      })
      await tx.conference.updateMany({
        where: {
          schoolId,
          timetableId: { in: ids },
          status: "scheduled",
          scheduledStart: { gt: new Date() },
        },
        data: { status: "cancelled" },
      })
    }
    await tx.subjectTeacher.deleteMany({
      where: { schoolId, termId, subjectId, sectionId: { in: sectionIds } },
    })
    return { cleared: ids.length }
  })
}

/**
 * A teacher leaves (deactivated) or is deleted: their periods go back to
 * "waiting for a teacher" and their assignments are dropped — for the
 * current and future terms, or every term when `allTerms` (deletion: the
 * timetable's teacher FK would otherwise refuse the delete). Past terms keep
 * their history otherwise. Scheduled online classes on freed periods are
 * cancelled.
 */
export async function releaseTeacher(
  input: { schoolId: string; teacherId: string; allTerms?: boolean },
  client: PrismaClient | Tx = defaultDb
): Promise<{ periods: number; pairs: number }> {
  const { schoolId, teacherId } = input
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const run = async (tx: Tx) => {
    const terms = await tx.term.findMany({
      where: {
        schoolId,
        ...(input.allTerms ? {} : { endDate: { gte: startOfToday } }),
      },
      select: { id: true },
    })
    const termIds = terms.map((t) => t.id)
    if (termIds.length === 0) return { periods: 0, pairs: 0 }

    const slots = await tx.timetable.findMany({
      where: { schoolId, teacherId, termId: { in: termIds } },
      select: { id: true },
    })
    const slotIds = slots.map((s) => s.id)
    if (slotIds.length > 0) {
      await tx.timetable.updateMany({
        where: { schoolId, id: { in: slotIds } },
        data: { teacherId: null },
      })
      await tx.conference.updateMany({
        where: {
          schoolId,
          timetableId: { in: slotIds },
          status: "scheduled",
          scheduledStart: { gt: new Date() },
        },
        data: { status: "cancelled" },
      })
    }
    const pairs = await tx.subjectTeacher.deleteMany({
      where: { schoolId, teacherId, termId: { in: termIds } },
    })
    return { periods: slotIds.length, pairs: pairs.count }
  }

  // Inside a caller's transaction, or our own.
  return "$transaction" in client
    ? (client as PrismaClient).$transaction(run)
    : run(client as Tx)
}

/**
 * Many assignments at once in ONE transaction: the term is loaded and locked
 * once, every request is planned in memory against the result of the ones
 * before it, and the combined change is written once. Used when a new term
 * inherits last term's teachers (carry.ts) and by the board's Suggest.
 * Requests that fail validation are skipped and reported, never fatal.
 * No weekly-cap refusal: callers that care check first.
 */
export async function applyAssignmentsBatch(
  input: {
    schoolId: string
    termId: string
    requests: Array<{
      teacherId: string
      subjectId: string
      sectionIds: string[]
    }>
    assignedById?: string | null
  },
  client: PrismaClient = defaultDb
): Promise<{ outcomes: AssignmentOutcome[]; skipped: number }> {
  const { schoolId, termId } = input
  if (input.requests.length === 0) return { outcomes: [], skipped: 0 }

  return client.$transaction(
    async (tx) => {
      await lockTerm(tx, schoolId, termId)
      const term = await tx.term.findFirst({
        where: { id: termId, schoolId },
        select: { yearId: true },
      })
      if (!term) return { outcomes: [], skipped: input.requests.length }

      const teacherIds = [...new Set(input.requests.map((r) => r.teacherId))]
      const sectionIds = [
        ...new Set(input.requests.flatMap((r) => r.sectionIds)),
      ]
      const [teachers, sections, selections] = await Promise.all([
        tx.teacher.findMany({
          where: {
            id: { in: teacherIds },
            schoolId,
            employmentStatus: "ACTIVE",
          },
          select: { id: true },
        }),
        tx.section.findMany({
          where: { id: { in: sectionIds }, schoolId },
          select: { id: true, gradeId: true },
        }),
        tx.subjectSelection.findMany({
          where: { schoolId, isActive: true },
          select: { gradeId: true, catalogSubjectId: true },
        }),
      ])
      const activeTeachers = new Set(teachers.map((t) => t.id))
      const gradeOf = new Map(sections.map((x) => [x.id, x.gradeId]))
      const taught = new Set(
        selections.map((x) => `${x.gradeId}|${x.catalogSubjectId}`)
      )

      const initial = await loadPlanState(tx, schoolId, termId, term.yearId)
      // Batch callers vet load themselves; no per-request cap here.
      let state: PlanState = {
        ...initial,
        rules: new Map(
          [...teacherIds].map((id) => [
            id,
            {
              ...(initial.rules.get(id) ?? initial.defaultRules),
              maxPerWeek: Number.POSITIVE_INFINITY,
            },
          ])
        ),
      }
      for (const [id, r] of initial.rules) {
        if (!state.rules.has(id))
          (state.rules as Map<string, TeacherRules>).set(id, r)
      }

      const outcomes: AssignmentOutcome[] = []
      const saved: Array<{
        teacherId: string
        subjectId: string
        sectionId: string
      }> = []
      let skipped = 0
      for (const req of input.requests) {
        const valid =
          activeTeachers.has(req.teacherId) &&
          req.sectionIds.length > 0 &&
          req.sectionIds.every((id) => {
            const g = gradeOf.get(id)
            return !!g && taught.has(`${g}|${req.subjectId}`)
          })
        if (!valid) {
          skipped++
          continue
        }
        const before = new Map(state.slots.map((x) => [x.id, x]))
        const plan = planAssignment(state, req)
        state = applyPatches(state, plan.patches)
        for (const sectionId of req.sectionIds) {
          saved.push({
            teacherId: req.teacherId,
            subjectId: req.subjectId,
            sectionId,
          })
        }
        outcomes.push({
          ok: true,
          termId,
          teacherId: req.teacherId,
          subjectId: req.subjectId,
          assigned: plan.assigned.length,
          scheduled: [...before.values()].filter(
            (x) =>
              x.subjectId === req.subjectId &&
              !!x.sectionId &&
              req.sectionIds.includes(x.sectionId)
          ).length,
          moved: plan.moved.length,
          released: plan.released.length,
          residual: plan.residual.map((r) => {
            const slot = before.get(r.slotId)!
            return {
              slotId: r.slotId,
              sectionId: slot.sectionId!,
              dayOfWeek: slot.dayOfWeek,
              periodId: slot.periodId,
              reason: r.reason,
            }
          }),
          load: {
            periodsPerWeek: state.slots.filter(
              (x) => x.teacherId === req.teacherId
            ).length,
            cap: (initial.rules.get(req.teacherId) ?? initial.defaultRules)
              .maxPerWeek,
          },
          affectedTeacherIds: [
            ...new Set(
              plan.moved
                .map((id) => before.get(id)?.teacherId)
                .filter((t): t is string => !!t && t !== req.teacherId)
            ),
          ],
          dryRun: false,
        })
      }

      const patches = diffStates(initial, state)
      await writePatches(tx, schoolId, patches)
      if (patches.length > 0) {
        await tx.conference.updateMany({
          where: {
            schoolId,
            timetableId: { in: patches.map((p) => p.id) },
            status: "scheduled",
            scheduledStart: { gt: new Date() },
          },
          data: { status: "cancelled" },
        })
      }
      for (const a of saved) {
        await tx.subjectTeacher.upsert({
          where: {
            schoolId_termId_sectionId_subjectId: {
              schoolId,
              termId,
              sectionId: a.sectionId,
              subjectId: a.subjectId,
            },
          },
          create: {
            schoolId,
            termId,
            sectionId: a.sectionId,
            subjectId: a.subjectId,
            teacherId: a.teacherId,
            assignedById: input.assignedById ?? null,
          },
          update: {
            teacherId: a.teacherId,
            assignedById: input.assignedById ?? null,
          },
        })
      }
      const qualified = new Set(
        saved.map((a) => `${a.teacherId}|${a.subjectId}`)
      )
      for (const key of qualified) {
        const [teacherId, subjectId] = key.split("|")
        await tx.teacherSubjectExpertise.upsert({
          where: {
            schoolId_teacherId_subjectId: { schoolId, teacherId, subjectId },
          },
          create: { schoolId, teacherId, subjectId, expertiseLevel: "PRIMARY" },
          update: {},
        })
      }

      return { outcomes, skipped }
    },
    { timeout: 60000, maxWait: 10000 }
  )
}
