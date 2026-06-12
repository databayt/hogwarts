// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Per-curriculum academic-structure config for school provisioning.
 *
 * `setup.ts` used to hardcode the Sudanese model (Arabic 6+3+3 levels, Arabic
 * grade names, forced Science/Arts streams) for EVERY school. Provisioning now
 * resolves the school's curriculum code (see `inferCurriculum`) to one of
 * these configs. The SD entry preserves the original constants byte-for-byte —
 * Sudanese schools provision exactly as before.
 *
 * Grade slugs are NOT configurable: they stay `grade-${n}` everywhere because
 * the YearLevel mapping in setup.ts matches on that slug shape.
 */

export interface AcademicLevelDef {
  name: string
  slug: string
  level: "ELEMENTARY" | "MIDDLE" | "HIGH"
  levelOrder: number
  startGrade: number
  endGrade: number
}

export interface AcademicStreamDef {
  name: string
  slug: string
  streamType: "SCIENCE" | "ARTS"
}

/**
 * Subject-name fragments that pin a subject to one stream in streamed
 * grades. Curriculum-owned: only configs that define streams carry
 * patterns, so the keyword matching never leaks into stream-less systems.
 */
export interface StreamSubjectPatterns {
  science: string[]
  arts: string[]
  /** Fragments that must never match (e.g. "physical education" vs "physics"). */
  exclude: string[]
}

export interface CurriculumAcademicConfig {
  levels: AcademicLevelDef[]
  gradeName: (grade: number) => string
  streams: AcademicStreamDef[]
  /** First grade that gets streams. 99 (never) when `streams` is empty. */
  streamStartGrade: number
  /** null when the curriculum provisions no streams. */
  streamSubjectPatterns: StreamSubjectPatterns | null
}

// ---------------------------------------------------------------------------
// Building blocks
// ---------------------------------------------------------------------------

const ARABIC_GRADE_NAMES: Record<number, string> = {
  1: "الصف الأول",
  2: "الصف الثاني",
  3: "الصف الثالث",
  4: "الصف الرابع",
  5: "الصف الخامس",
  6: "الصف السادس",
  7: "الصف السابع",
  8: "الصف الثامن",
  9: "الصف التاسع",
  10: "الصف العاشر",
  11: "الصف الحادي عشر",
  12: "الصف الثاني عشر",
}

/** Sudanese (and common Arab-national) 6+3+3 structure — the original model. */
const ARABIC_6_3_3: CurriculumAcademicConfig = {
  levels: [
    {
      name: "المرحلة الابتدائية",
      slug: "elementary",
      level: "ELEMENTARY",
      levelOrder: 1,
      startGrade: 1,
      endGrade: 6,
    },
    {
      name: "المرحلة المتوسطة",
      slug: "middle",
      level: "MIDDLE",
      levelOrder: 2,
      startGrade: 7,
      endGrade: 9,
    },
    {
      name: "المرحلة الثانوية",
      slug: "high",
      level: "HIGH",
      levelOrder: 3,
      startGrade: 10,
      endGrade: 12,
    },
  ],
  gradeName: (grade) => ARABIC_GRADE_NAMES[grade] ?? `الصف ${grade}`,
  streams: [
    { name: "العلمي", slug: "science", streamType: "SCIENCE" },
    { name: "الأدبي", slug: "arts", streamType: "ARTS" },
  ],
  streamStartGrade: 10,
  // Moved verbatim from setup.ts (was applied globally; now SD-family only).
  streamSubjectPatterns: {
    science: [
      "physics",
      "chemistry",
      "biology",
      "calculus",
      "فيزياء",
      "كيمياء",
      "أحياء",
    ],
    arts: [
      "philosophy",
      "فلسفة",
      "أدب",
      "بلاغة",
      "مطالعة",
      "نحو",
      "عربية خاصة",
      "رياضيات أساسية",
    ],
    exclude: ["physical education", "تربية بدنية"],
  },
}

/** US K-12: 5+3+4, English names, no provisioned streams. */
const US_5_3_4: CurriculumAcademicConfig = {
  levels: [
    {
      name: "Elementary School",
      slug: "elementary",
      level: "ELEMENTARY",
      levelOrder: 1,
      startGrade: 1,
      endGrade: 5,
    },
    {
      name: "Middle School",
      slug: "middle",
      level: "MIDDLE",
      levelOrder: 2,
      startGrade: 6,
      endGrade: 8,
    },
    {
      name: "High School",
      slug: "high",
      level: "HIGH",
      levelOrder: 3,
      startGrade: 9,
      endGrade: 12,
    },
  ],
  gradeName: (grade) => `Grade ${grade}`,
  streams: [],
  streamStartGrade: 99,
  streamSubjectPatterns: null,
}

/** England-style key stages mapped onto the 3-level platform model. */
const GB_KEY_STAGES: CurriculumAcademicConfig = {
  levels: [
    {
      name: "Primary School (KS1–KS2)",
      slug: "elementary",
      level: "ELEMENTARY",
      levelOrder: 1,
      startGrade: 1,
      endGrade: 6,
    },
    {
      name: "Secondary School (KS3)",
      slug: "middle",
      level: "MIDDLE",
      levelOrder: 2,
      startGrade: 7,
      endGrade: 9,
    },
    {
      name: "Secondary School (KS4–Sixth Form)",
      slug: "high",
      level: "HIGH",
      levelOrder: 3,
      startGrade: 10,
      endGrade: 12,
    },
  ],
  gradeName: (grade) => `Year ${grade}`,
  streams: [],
  streamStartGrade: 99,
  streamSubjectPatterns: null,
}

/** Indian CBSE: primary 1-5, middle 6-8, secondary+senior 9-12. */
const CBSE_CLASSES: CurriculumAcademicConfig = {
  levels: [
    {
      name: "Primary School",
      slug: "elementary",
      level: "ELEMENTARY",
      levelOrder: 1,
      startGrade: 1,
      endGrade: 5,
    },
    {
      name: "Middle School",
      slug: "middle",
      level: "MIDDLE",
      levelOrder: 2,
      startGrade: 6,
      endGrade: 8,
    },
    {
      name: "Secondary & Senior Secondary",
      slug: "high",
      level: "HIGH",
      levelOrder: 3,
      startGrade: 9,
      endGrade: 12,
    },
  ],
  gradeName: (grade) => `Class ${grade}`,
  streams: [],
  streamStartGrade: 99,
  streamSubjectPatterns: null,
}

/** Neutral English fallback for unknown curricula: 6+3+3, no streams. */
const GENERIC_FALLBACK: CurriculumAcademicConfig = {
  levels: [
    {
      name: "Elementary School",
      slug: "elementary",
      level: "ELEMENTARY",
      levelOrder: 1,
      startGrade: 1,
      endGrade: 6,
    },
    {
      name: "Middle School",
      slug: "middle",
      level: "MIDDLE",
      levelOrder: 2,
      startGrade: 7,
      endGrade: 9,
    },
    {
      name: "High School",
      slug: "high",
      level: "HIGH",
      levelOrder: 3,
      startGrade: 10,
      endGrade: 12,
    },
  ],
  gradeName: (grade) => `Grade ${grade}`,
  streams: [],
  streamStartGrade: 99,
  streamSubjectPatterns: null,
}

// ---------------------------------------------------------------------------
// Registry — keyed by canonical curriculum code (see catalog registry.ts)
// ---------------------------------------------------------------------------

export const CURRICULUM_ACADEMIC_CONFIG: Record<
  string,
  CurriculumAcademicConfig
> = {
  SD: ARABIC_6_3_3,
  // Arab national systems share the 6+3+3 Arabic structure with streams.
  SA: ARABIC_6_3_3,
  EG: ARABIC_6_3_3,
  AE: ARABIC_6_3_3,
  QA: ARABIC_6_3_3,
  KW: ARABIC_6_3_3,
  JO: ARABIC_6_3_3,
  US: US_5_3_4,
  GB: GB_KEY_STAGES,
  CBSE: CBSE_CLASSES,
  // Transnational programmes provision US-style English structure.
  "CAIE-IGCSE": US_5_3_4,
  "IB-DP": US_5_3_4,
}

export function getAcademicConfig(
  curriculum: string | null | undefined
): CurriculumAcademicConfig {
  if (!curriculum) return GENERIC_FALLBACK
  return CURRICULUM_ACADEMIC_CONFIG[curriculum] ?? GENERIC_FALLBACK
}

/**
 * Resolve which stream (if any) a subject belongs to under this curriculum.
 * Returns null for shared subjects and for curricula without streams.
 */
export function getStreamTypeForSubject(
  cfg: CurriculumAcademicConfig,
  subjectName: string
): "SCIENCE" | "ARTS" | null {
  const patterns = cfg.streamSubjectPatterns
  if (!patterns || cfg.streams.length === 0) return null
  const lower = subjectName.toLowerCase()
  if (patterns.exclude.some((p) => lower.includes(p))) return null
  if (patterns.science.some((p) => lower.includes(p))) return "SCIENCE"
  if (patterns.arts.some((p) => lower.includes(p))) return "ARTS"
  return null
}

/** Grade numbers covered by a SchoolLevel under this config (was hardcoded). */
export function gradesForLevel(
  cfg: CurriculumAcademicConfig,
  level: string
): number[] {
  const def = cfg.levels.find((l) => l.level === level)
  if (!def) return []
  const grades: number[] = []
  for (let g = def.startGrade; g <= def.endGrade; g++) grades.push(g)
  return grades
}
