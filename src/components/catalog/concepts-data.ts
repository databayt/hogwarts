// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Concepts — the single source of truth for the 23 shared, curriculum-agnostic
 * visual concepts. Holds the canonical colors and the **nearest-concept**
 * resolver: a keyword heuristic (EN + AR) that maps ANY subject to the closest
 * of the 23 so no subject is ever image-less. Seeds fall back to it instead of
 * writing `null` (which would leave a subject with only a flat color).
 *
 * Origins of the concept artwork are credited in /docs/catalog#origins.
 */

export const CONCEPTS = [
  "arts",
  "biology",
  "career-tech",
  "celebrations",
  "chemistry",
  "civics",
  "computer-science",
  "earth-science",
  "economics",
  "english",
  "geography",
  "health",
  "history",
  "languages",
  "life-skills",
  "math",
  "pe",
  "physics",
  "psychology",
  "religion",
  "science",
  "sociology",
  "teacher-pd",
] as const

export type Concept = (typeof CONCEPTS)[number]

/** Canonical per-concept color (the flat-background last resort in the UI). */
export const CONCEPT_COLORS: Record<string, string> = {
  math: "#4A90D9",
  science: "#2ECC71",
  english: "#E74C3C",
  history: "#D4A574",
  geography: "#1ABC9C",
  religion: "#F39C12",
  biology: "#27AE60",
  chemistry: "#3498DB",
  physics: "#9B59B6",
  "computer-science": "#34495E",
  arts: "#E91E63",
  health: "#00BCD4",
  economics: "#FF9800",
  civics: "#795548",
  "career-tech": "#607D8B",
  "life-skills": "#FF5722",
  "earth-science": "#4CAF50",
  languages: "#673AB7",
  pe: "#F44336",
  psychology: "#9C27B0",
  sociology: "#3F51B5",
  "teacher-pd": "#009688",
  celebrations: "#FFEB3B",
}

export function colorFor(concept: string | null | undefined): string {
  return (concept && CONCEPT_COLORS[concept]) || "#6366F1"
}

// Ordered keyword → concept rules (EN + AR). First match wins; specific before
// general (e.g. biology before science, languages catches Arabic/literature).
// Specific discriminators come BEFORE the generic `science` rule, so an Arabic
// compound like "العلوم الأسرية" (family sciences) resolves on its specific word
// (أسرية → health) rather than on "علوم" (→ science). Same for العسكرية/التجارية.
const NEAREST_RULES: Array<[RegExp, Concept]> = [
  [/math|رياضيات|حساب|جبر|إحصاء/i, "math"],
  [/physics|فيزياء/i, "physics"],
  [/chem|كيمياء/i, "chemistry"],
  [/bio|أحياء|حياة|زراع|agri/i, "biology"],
  [/earth|geolog|جيولوج|بيئة|environment/i, "earth-science"],
  [/comput|ict|programming|حاسوب|حاسب|برمج/i, "computer-science"],
  [
    /civic|citizen|وطنية|مدنية|military|عسكري|دستور|constitution|moral|أخلاق|social stud|اجتماعيات|global persp/i,
    "civics",
  ],
  [/relig|islam|إسلام|دين|قرآن|quran|fiqh|فقه|توحيد|tawhid/i, "religion"],
  [/health|صحة|أسرية|family|home econ|منزل/i, "health"],
  [/econ|اقتصاد|commerce|تجار|business|مال|financ/i, "economics"],
  // generic science last among the "علوم …" discriminators
  [/science|علوم|engineer|هندس/i, "science"],
  [/english|إنجليزي|انجليزي/i, "english"],
  [
    /arab|عرب|قواعد|نحو|بلاغة|أدب|لغة|french|فرنسي|language|literature|grammar|rhetoric/i,
    "languages",
  ],
  [/history|تاريخ/i, "history"],
  [/geograph|جغراف/i, "geography"],
  [/\bart|فن|design|تصميم|music|موسيق|drama|مسرح/i, "arts"],
  [/\bpe\b|physical ed|بدنية|sport|رياضة/i, "pe"],
  [/psych|نفس/i, "psychology"],
  [/sociolog|اجتماع/i, "sociology"],
  [/career|مهني|vocation|تقني|technical/i, "career-tech"],
  [/life.?skill|مهارات|حياتية|critical.?think|تفكير/i, "life-skills"],
]

/**
 * Map any subject text (slug or name, EN or AR) to the closest of the 23
 * concepts. **Never returns null** — defaults to `languages` (every catalog has
 * language subjects, and a generic shared image beats a flat color).
 */
export function nearestConcept(text: string | null | undefined): Concept {
  if (!text) return "languages"
  const t = text.replace(/[-_]/g, " ")
  for (const [re, concept] of NEAREST_RULES) if (re.test(t)) return concept
  return "languages"
}
