// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Pure helpers for the community block. Safe to import from server or client.
 */

/**
 * Parse a curriculum's `gradeRange` string ("1-12", "7-12") into the explicit
 * list of grade numbers it covers. Falls back to 1..12 if the range can't be
 * parsed — the dropdown should always offer something.
 */
export function gradesFromGradeRange(
  gradeRange: string | null | undefined
): number[] {
  if (!gradeRange) return defaultGrades()
  const match = gradeRange.match(/^(\d+)\s*-\s*(\d+)$/)
  if (!match) return defaultGrades()
  const start = Number(match[1])
  const end = Number(match[2])
  if (Number.isNaN(start) || Number.isNaN(end) || end < start)
    return defaultGrades()
  const out: number[] = []
  for (let g = start; g <= end; g++) out.push(g)
  return out
}

function defaultGrades(): number[] {
  return Array.from({ length: 12 }, (_, i) => i + 1)
}

/**
 * Format a duration in seconds to "Mm" or "Hh Mm" (e.g. 90 → "1m 30s",
 * 3720 → "1h 2m"). Used by video cards.
 */
export function formatVideoDuration(
  durationSeconds: number | null | undefined
): string {
  if (!durationSeconds || durationSeconds <= 0) return ""
  const totalMinutes = Math.floor(durationSeconds / 60)
  if (totalMinutes < 60) return `${totalMinutes}m`
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`
}

/**
 * Truncate text to a max length with an ellipsis, on a word boundary when
 * possible. Used by question cards where `questionText` is long-form prose.
 */
export function truncate(text: string, max = 160): string {
  if (text.length <= max) return text
  const slice = text.slice(0, max)
  const lastSpace = slice.lastIndexOf(" ")
  return `${lastSpace > 0 ? slice.slice(0, lastSpace) : slice}…`
}

/**
 * Build a `?curriculum=...&grade=...` query string from the current filter
 * snapshot. Empty values are omitted so the URL stays clean.
 */
export function buildFilterQuery(filters: {
  curriculum?: string
  grade?: number | null
}): string {
  const params = new URLSearchParams()
  if (filters.curriculum) params.set("curriculum", filters.curriculum)
  if (filters.grade) params.set("grade", String(filters.grade))
  const search = params.toString()
  return search ? `?${search}` : ""
}
