// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Assignment planner — puts one teacher on one subject's periods in some
 * sections, rearranging periods inside a section where the teacher is busy.
 *
 * Pure: no database. `apply.ts` loads the term, runs this, and writes the
 * patches. Kept pure so every clash rule is unit-tested.
 *
 * Model: every timetable row is a *cell* (a section at a day/period) holding
 * a *lesson* (subject + teacher + room). Assigning works in three passes:
 *
 *   0. release — the subject's cells in the requested sections lose any
 *      other teacher (the admin is handing the subject to this teacher);
 *   1. direct  — the teacher takes every one of those cells they are free at;
 *   2. repair  — each cell left over swaps its lesson with another lesson of
 *      the SAME section (or moves into an empty period of that section) where
 *      the teacher is free, provided the other lesson's teacher is free at the
 *      old time and both rooms stay valid.
 *
 * Hard rules: only the requested sections change, one section at a time; a
 * fixed cell (live/upcoming online class, pending substitution) never moves;
 * no teacher, room or section is ever double-booked; daily and weekly caps
 * hold. Soft preferences: avoid the same subject twice in a day, prefer
 * teacher-less swaps and short distances. Ties break on (day, period, id), so
 * the same input always gives the same plan.
 */

export interface PlanSlot {
  id: string
  dayOfWeek: number
  periodId: string
  sectionId: string | null
  subjectId: string | null
  teacherId: string | null
  classroomId: string
  /** Live or upcoming online class, or a pending substitution: never moved. */
  fixed: boolean
}

export interface TeacherRules {
  maxPerDay: number
  maxPerWeek: number
  /** `${dayOfWeek}:${periodId}` positions the teacher can't teach. */
  unavailable: ReadonlySet<string>
}

export interface PlanState {
  slots: readonly PlanSlot[]
  workingDays: readonly number[]
  /** Teaching periods in day order. */
  periodOrder: readonly string[]
  rules: ReadonlyMap<string, TeacherRules>
  defaultRules: TeacherRules
}

export interface AssignmentRequest {
  teacherId: string
  subjectId: string
  sectionIds: readonly string[]
}

export type ResidualReason = "FIXED_SESSION" | "WEEKLY_CAP" | "NO_SWAP"

export interface SlotPatch {
  id: string
  dayOfWeek?: number
  periodId?: string
  subjectId?: string | null
  teacherId?: string | null
  classroomId?: string
}

export interface AssignmentPlan {
  patches: SlotPatch[]
  /** Cells that now hold this subject with this teacher. */
  assigned: string[]
  /** Cells whose lesson or time changed to make room. */
  moved: string[]
  /**
   * Cells whose position (day/period) changed, in the order the planner moved
   * them. A later move can take a period an earlier move freed, so writes must
   * follow this order or they trip the section/room unique indexes.
   */
  moveOrder: string[]
  /** Cells of this subject another teacher taught before. */
  released: string[]
  /** Cells of this subject the teacher could not take. */
  residual: Array<{ slotId: string; reason: ResidualReason }>
}

type Cell = Omit<PlanSlot, "fixed"> & { fixed: boolean }

const pos = (day: number, periodId: string) => `${day}:${periodId}`

/** Mutable occupancy index over the working copy of the term. */
class Occupancy {
  readonly teacherAt = new Map<string, Map<string, string>>()
  readonly teacherDay = new Map<string, Map<number, number>>()
  readonly teacherWeek = new Map<string, number>()
  readonly roomAt = new Map<string, Map<string, string>>()
  readonly sectionAt = new Map<string, Map<string, string>>()
  readonly subjectDay = new Map<string, Map<number, number>>()

  add(c: Cell) {
    const p = pos(c.dayOfWeek, c.periodId)
    if (c.teacherId) {
      mapOf(this.teacherAt, c.teacherId).set(p, c.id)
      bump(mapOf(this.teacherDay, c.teacherId), c.dayOfWeek, 1)
      this.teacherWeek.set(
        c.teacherId,
        (this.teacherWeek.get(c.teacherId) ?? 0) + 1
      )
    }
    mapOf(this.roomAt, c.classroomId).set(p, c.id)
    if (c.sectionId) {
      mapOf(this.sectionAt, c.sectionId).set(p, c.id)
      if (c.subjectId) {
        bump(
          mapOf(this.subjectDay, `${c.sectionId}|${c.subjectId}`),
          c.dayOfWeek,
          1
        )
      }
    }
  }

  remove(c: Cell) {
    const p = pos(c.dayOfWeek, c.periodId)
    if (c.teacherId) {
      const at = this.teacherAt.get(c.teacherId)
      if (at?.get(p) === c.id) at.delete(p)
      bump(mapOf(this.teacherDay, c.teacherId), c.dayOfWeek, -1)
      this.teacherWeek.set(
        c.teacherId,
        (this.teacherWeek.get(c.teacherId) ?? 1) - 1
      )
    }
    const room = this.roomAt.get(c.classroomId)
    if (room?.get(p) === c.id) room.delete(p)
    if (c.sectionId) {
      const section = this.sectionAt.get(c.sectionId)
      if (section?.get(p) === c.id) section.delete(p)
      if (c.subjectId) {
        bump(
          mapOf(this.subjectDay, `${c.sectionId}|${c.subjectId}`),
          c.dayOfWeek,
          -1
        )
      }
    }
  }
}

function mapOf<K, V>(outer: Map<string, Map<K, V>>, key: string): Map<K, V> {
  let inner = outer.get(key)
  if (!inner) {
    inner = new Map()
    outer.set(key, inner)
  }
  return inner
}

function bump(m: Map<number, number>, key: number, by: number) {
  m.set(key, (m.get(key) ?? 0) + by)
}

export function planAssignment(
  state: PlanState,
  req: AssignmentRequest
): AssignmentPlan {
  const { teacherId: T, subjectId: S } = req
  const sectionRank = new Map(req.sectionIds.map((id, i) => [id, i]))
  const dayRank = new Map(state.workingDays.map((d, i) => [d, i]))
  const periodRank = new Map(state.periodOrder.map((p, i) => [p, i]))

  const cells = new Map<string, Cell>(state.slots.map((s) => [s.id, { ...s }]))
  const original = new Map(state.slots.map((s) => [s.id, s]))
  const occ = new Occupancy()
  for (const c of cells.values()) occ.add(c)

  const rulesOf = (teacher: string) =>
    state.rules.get(teacher) ?? state.defaultRules

  /** Can `teacher` take a lesson at (day, period) given current occupancy? */
  const fits = (teacher: string, day: number, periodId: string) => {
    const r = rulesOf(teacher)
    const p = pos(day, periodId)
    if (r.unavailable.has(p)) return false
    if (occ.teacherAt.get(teacher)?.has(p)) return false
    if ((occ.teacherDay.get(teacher)?.get(day) ?? 0) >= r.maxPerDay)
      return false
    if ((occ.teacherWeek.get(teacher) ?? 0) >= r.maxPerWeek) return false
    return true
  }
  const roomFree = (room: string, day: number, periodId: string) =>
    !occ.roomAt.get(room)?.has(pos(day, periodId))

  const isTarget = (c: Cell) =>
    c.subjectId === S && !!c.sectionId && sectionRank.has(c.sectionId)

  const order = (a: Cell, b: Cell) =>
    (sectionRank.get(a.sectionId!) ?? 0) -
      (sectionRank.get(b.sectionId!) ?? 0) ||
    (dayRank.get(a.dayOfWeek) ?? a.dayOfWeek) -
      (dayRank.get(b.dayOfWeek) ?? b.dayOfWeek) ||
    (periodRank.get(a.periodId) ?? 0) - (periodRank.get(b.periodId) ?? 0) ||
    a.id.localeCompare(b.id)

  const released: string[] = []
  const moved = new Set<string>()
  const moveOrder: string[] = []

  // Pass 0 — release the subject from any other teacher.
  for (const c of [...cells.values()].filter(isTarget).sort(order)) {
    if (c.teacherId && c.teacherId !== T) {
      released.push(c.id)
      occ.remove(c)
      c.teacherId = null
      occ.add(c)
    }
  }

  // Pass 1 — direct.
  const pending: Cell[] = []
  for (const c of [...cells.values()].filter(isTarget).sort(order)) {
    if (c.teacherId === T) continue
    if (fits(T, c.dayOfWeek, c.periodId)) {
      occ.remove(c)
      c.teacherId = T
      occ.add(c)
    } else {
      pending.push(c)
    }
  }

  // Pass 2 — repair inside the section.
  const residual: AssignmentPlan["residual"] = []
  for (const c of pending) {
    if (c.teacherId === T) continue // a previous repair already covered it
    if (c.fixed) {
      residual.push({ slotId: c.id, reason: "FIXED_SESSION" })
      continue
    }
    if ((occ.teacherWeek.get(T) ?? 0) >= rulesOf(T).maxPerWeek) {
      residual.push({ slotId: c.id, reason: "WEEKLY_CAP" })
      continue
    }

    const section = c.sectionId!
    const sameSubjectOn = (subject: string | null, day: number, n = 0) =>
      subject
        ? (occ.subjectDay.get(`${section}|${subject}`)?.get(day) ?? 0) > n
        : false
    const distance = (day: number, periodId: string) =>
      Math.abs(
        (periodRank.get(periodId) ?? 0) - (periodRank.get(c.periodId) ?? 0)
      ) *
        0.1 +
      Math.abs(
        (dayRank.get(day) ?? day) - (dayRank.get(c.dayOfWeek) ?? c.dayOfWeek)
      ) *
        0.01

    type Candidate =
      | {
          kind: "swap"
          with: Cell
          score: number
          day: number
          periodId: string
        }
      | { kind: "move"; score: number; day: number; periodId: string }
    let best: Candidate | null = null
    const consider = (cand: Candidate) => {
      if (
        !best ||
        cand.score < best.score ||
        (cand.score === best.score &&
          ((dayRank.get(cand.day) ?? 0) - (dayRank.get(best.day) ?? 0) ||
            (periodRank.get(cand.periodId) ?? 0) -
              (periodRank.get(best.periodId) ?? 0) ||
            (cand.kind === "swap" ? cand.with.id : "").localeCompare(
              best.kind === "swap" ? best.with.id : ""
            )) < 0)
      ) {
        best = cand
      }
    }

    // Swap candidates: another lesson of the same section.
    // Snapshot first: remove/add below re-insert into this same Map, and a
    // live Map iterator visits re-inserted entries again — forever.
    const others = [...(occ.sectionAt.get(section)?.values() ?? [])]
    for (const otherId of others) {
      const r = cells.get(otherId)!
      if (r.id === c.id || r.fixed || r.subjectId === S) continue
      occ.remove(c)
      occ.remove(r)
      const ok =
        fits(T, r.dayOfWeek, r.periodId) &&
        roomFree(c.classroomId, r.dayOfWeek, r.periodId) &&
        (!r.teacherId || fits(r.teacherId, c.dayOfWeek, c.periodId)) &&
        roomFree(r.classroomId, c.dayOfWeek, c.periodId)
      const score = ok
        ? (r.teacherId ? 2 : 0) +
          (sameSubjectOn(S, r.dayOfWeek) ? 3 : 0) +
          (sameSubjectOn(r.subjectId, c.dayOfWeek) ? 3 : 0) +
          (r.dayOfWeek !== c.dayOfWeek ? 1 : 0) +
          distance(r.dayOfWeek, r.periodId)
        : 0
      occ.add(c)
      occ.add(r)
      if (ok) {
        consider({
          kind: "swap",
          with: r,
          score,
          day: r.dayOfWeek,
          periodId: r.periodId,
        })
      }
    }

    // Move candidates: an empty period of the same section.
    const taken = occ.sectionAt.get(section)
    for (const day of state.workingDays) {
      for (const periodId of state.periodOrder) {
        if (taken?.has(pos(day, periodId))) continue
        occ.remove(c)
        const ok =
          fits(T, day, periodId) && roomFree(c.classroomId, day, periodId)
        const score = ok
          ? 1 +
            (sameSubjectOn(S, day) ? 3 : 0) +
            (day !== c.dayOfWeek ? 1 : 0) +
            distance(day, periodId)
          : 0
        occ.add(c)
        if (ok) consider({ kind: "move", score, day, periodId })
      }
    }

    const pick = best as Candidate | null
    if (!pick) {
      residual.push({ slotId: c.id, reason: "NO_SWAP" })
      continue
    }

    if (pick.kind === "swap") {
      const r = pick.with
      occ.remove(c)
      occ.remove(r)
      const lesson = {
        subjectId: r.subjectId,
        teacherId: r.teacherId,
        classroomId: r.classroomId,
      }
      r.subjectId = S
      r.teacherId = T
      r.classroomId = c.classroomId
      c.subjectId = lesson.subjectId
      c.teacherId = lesson.teacherId
      c.classroomId = lesson.classroomId
      occ.add(c)
      occ.add(r)
      moved.add(c.id)
      moved.add(r.id)
    } else {
      occ.remove(c)
      c.dayOfWeek = pick.day
      c.periodId = pick.periodId
      c.teacherId = T
      occ.add(c)
      moved.add(c.id)
      moveOrder.push(c.id)
    }
  }

  // Result: diff the working copy against the input.
  const patches: SlotPatch[] = []
  for (const c of cells.values()) {
    const o = original.get(c.id)!
    const patch: SlotPatch = { id: c.id }
    let changed = false
    if (c.dayOfWeek !== o.dayOfWeek) {
      patch.dayOfWeek = c.dayOfWeek
      changed = true
    }
    if (c.periodId !== o.periodId) {
      patch.periodId = c.periodId
      changed = true
    }
    if (c.subjectId !== o.subjectId) {
      patch.subjectId = c.subjectId
      changed = true
    }
    if (c.teacherId !== o.teacherId) {
      patch.teacherId = c.teacherId
      changed = true
    }
    if (c.classroomId !== o.classroomId) {
      patch.classroomId = c.classroomId
      changed = true
    }
    if (changed) patches.push(patch)
  }
  patches.sort((a, b) => a.id.localeCompare(b.id))

  const finalTargets = [...cells.values()].filter(isTarget).sort(order)
  return {
    patches,
    assigned: finalTargets.filter((c) => c.teacherId === T).map((c) => c.id),
    moved: [...moved].sort(),
    moveOrder,
    released,
    residual: residual.filter((r) => cells.get(r.slotId)?.teacherId !== T),
  }
}
