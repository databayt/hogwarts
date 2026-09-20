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
  "art",
  "life",
  "career",
  "celebration",
  "chemistry",
  "civic",
  "computer",
  "earth",
  "economy",
  "english",
  "geography",
  "health",
  "history",
  "language",
  "skills",
  "math",
  "nature",
  "sport",
  "physics",
  "mind",
  "faith",
  "science",
  "society",
  "teaching",
] as const

export type Concept = (typeof CONCEPTS)[number]

/** Canonical per-concept color (the flat-background last resort in the UI). */
export const CONCEPT_COLORS: Record<string, string> = {
  math: "#4A90D9",
  nature: "#7CB342",
  science: "#2ECC71",
  english: "#E74C3C",
  history: "#D4A574",
  geography: "#1ABC9C",
  faith: "#F39C12",
  life: "#27AE60",
  chemistry: "#3498DB",
  physics: "#9B59B6",
  computer: "#34495E",
  art: "#E91E63",
  health: "#00BCD4",
  economy: "#FF9800",
  civic: "#795548",
  career: "#607D8B",
  skills: "#FF5722",
  earth: "#4CAF50",
  language: "#673AB7",
  sport: "#F44336",
  mind: "#9C27B0",
  society: "#3F51B5",
  teaching: "#009688",
  celebration: "#FFEB3B",
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
  [/bio|أحياء|حياة|زراع|agri/i, "life"],
  [/earth|geolog|جيولوج|بيئة|environment/i, "earth"],
  [/nature|طبيعة|ecolog|biodivers|تنوع حيوي/i, "nature"],
  [/comput|ict|programming|حاسوب|حاسب|برمج/i, "computer"],
  [
    /civic|citizen|وطنية|مدنية|military|عسكري|دستور|constitution|moral|أخلاق|social stud|اجتماعيات|global persp/i,
    "civic",
  ],
  [/relig|islam|إسلام|دين|قرآن|quran|fiqh|فقه|توحيد|tawhid/i, "faith"],
  [/health|صحة|أسرية|family|home econ|منزل/i, "health"],
  [/econ|اقتصاد|commerce|تجار|business|مال|financ/i, "economy"],
  // generic science last among the "علوم …" discriminators
  [/science|علوم|engineer|هندس/i, "science"],
  [/english|إنجليزي|انجليزي/i, "english"],
  [
    /arab|عرب|قواعد|نحو|بلاغة|أدب|لغة|french|فرنسي|language|literature|grammar|rhetoric/i,
    "language",
  ],
  [/history|تاريخ/i, "history"],
  [/geograph|جغراف/i, "geography"],
  [/\bart|فن|design|تصميم|music|موسيق|drama|مسرح/i, "art"],
  [/\bpe\b|physical ed|بدنية|sport|رياضة/i, "sport"],
  [/psych|نفس/i, "mind"],
  [/sociolog|اجتماع/i, "society"],
  [/career|مهني|vocation|تقني|technical/i, "career"],
  [/life.?skill|مهارات|حياتية|critical.?think|تفكير/i, "skills"],
]

/**
 * Map any subject text (slug or name, EN or AR) to the closest of the 23
 * concepts. **Never returns null** — defaults to `language` (every catalog has
 * language subjects, and a generic shared image beats a flat color).
 */
export function nearestConcept(text: string | null | undefined): Concept {
  if (!text) return "language"
  const t = text.replace(/[-_]/g, " ")
  for (const [re, concept] of NEAREST_RULES) if (re.test(t)) return concept
  return "language"
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
  biology: "life",
  chemistry: "chemistry",
  physics: "physics",
  "environmental-science": "earth",
  "earth-science": "earth",
  "earth-environment": "earth",
  history: "history",
  geography: "geography",
  "social-studies": "civic",
  "uae-social-studies": "civic",
  "moral-education": "civic",
  civics: "civic",
  "national-education": "civic", // Sudan التربية الوطنية (g8 + new-curriculum g10)
  "christian-education": "faith", // Sudan التربية المسيحية (optional, secondary)
  "literary-studies": "language", // Sudan دراسات أدبية ولغوية (g12 arts stream)
  "military-science": "civic",
  "global-perspectives": "civic",
  economics: "economy",
  business: "economy",
  entrepreneurship: "economy", // Sudan ريادة الأعمال (new-curriculum g10)
  "business-studies": "economy",
  accounting: "economy",
  "commercial-studies": "economy",
  art: "art",
  "art-design": "art",
  arts: "art",
  music: "art",
  computing: "computer",
  "computer-science": "computer",
  ict: "computer",
  technology: "computer",
  "design-technology": "career",
  "technical-education": "career",
  engineering: "science",
  agriculture: "life",
  "physical-education": "sport",
  pe: "sport",
  pshe: "skills",
  "life-skills": "skills",
  clothing: "skills",
  resources: "skills",
  "home-economics": "health",
  arabic: "language",
  "arabic-literature": "language",
  "arabic-rhetoric": "language",
  "arabic-grammar": "language",
  "arabic-specialized": "language",
  french: "language",
  spanish: "language",
  languages: "language",
  islamic: "faith",
  "islamic-studies": "faith",
  "islamic-education": "faith",
  quran: "faith",
  religion: "faith",
  psychology: "mind",
  sociology: "society",
}

/** Display name → concept (US entries + Sudan Arabic names). */
export const SUBJECT_CONCEPT_BY_NAME: Record<string, string> = {
  // US
  Arts: "art",
  "Business and Economics": "economy",
  "Career and Technical Education": "career",
  "Careers and Technical Education": "career",
  "Celebrations, Commemorations and Festivals": "celebration",
  "Chemical Science": "chemistry",
  Chemistry: "chemistry",
  "Civics and Government": "civic",
  "Computer Science and Technology": "computer",
  "Earth and Space Science": "earth",
  Economics: "economy",
  "English Language Arts": "english",
  Geography: "geography",
  Health: "health",
  History: "history",
  "Life Science": "life",
  "Life Sciences": "life",
  "Life Skills": "skills",
  Math: "math",
  "Physical Education": "sport",
  "Physical Science": "science",
  Physics: "physics",
  Psychology: "mind",
  Religion: "faith",
  "Religion and Ethics": "faith",
  "Religion and Philosophy": "faith",
  "Science and Engineering Practices": "science",
  Sociology: "society",
  "Teacher Professional Development": "teaching",
  "U.S. History": "history",
  "World History": "history",
  "World Languages": "language",
  // Sudan (Arabic names)
  "اللغة العربية": "language",
  الرياضيات: "math",
  "التربية الإسلامية": "faith",
  "اللغة الإنجليزية": "english",
  العلوم: "science",
  التاريخ: "history",
  الجغرافيا: "geography",
  الفنية: "art",
  "علوم الحاسوب": "computer",
  الفيزياء: "physics",
  الكيمياء: "chemistry",
  الأحياء: "life",
  "الدراسات الإسلامية": "faith",
  "القرآن وعلومه": "faith",
  "اللغة الفرنسية": "language",
  "البلاغة والتعبير": "language",
  "قواعد النحو": "language",
  "الأدب والمطالعة": "language",
  "اللغة العربية الخاصة": "language",
  "العلوم العسكرية": "civic",
  "العلوم الهندسية": "science",
  "العلوم التجارية": "economy",
  "العلوم الأسرية": "health",
  "الإنتاج الزراعي والحيواني": "life",
  "الرياضيات الأساسية": "math",
  "الفنون والتصميم": "art",
  "تكنولوجيا الاتصالات": "computer",
  "أساسيات التربية التقنية": "career",
}

/** Subject concept → 5-concept rotation pool (chapter thumbnail variety). */
export const CONCEPT_POOL: Record<string, string[]> = {
  language: ["language", "english", "art", "history", "geography"],
  math: ["math", "science", "computer", "physics", "economy"],
  nature: ["nature", "life", "earth", "science", "geography"],
  english: ["english", "language", "art", "history", "society"],
  faith: ["faith", "history", "language", "skills", "mind"],
  science: ["science", "life", "chemistry", "physics", "earth"],
  history: ["history", "geography", "civic", "society", "economy"],
  geography: ["geography", "earth", "science", "history", "life"],
  art: ["art", "skills", "celebration", "language", "mind"],
  computer: [
    "computer",
    "math",
    "science",
    "career",
    "economy",
  ],
  physics: ["physics", "math", "science", "computer", "earth"],
  chemistry: ["chemistry", "science", "life", "physics", "health"],
  life: ["life", "science", "health", "chemistry", "earth"],
  health: ["health", "skills", "life", "science", "economy"],
  civic: ["civic", "history", "sport", "skills", "geography"],
  economy: [
    "economy",
    "math",
    "computer",
    "career",
    "society",
  ],
  career: [
    "career",
    "computer",
    "science",
    "math",
    "economy",
  ],
  earth: [
    "earth",
    "science",
    "life",
    "geography",
    "chemistry",
  ],
  skills: ["skills", "health", "art", "economy", "society"],
  celebration: ["celebration", "art", "history", "society", "language"],
  sport: ["sport", "health", "skills", "science", "mind"],
  mind: ["mind", "society", "health", "skills", "science"],
  society: ["society", "mind", "history", "economy", "civic"],
  teaching: [
    "teaching",
    "skills",
    "mind",
    "society",
    "career",
  ],
}
