// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * What each teacher teaches this term, for the teachers list: subject names
 * (one per family — "Math" once, not per grade) and how many sections.
 * Plain server module; callers pass rows already scoped by schoolId and term.
 */
import { getLabels } from "@/components/translation/person"
import type { Lang } from "@/components/translation/types"

export interface TaughtRow {
  id: string
  subjectTeachers?: Array<{
    sectionId: string
    subject: { name: string } | null
  }>
}

export interface Taught {
  /** Display names, most-taught (by sections) first. */
  subjects: string[]
  sectionCount: number
}

export async function getTaughtSubjects(
  rows: readonly TaughtRow[],
  lang: Lang,
  schoolId: string
): Promise<Map<string, Taught>> {
  const labels = await getLabels(
    rows.flatMap((r) =>
      (r.subjectTeachers ?? []).map((a) => a.subject?.name ?? "")
    ),
    lang,
    schoolId
  )
  const out = new Map<string, Taught>()
  for (const r of rows) {
    const sectionsBySubject = new Map<string, Set<string>>()
    const sections = new Set<string>()
    for (const a of r.subjectTeachers ?? []) {
      const raw = a.subject?.name?.trim()
      if (!raw) continue
      const name = labels.get(raw) ?? raw
      sections.add(a.sectionId)
      const set = sectionsBySubject.get(name) ?? new Set<string>()
      set.add(a.sectionId)
      sectionsBySubject.set(name, set)
    }
    out.set(r.id, {
      subjects: [...sectionsBySubject.entries()]
        .sort((a, b) => b[1].size - a[1].size || a[0].localeCompare(b[0]))
        .map(([name]) => name),
      sectionCount: sections.size,
    })
  }
  return out
}
