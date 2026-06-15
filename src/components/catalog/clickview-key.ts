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
 * hogwarts concept slug → ClickView archive concept slug. hogwarts uses 23 short
 * concepts; the archive uses longer, level-tagged concept folders. Most are
 * mechanical; two are judgment calls (FLAGGED) — adjust if a better archive match
 * exists:
 *   - biology → life-science       (biology is the life-science illustration)
 *   - science → science-and-engineering-practices  (generic science)
 */
export const CONCEPT_TO_ARCHIVE: Record<string, string> = {
  arts: "arts",
  biology: "life-science", // FLAGGED
  "career-tech": "career-and-technical-education",
  celebrations: "celebrations-commemorations-and-festivals",
  chemistry: "chemistry",
  civics: "civics-and-government",
  "computer-science": "computer-science-and-technology",
  "earth-science": "earth-and-space-science",
  economics: "economics",
  english: "english-language-arts",
  geography: "geography",
  health: "health",
  history: "history",
  languages: "world-languages",
  "life-skills": "life-skills",
  math: "math",
  pe: "physical-education",
  physics: "physics",
  psychology: "psychology",
  religion: "religion",
  science: "science-and-engineering-practices", // FLAGGED
  sociology: "sociology",
  "teacher-pd": "teacher-professional-development",
}

const EXT = "jpg" // staged single-file format

/** Concept art key for a subject/chapter. Null when concept is missing. */
export function clickviewConceptKey(
  level: Level,
  concept: string | null | undefined,
  kind: "thumbnail" | "banner" = "thumbnail"
): string | null {
  if (!concept) return null
  const archive = CONCEPT_TO_ARCHIVE[concept] ?? concept
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
