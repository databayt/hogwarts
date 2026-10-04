// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Suggests teachers for subjects still waiting for one, from what each
 * teacher is qualified to teach (TeacherSubjectExpertise). Pure.
 *
 * A subject in a grade goes to ONE teacher for all of the grade's waiting
 * sections when someone qualified has room for all of them (how most schools
 * staff); otherwise section by section to whoever has the most room. Never
 * past a teacher's weekly cap. Most constrained subjects (fewest qualified
 * teachers, most periods) pick first; ties break on ids, so the same input
 * always gives the same suggestions.
 */

export interface WaitingPair {
  sectionId: string
  gradeId: string
  subjectId: string
  /** Weekly periods this pair will cost the teacher. */
  periods: number
}

export interface CandidateTeacher {
  teacherId: string
  subjectIds: readonly string[]
  load: number
  cap: number
}

export interface Suggestion {
  teacherId: string
  subjectId: string
  sectionIds: string[]
}

export function suggestAssignments(
  pairs: readonly WaitingPair[],
  teachers: readonly CandidateTeacher[]
): Suggestion[] {
  const load = new Map(teachers.map((t) => [t.teacherId, t.load]))
  const qualifiedFor = (subjectId: string) =>
    teachers.filter((t) => t.subjectIds.includes(subjectId))

  // (grade, subject) → its waiting sections, in a stable order.
  const groups = new Map<string, WaitingPair[]>()
  for (const p of [...pairs].sort((a, b) =>
    a.sectionId.localeCompare(b.sectionId)
  )) {
    const key = `${p.gradeId}|${p.subjectId}`
    groups.set(key, [...(groups.get(key) ?? []), p])
  }
  const ordered = [...groups.entries()].sort(([ka, a], [kb, b]) => {
    const qa = qualifiedFor(a[0].subjectId).length
    const qb = qualifiedFor(b[0].subjectId).length
    const pa = a.reduce((n, p) => n + p.periods, 0)
    const pb = b.reduce((n, p) => n + p.periods, 0)
    return qa - qb || pb - pa || ka.localeCompare(kb)
  })

  const out = new Map<string, Suggestion>()
  const give = (teacherId: string, pair: WaitingPair) => {
    const key = `${teacherId}|${pair.subjectId}`
    const s = out.get(key) ?? {
      teacherId,
      subjectId: pair.subjectId,
      sectionIds: [],
    }
    s.sectionIds.push(pair.sectionId)
    out.set(key, s)
    load.set(teacherId, (load.get(teacherId) ?? 0) + pair.periods)
  }
  const byRoom = (candidates: CandidateTeacher[]) =>
    [...candidates].sort(
      (a, b) =>
        (load.get(a.teacherId) ?? 0) - (load.get(b.teacherId) ?? 0) ||
        a.teacherId.localeCompare(b.teacherId)
    )

  for (const [, group] of ordered) {
    const candidates = qualifiedFor(group[0].subjectId)
    if (candidates.length === 0) continue
    const total = group.reduce((n, p) => n + p.periods, 0)

    const whole = byRoom(candidates).find(
      (t) => (load.get(t.teacherId) ?? 0) + total <= t.cap
    )
    if (whole) {
      for (const pair of group) give(whole.teacherId, pair)
      continue
    }
    for (const pair of group) {
      const fit = byRoom(candidates).find(
        (t) => (load.get(t.teacherId) ?? 0) + pair.periods <= t.cap
      )
      if (fit) give(fit.teacherId, pair)
    }
  }

  return [...out.values()].sort(
    (a, b) =>
      a.subjectId.localeCompare(b.subjectId) ||
      a.teacherId.localeCompare(b.teacherId)
  )
}
