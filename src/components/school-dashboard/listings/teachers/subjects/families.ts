// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * A teacher's specialty is a subject FAMILY: every grade's subject of the
 * same name (catalog subjects are per grade — sd-g4-math, sd-g5-math). The
 * Subjects & sections editor stores one expertise row per grade's subject, so
 * anything that shows or counts specialties folds the rows by name.
 */
export function specialtyFamilies<
  T extends { subjectId?: string; subject?: { name?: string | null } | null },
>(rows: readonly T[] | null | undefined): T[] {
  const seen = new Set<string>()
  const out: T[] = []
  for (const row of rows ?? []) {
    const family = row.subject?.name?.trim() || row.subjectId || ""
    if (seen.has(family)) continue
    seen.add(family)
    out.push(row)
  }
  return out
}
