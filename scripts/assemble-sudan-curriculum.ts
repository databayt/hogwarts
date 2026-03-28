/**
 * Assembles individual TOC JSON files from scripts/sudan-data/toc/
 * into the master scripts/sudan-data/sudan-curriculum.json
 *
 * Usage: npx tsx scripts/assemble-sudan-curriculum.ts
 */

import fs from "fs"
import path from "path"

const TOC_DIR = path.resolve(__dirname, "sudan-data/toc")
const OUTPUT = path.resolve(__dirname, "sudan-data/sudan-curriculum.json")

// ============================================================================
// Subject metadata (26 unique subjects across all grades)
// ============================================================================

interface SubjectMeta {
  name: string
  slug: string
  department: string
  concept: string
  color: string
}

const SUBJECT_META: Record<string, SubjectMeta> = {
  arabic: {
    name: "اللغة العربية",
    slug: "arabic",
    department: "Languages",
    concept: "arabic",
    color: "#3b82f6",
  },
  math: {
    name: "الرياضيات",
    slug: "math",
    department: "Sciences",
    concept: "math",
    color: "#f59e0b",
  },
  english: {
    name: "اللغة الإنجليزية",
    slug: "english",
    department: "Languages",
    concept: "english",
    color: "#10b981",
  },
  "islamic-studies": {
    name: "التربية الإسلامية",
    slug: "islamic-studies",
    department: "Religion",
    concept: "religion",
    color: "#8b5cf6",
  },
  science: {
    name: "العلوم",
    slug: "science",
    department: "Sciences",
    concept: "science",
    color: "#06b6d4",
  },
  history: {
    name: "التاريخ",
    slug: "history",
    department: "Humanities",
    concept: "history",
    color: "#d97706",
  },
  geography: {
    name: "الجغرافيا",
    slug: "geography",
    department: "Humanities",
    concept: "geography",
    color: "#059669",
  },
  arts: {
    name: "الفنية",
    slug: "arts",
    department: "Arts & Sports",
    concept: "arts",
    color: "#ec4899",
  },
  computer: {
    name: "علوم الحاسوب",
    slug: "computer",
    department: "ICT",
    concept: "computer-science",
    color: "#6366f1",
  },
  "computer-science": {
    name: "علوم الحاسوب",
    slug: "computer-science",
    department: "ICT",
    concept: "computer-science",
    color: "#6366f1",
  },
  physics: {
    name: "الفيزياء",
    slug: "physics",
    department: "Sciences",
    concept: "physics",
    color: "#0ea5e9",
  },
  chemistry: {
    name: "الكيمياء",
    slug: "chemistry",
    department: "Sciences",
    concept: "chemistry",
    color: "#14b8a6",
  },
  biology: {
    name: "الأحياء",
    slug: "biology",
    department: "Sciences",
    concept: "biology",
    color: "#22c55e",
  },
  "islamic-studies-adv": {
    name: "الدراسات الإسلامية",
    slug: "islamic-studies-adv",
    department: "Religion",
    concept: "religion",
    color: "#7c3aed",
  },
  "quran-studies": {
    name: "القرآن وعلومه",
    slug: "quran-studies",
    department: "Religion",
    concept: "religion",
    color: "#a855f7",
  },
  french: {
    name: "اللغة الفرنسية",
    slug: "french",
    department: "Languages",
    concept: "languages",
    color: "#2563eb",
  },
  rhetoric: {
    name: "البلاغة والتعبير",
    slug: "rhetoric",
    department: "Languages",
    concept: "arabic",
    color: "#4f46e5",
  },
  grammar: {
    name: "قواعد النحو",
    slug: "grammar",
    department: "Languages",
    concept: "arabic",
    color: "#7c3aed",
  },
  literature: {
    name: "الأدب والمطالعة",
    slug: "literature",
    department: "Languages",
    concept: "arabic",
    color: "#6d28d9",
  },
  "arabic-advanced": {
    name: "اللغة العربية الخاصة",
    slug: "arabic-advanced",
    department: "Languages",
    concept: "arabic",
    color: "#4338ca",
  },
  "military-sciences": {
    name: "العلوم العسكرية",
    slug: "military-sciences",
    department: "Humanities",
    concept: "civics",
    color: "#78716c",
  },
  engineering: {
    name: "العلوم الهندسية",
    slug: "engineering",
    department: "Sciences",
    concept: "science",
    color: "#ea580c",
  },
  commerce: {
    name: "العلوم التجارية",
    slug: "commerce",
    department: "Humanities",
    concept: "economics",
    color: "#ca8a04",
  },
  "family-sciences": {
    name: "العلوم الأسرية",
    slug: "family-sciences",
    department: "Arts & Sports",
    concept: "health",
    color: "#e11d48",
  },
  agriculture: {
    name: "الإنتاج الزراعي والحيواني",
    slug: "agriculture",
    department: "Sciences",
    concept: "biology",
    color: "#65a30d",
  },
  "basic-math": {
    name: "الرياضيات الأساسية",
    slug: "basic-math",
    department: "Sciences",
    concept: "math",
    color: "#f59e0b",
  },
  technology: {
    name: "تكنولوجيا الاتصالات",
    slug: "technology",
    department: "ICT",
    concept: "computer-science",
    color: "#6366f1",
  },
  "communication-tech": {
    name: "تكنولوجيا الاتصالات",
    slug: "communication-tech",
    department: "ICT",
    concept: "computer-science",
    color: "#6366f1",
  },
  "technical-education": {
    name: "أساسيات التربية التقنية",
    slug: "technical-education",
    department: "ICT",
    concept: "career-tech",
    color: "#ea580c",
  },
  "earth-environment": {
    name: "الأرض بيئة الحياة",
    slug: "earth-environment",
    department: "Sciences",
    concept: "earth-science",
    color: "#059669",
  },
  resources: {
    name: "المورد",
    slug: "resources",
    department: "Humanities",
    concept: "life-skills",
    color: "#0891b2",
  },
  clothing: {
    name: "ملبسنا",
    slug: "clothing",
    department: "Arts & Sports",
    concept: "life-skills",
    color: "#e11d48",
  },
  "arts-design": {
    name: "الفنون والتصميم",
    slug: "arts-design",
    department: "Arts & Sports",
    concept: "arts",
    color: "#ec4899",
  },
}

// ============================================================================
// Main
// ============================================================================

interface TocFile {
  subject: string
  subjectNameAr?: string
  grade: number
  level: string
  publisher?: string
  edition?: string
  chapters: Array<{
    nameAr: string
    name: string
    slug: string
    sequenceOrder: number
    lessons?: Array<{
      nameAr: string
      name: string
      slug: string
      sequenceOrder: number
    }>
  }>
}

const files = fs.readdirSync(TOC_DIR).filter((f) => f.endsWith(".json"))
console.log(`Found ${files.length} TOC files`)

// Group by subject slug
const subjectMap: Record<
  string,
  Record<
    string,
    {
      level: string
      publisher: string
      edition: string
      chapters: TocFile["chapters"]
    }
  >
> = {}

for (const file of files) {
  const raw = fs.readFileSync(path.join(TOC_DIR, file), "utf-8")
  const toc: TocFile = JSON.parse(raw)

  const subjectSlug = toc.subject
  if (!subjectMap[subjectSlug]) {
    subjectMap[subjectSlug] = {}
  }

  subjectMap[subjectSlug][String(toc.grade)] = {
    level: toc.level,
    publisher:
      toc.publisher || "المركز القومي للمناهج والبحث التربوي - بخت الرضا",
    edition: toc.edition || "",
    chapters: toc.chapters,
  }
}

// Build the final subjects array
const subjects = Object.keys(subjectMap)
  .sort()
  .map((slug) => {
    const meta = SUBJECT_META[slug]
    if (!meta) {
      console.warn(
        `  WARNING: No metadata for subject "${slug}", using defaults`
      )
      return {
        name: slug,
        slug,
        department: "General",
        concept: slug,
        color: "#6b7280",
        gradeChapters: subjectMap[slug],
      }
    }
    return {
      name: meta.name,
      slug: meta.slug,
      department: meta.department,
      concept: meta.concept,
      color: meta.color,
      gradeChapters: subjectMap[slug],
    }
  })

const output = {
  version: "1.0",
  country: "SD",
  curriculum: "national",
  lang: "ar",
  structure: {
    elementary: { grades: [1, 2, 3, 4, 5, 6], level: "ELEMENTARY" },
    middle: { grades: [7, 8, 9], level: "MIDDLE" },
    secondary: { grades: [10, 11, 12], level: "HIGH" },
  },
  subjects,
}

fs.writeFileSync(OUTPUT, JSON.stringify(output, null, 2), "utf-8")

// Stats
let totalSubjects = 0
let totalChapters = 0
let totalLessons = 0

for (const subj of subjects) {
  for (const [grade, data] of Object.entries(subj.gradeChapters)) {
    totalSubjects++
    for (const ch of data.chapters) {
      totalChapters++
      totalLessons += ch.lessons?.length ?? 0
    }
  }
}

console.log(`\nAssembled sudan-curriculum.json:`)
console.log(`  ${subjects.length} unique subjects`)
console.log(`  ${totalSubjects} grade-level subjects`)
console.log(`  ${totalChapters} chapters`)
console.log(`  ${totalLessons} lessons`)
