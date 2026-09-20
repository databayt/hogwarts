// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * ClickView CDN key derivation — the coupling between a curriculum entity and its
 * art on cdn.databayt.org under the flat `clickview/` namespace.
 *
 * Key scheme (staged by databayt/codebase scripts/cdn/stage-clickview.ts):
 *   concept art   clickview/{level}-{concept}-thumbnail.jpg   (subjects, chapters)
 *                 clickview/{level}-{concept}-banner.jpg      (subjects)
 *   lesson cover  clickview/{level}-{topicSlug}-cover.jpg     (lessons, per-topic)
 *
 * Keys are SINGLE files with an extension (not `-size.webp` prefixes); the resolver
 * (`image-url.ts`) serves them as-is.
 */

export type Level = "elementary" | "middle" | "high"

/** Grade → ClickView level bucket (matches the archive's elementary/middle/high split). */
export function gradeToLevel(grade: number): Level {
  if (grade <= 5) return "elementary"
  if (grade <= 8) return "middle"
  return "high"
}

/**
 * hogwarts concept slug → ClickView archive concept slug (BASE / canonical name).
 * hogwarts uses 23 short concepts; the archive uses longer concept names. This is
 * the default; per-level reality differs (see ARCHIVE_BY_LEVEL) because the
 * scraped archive named the same concept differently across levels and skipped
 * some entirely.
 */
export const CONCEPT_TO_ARCHIVE: Record<string, string> = {
  art: "arts",
  life: "life-science",
  career: "career-and-technical-education",
  celebration: "celebrations-commemorations-and-festivals",
  chemistry: "chemistry",
  civic: "civics-and-government",
  computer: "computer-science-and-technology",
  earth: "earth-and-space-science",
  economy: "economics",
  english: "english-language-arts",
  geography: "geography",
  health: "health",
  history: "history",
  language: "world-languages",
  skills: "life-skills",
  math: "math",
  nature: "life-science",
  sport: "physical-education",
  physics: "physics",
  mind: "psychology",
  faith: "religion",
  science: "science-and-engineering-practices",
  society: "sociology",
  teaching: "teacher-professional-development",
}

/**
 * Per-level overrides where the staged archive name differs from the canonical
 * one, OR the concept has no art at that level and falls back to the nearest one
 * that DOES exist. Every entry was verified against the live
 * cdn.databayt.org/clickview inventory so no key 404s. (Fallbacks are marked.)
 */
const ARCHIVE_BY_LEVEL: Record<Level, Record<string, string>> = {
  elementary: {
    career: "life-skills", // fallback — no CTE art at elementary
    chemistry: "physical-science", // fallback — no chemistry art at elementary
    physics: "physical-science", // fallback
    mind: "health", // fallback
    science: "physical-science", // fallback
    society: "civics-and-government", // fallback
  },
  middle: {
    career: "careers-and-technical-education",
    chemistry: "chemical-science",
    celebration: "arts", // fallback — no celebrations art at middle
    history: "world-history",
    physics: "physical-science", // fallback
    mind: "health", // fallback
    faith: "religion-and-ethics",
    society: "civics-and-government", // fallback
  },
  high: {
    life: "life-sciences",
    nature: "life-sciences", // the high archive pluralises it
    economy: "business-and-economics",
    celebration: "arts", // fallback — no celebrations art at high
    history: "world-history",
    faith: "religion-and-philosophy",
  },
}

/** Resolve the archive concept name that actually exists for (level, concept). */
function conceptArchive(level: Level, concept: string): string {
  return (
    ARCHIVE_BY_LEVEL[level][concept] ?? CONCEPT_TO_ARCHIVE[concept] ?? concept
  )
}

const EXT = "jpg" // staged single-file format

/** Concept art key for a subject/chapter. Null when concept is missing. */
export function clickviewConceptKey(
  level: Level,
  concept: string | null | undefined,
  kind: "thumbnail" | "banner" = "thumbnail"
): string | null {
  if (!concept) return null
  const archive = conceptArchive(level, concept)
  return `clickview/${level}-${archive}-${kind}.${EXT}`
}

/** Per-topic lesson cover key. Null when the topic slug is missing. */
export function clickviewCoverKey(
  level: Level,
  topicSlug: string | null | undefined
): string | null {
  if (!topicSlug) return null
  return `clickview/${level}-${topicSlug}-cover.${EXT}`
}

/**
 * Translate a LEGACY concept key into its flat `clickview/` equivalent.
 *
 * The legacy pipeline stored grade+concept inside the key itself
 * (`catalog/concepts/g{grade}-{concept}/{thumbnail|banner}`), so we can map it to
 * the staged clickview art with no DB rewrite — every curriculum already in the
 * DB resolves to cdn.databayt.org/clickview/... at render time. Returns null for
 * anything that isn't a legacy concept key (already-clickview keys, owned
 * uploads, etc.), so the resolver leaves those untouched.
 */
const LEGACY_CONCEPT_RE = /^catalog\/concepts\/g(\d+)-(.+)\/(thumbnail|banner)$/

export function legacyConceptToClickview(
  key: string | null | undefined
): string | null {
  if (!key) return null
  const m = LEGACY_CONCEPT_RE.exec(key)
  if (!m) return null
  const grade = Number(m[1])
  if (!Number.isFinite(grade)) return null
  const concept = m[2]
  const kind = m[3] as "thumbnail" | "banner"
  return clickviewConceptKey(gradeToLevel(grade), concept, kind)
}
