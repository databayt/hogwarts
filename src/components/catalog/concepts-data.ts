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

// ============================================================================
// Exact subject → concept maps (the precise overrides; fall back to
// nearestConcept). Unified here from engine/us/sd/concepts seeds. Tree/national
// seeds look up by directory slug; the US + Sudan seeds by display
// name. Keep these the single source — do not re-declare per seed.
// ============================================================================

/** Directory-slug → concept (uk/in/us folder names + Sudan dirs). */
export const SUBJECT_CONCEPT_BY_SLUG: Record<string, string> = {
  english: "english",
  "english-language": "english",
  "english-literature": "english",
  ela: "english",
  math: "math",
  mathematics: "math",
  "basic-math": "math",
  science: "science",
  biology: "biology",
  chemistry: "chemistry",
  physics: "physics",
  "environmental-science": "earth-science",
  "earth-science": "earth-science",
  "earth-environment": "earth-science",
  history: "history",
  geography: "geography",
  "social-studies": "civics",
  "uae-social-studies": "civics",
  "moral-education": "civics",
  civics: "civics",
  "military-science": "civics",
  "global-perspectives": "civics",
  economics: "economics",
  business: "economics",
  "business-studies": "economics",
  accounting: "economics",
  "commercial-studies": "economics",
  art: "arts",
  "art-design": "arts",
  arts: "arts",
  music: "arts",
  computing: "computer-science",
  "computer-science": "computer-science",
  ict: "computer-science",
  technology: "computer-science",
  "design-technology": "career-tech",
  "technical-education": "career-tech",
  engineering: "science",
  agriculture: "biology",
  "physical-education": "pe",
  pe: "pe",
  pshe: "life-skills",
  "life-skills": "life-skills",
  clothing: "life-skills",
  resources: "life-skills",
  "home-economics": "health",
  arabic: "languages",
  "arabic-literature": "languages",
  "arabic-rhetoric": "languages",
  "arabic-grammar": "languages",
  "arabic-specialized": "languages",
  french: "languages",
  spanish: "languages",
  languages: "languages",
  islamic: "religion",
  "islamic-studies": "religion",
  "islamic-education": "religion",
  quran: "religion",
  religion: "religion",
  psychology: "psychology",
  sociology: "sociology",
}

/** Display name → concept (US entries + Sudan Arabic names). */
export const SUBJECT_CONCEPT_BY_NAME: Record<string, string> = {
  // US
  Arts: "arts",
  "Business and Economics": "economics",
  "Career and Technical Education": "career-tech",
  "Careers and Technical Education": "career-tech",
  "Celebrations, Commemorations and Festivals": "celebrations",
  "Chemical Science": "chemistry",
  Chemistry: "chemistry",
  "Civics and Government": "civics",
  "Computer Science and Technology": "computer-science",
  "Earth and Space Science": "earth-science",
  Economics: "economics",
  "English Language Arts": "english",
  Geography: "geography",
  Health: "health",
  History: "history",
  "Life Science": "biology",
  "Life Sciences": "biology",
  "Life Skills": "life-skills",
  Math: "math",
  "Physical Education": "pe",
  "Physical Science": "science",
  Physics: "physics",
  Psychology: "psychology",
  Religion: "religion",
  "Religion and Ethics": "religion",
  "Religion and Philosophy": "religion",
  "Science and Engineering Practices": "science",
  Sociology: "sociology",
  "Teacher Professional Development": "teacher-pd",
  "U.S. History": "history",
  "World History": "history",
  "World Languages": "languages",
  // Sudan (Arabic names)
  "اللغة العربية": "languages",
  الرياضيات: "math",
  "التربية الإسلامية": "religion",
  "اللغة الإنجليزية": "english",
  العلوم: "science",
  التاريخ: "history",
  الجغرافيا: "geography",
  الفنية: "arts",
  "علوم الحاسوب": "computer-science",
  الفيزياء: "physics",
  الكيمياء: "chemistry",
  الأحياء: "biology",
  "الدراسات الإسلامية": "religion",
  "القرآن وعلومه": "religion",
  "اللغة الفرنسية": "languages",
  "البلاغة والتعبير": "languages",
  "قواعد النحو": "languages",
  "الأدب والمطالعة": "languages",
  "اللغة العربية الخاصة": "languages",
  "العلوم العسكرية": "civics",
  "العلوم الهندسية": "science",
  "العلوم التجارية": "economics",
  "العلوم الأسرية": "health",
  "الإنتاج الزراعي والحيواني": "biology",
  "الرياضيات الأساسية": "math",
  "الفنون والتصميم": "arts",
  "تكنولوجيا الاتصالات": "computer-science",
  "أساسيات التربية التقنية": "career-tech",
}

/** Subject concept → 5-concept rotation pool (chapter thumbnail variety). */
export const CONCEPT_POOL: Record<string, string[]> = {
  languages: ["languages", "english", "arts", "history", "geography"],
  math: ["math", "science", "computer-science", "physics", "economics"],
  english: ["english", "languages", "arts", "history", "sociology"],
  religion: ["religion", "history", "languages", "life-skills", "psychology"],
  science: ["science", "biology", "chemistry", "physics", "earth-science"],
  history: ["history", "geography", "civics", "sociology", "economics"],
  geography: ["geography", "earth-science", "science", "history", "biology"],
  arts: ["arts", "life-skills", "celebrations", "languages", "psychology"],
  "computer-science": [
    "computer-science",
    "math",
    "science",
    "career-tech",
    "economics",
  ],
  physics: ["physics", "math", "science", "computer-science", "earth-science"],
  chemistry: ["chemistry", "science", "biology", "physics", "health"],
  biology: ["biology", "science", "health", "chemistry", "earth-science"],
  health: ["health", "life-skills", "biology", "science", "economics"],
  civics: ["civics", "history", "pe", "life-skills", "geography"],
  economics: [
    "economics",
    "math",
    "computer-science",
    "career-tech",
    "sociology",
  ],
  "career-tech": [
    "career-tech",
    "computer-science",
    "science",
    "math",
    "economics",
  ],
  "earth-science": [
    "earth-science",
    "science",
    "biology",
    "geography",
    "chemistry",
  ],
  "life-skills": ["life-skills", "health", "arts", "economics", "sociology"],
  celebrations: ["celebrations", "arts", "history", "sociology", "languages"],
  pe: ["pe", "health", "life-skills", "science", "psychology"],
  psychology: ["psychology", "sociology", "health", "life-skills", "science"],
  sociology: ["sociology", "psychology", "history", "economics", "civics"],
  "teacher-pd": [
    "teacher-pd",
    "life-skills",
    "psychology",
    "sociology",
    "career-tech",
  ],
}
