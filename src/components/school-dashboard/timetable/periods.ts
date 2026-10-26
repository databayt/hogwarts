/**
 * Per-grade bells.
 *
 * A Period with `gradeId` null rings for the whole school (every school before
 * 2026-10-26); one with a `gradeId` rings for that grade only. A grade's grid is
 * its own periods plus the school-wide ones. A grid spanning several grades —
 * a teacher's week, a room shared by two grades — collapses periods that ring
 * at the same time into one row, so «12:00» for G1 and «12:00» for G3 read as
 * one line rather than two.
 */
import type { Prisma } from "@prisma/client"

/** The period columns every grid read selects. */
export const PERIOD_GRID_SELECT = {
  id: true,
  name: true,
  startTime: true,
  endTime: true,
  isBreak: true,
  untimed: true,
  gradeId: true,
} satisfies Prisma.PeriodSelect

/** Periods a grade sees: its own + the school-wide ones. No grade → all. */
export function periodScope(gradeId?: string | null): Prisma.PeriodWhereInput {
  return gradeId ? { OR: [{ gradeId: null }, { gradeId }] } : {}
}

/** Periods any of these grades see. An empty list means "no grade context" → all. */
export function periodScopeForGrades(
  gradeIds: Array<string | null | undefined>
): Prisma.PeriodWhereInput {
  const ids = [...new Set(gradeIds.filter((g): g is string => !!g))]
  return ids.length > 0
    ? { OR: [{ gradeId: null }, { gradeId: { in: ids } }] }
    : {}
}

interface MergeablePeriod {
  id: string
  name: string
  startTime: Date
  endTime: Date
  untimed?: boolean
}

/** Same row = same clock span; an untimed period only merges by name. */
function rowKey(p: MergeablePeriod): string {
  return p.untimed
    ? `n:${p.name}`
    : `t:${p.startTime.getTime()}-${p.endTime.getTime()}`
}

/**
 * Collapse periods that ring at the same time into one grid row (the first in
 * start order keeps its id and name). `rowOf` maps every input period id to
 * the id of its row, for re-pointing slots at the merged rows.
 */
export function mergePeriodRows<P extends MergeablePeriod>(
  periods: P[]
): { rows: P[]; rowOf: Map<string, string> } {
  const sorted = [...periods].sort(
    (a, b) => a.startTime.getTime() - b.startTime.getTime()
  )
  const rows: P[] = []
  const byKey = new Map<string, P>()
  const rowOf = new Map<string, string>()
  for (const p of sorted) {
    const key = rowKey(p)
    const row = byKey.get(key)
    if (row) {
      rowOf.set(p.id, row.id)
      continue
    }
    byKey.set(key, p)
    rows.push(p)
    rowOf.set(p.id, p.id)
  }
  return { rows, rowOf }
}
