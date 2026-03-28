// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * World Curricula Seed
 *
 * Adds 8 new curricula (British, IB, Saudi, Egyptian, UAE, Qatar, Kuwait, Jordan)
 * with grade-specific subjects. All subjects use shared concept-based images
 * from catalog/concepts/{concept}/thumbnail.
 *
 * Usage: pnpm db:seed:single world-curricula
 */

import type { PrismaClient, SchoolLevel } from "@prisma/client"

import { logSuccess } from "./utils"

// ============================================================================
// Types
// ============================================================================

interface CurriculumDef {
  country: string
  code: string
  slug: string
  name: string
  lang: string
  organization: string
  website?: string
  gradeRange: string
  structure: string
  description?: string
}

interface SubjectDef {
  name: string
  slug: string // subject slug prefix (e.g., "math")
  department: string
  concept: string // maps to shared image concept
  color: string
  grades: number[] // which grades this subject spans
}

interface CurriculumWithSubjects {
  curriculum: CurriculumDef
  subjects: SubjectDef[]
}

// ============================================================================
// Shared concept colors (consistent across all curricula)
// ============================================================================

const CONCEPT_COLORS: Record<string, string> = {
  math: "#4A90D9",
  science: "#2ECC71",
  english: "#E74C3C",
  arabic: "#8E44AD",
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

function colorFor(concept: string): string {
  return CONCEPT_COLORS[concept] ?? "#6366F1"
}

function gradeToLevel(grade: number): SchoolLevel {
  if (grade <= 6) return "ELEMENTARY"
  if (grade <= 9) return "MIDDLE"
  return "HIGH"
}

// ============================================================================
// 1. BRITISH NATIONAL CURRICULUM (GB)
// ============================================================================

const BRITISH: CurriculumWithSubjects = {
  curriculum: {
    country: "GB",
    code: "national",
    slug: "gb-national",
    name: "British National Curriculum",
    lang: "en",
    organization: "Department for Education",
    website: "https://www.gov.uk/government/collections/national-curriculum",
    gradeRange: "1-13",
    structure: "6+3+4", // Primary (1-6) + KS3 (7-9) + KS4+KS5 (10-13)
    description:
      "The National Curriculum for England, covering Key Stages 1-5 (Years 1-13)",
  },
  subjects: [
    {
      name: "English",
      slug: "english",
      department: "Languages",
      concept: "english",
      color: colorFor("english"),
      grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    },
    {
      name: "Mathematics",
      slug: "math",
      department: "Mathematics",
      concept: "math",
      color: colorFor("math"),
      grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    },
    {
      name: "Science",
      slug: "science",
      department: "Sciences",
      concept: "science",
      color: colorFor("science"),
      grades: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    },
    {
      name: "Biology",
      slug: "biology",
      department: "Sciences",
      concept: "biology",
      color: colorFor("biology"),
      grades: [10, 11, 12, 13],
    },
    {
      name: "Chemistry",
      slug: "chemistry",
      department: "Sciences",
      concept: "chemistry",
      color: colorFor("chemistry"),
      grades: [10, 11, 12, 13],
    },
    {
      name: "Physics",
      slug: "physics",
      department: "Sciences",
      concept: "physics",
      color: colorFor("physics"),
      grades: [10, 11, 12, 13],
    },
    {
      name: "History",
      slug: "history",
      department: "Humanities",
      concept: "history",
      color: colorFor("history"),
      grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    },
    {
      name: "Geography",
      slug: "geography",
      department: "Humanities",
      concept: "geography",
      color: colorFor("geography"),
      grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    },
    {
      name: "Computing",
      slug: "computing",
      department: "Technology",
      concept: "computer-science",
      color: colorFor("computer-science"),
      grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    },
    {
      name: "Art and Design",
      slug: "art",
      department: "Arts",
      concept: "arts",
      color: colorFor("arts"),
      grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    },
    {
      name: "Music",
      slug: "music",
      department: "Arts",
      concept: "arts",
      color: colorFor("arts"),
      grades: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    },
    {
      name: "Physical Education",
      slug: "pe",
      department: "Physical Education",
      concept: "pe",
      color: colorFor("pe"),
      grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    },
    {
      name: "Design and Technology",
      slug: "design-tech",
      department: "Technology",
      concept: "career-tech",
      color: colorFor("career-tech"),
      grades: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    },
    {
      name: "Religious Education",
      slug: "re",
      department: "Humanities",
      concept: "religion",
      color: colorFor("religion"),
      grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    },
    {
      name: "Modern Foreign Languages",
      slug: "mfl",
      department: "Languages",
      concept: "languages",
      color: colorFor("languages"),
      grades: [3, 4, 5, 6, 7, 8, 9],
    },
    {
      name: "Citizenship",
      slug: "citizenship",
      department: "Humanities",
      concept: "civics",
      color: colorFor("civics"),
      grades: [7, 8, 9, 10, 11],
    },
    {
      name: "PSHE",
      slug: "pshe",
      department: "Personal Development",
      concept: "life-skills",
      color: colorFor("life-skills"),
      grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    },
    {
      name: "Economics",
      slug: "economics",
      department: "Social Sciences",
      concept: "economics",
      color: colorFor("economics"),
      grades: [12, 13],
    },
    {
      name: "Psychology",
      slug: "psychology",
      department: "Social Sciences",
      concept: "psychology",
      color: colorFor("psychology"),
      grades: [12, 13],
    },
    {
      name: "Sociology",
      slug: "sociology",
      department: "Social Sciences",
      concept: "sociology",
      color: colorFor("sociology"),
      grades: [12, 13],
    },
  ],
}

// ============================================================================
// 2. INTERNATIONAL BACCALAUREATE (IB)
// ============================================================================

const IB: CurriculumWithSubjects = {
  curriculum: {
    country: "*",
    code: "ib",
    slug: "ib-diploma",
    name: "International Baccalaureate",
    lang: "en",
    organization: "International Baccalaureate Organization (IBO)",
    website: "https://www.ibo.org",
    gradeRange: "1-12",
    structure: "6+5+2", // PYP (1-6) + MYP (7-11) + DP (12-13)
    description:
      "International Baccalaureate covering PYP, MYP, and Diploma Programme",
  },
  subjects: [
    // PYP & MYP core (Grades 1-11)
    {
      name: "Language and Literature",
      slug: "lang-lit",
      department: "Languages",
      concept: "english",
      color: colorFor("english"),
      grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    },
    {
      name: "Mathematics",
      slug: "math",
      department: "Mathematics",
      concept: "math",
      color: colorFor("math"),
      grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    },
    {
      name: "Sciences",
      slug: "science",
      department: "Sciences",
      concept: "science",
      color: colorFor("science"),
      grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    },
    {
      name: "Individuals and Societies",
      slug: "individuals-societies",
      department: "Humanities",
      concept: "history",
      color: colorFor("history"),
      grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    },
    {
      name: "Language Acquisition",
      slug: "lang-acq",
      department: "Languages",
      concept: "languages",
      color: colorFor("languages"),
      grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    },
    {
      name: "Arts",
      slug: "arts",
      department: "Arts",
      concept: "arts",
      color: colorFor("arts"),
      grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    },
    {
      name: "Physical and Health Education",
      slug: "phe",
      department: "Physical Education",
      concept: "pe",
      color: colorFor("pe"),
      grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    },
    {
      name: "Design",
      slug: "design",
      department: "Technology",
      concept: "career-tech",
      color: colorFor("career-tech"),
      grades: [7, 8, 9, 10, 11],
    },
    // DP subjects (Grades 12-13)
    {
      name: "English A: Literature",
      slug: "eng-lit",
      department: "Group 1: Studies in Language",
      concept: "english",
      color: colorFor("english"),
      grades: [12, 13],
    },
    {
      name: "Arabic A: Literature",
      slug: "arabic-lit",
      department: "Group 1: Studies in Language",
      concept: "arabic",
      color: colorFor("arabic"),
      grades: [12, 13],
    },
    {
      name: "English B",
      slug: "eng-b",
      department: "Group 2: Language Acquisition",
      concept: "english",
      color: colorFor("english"),
      grades: [12, 13],
    },
    {
      name: "Arabic B",
      slug: "arabic-b",
      department: "Group 2: Language Acquisition",
      concept: "arabic",
      color: colorFor("arabic"),
      grades: [12, 13],
    },
    {
      name: "French B",
      slug: "french-b",
      department: "Group 2: Language Acquisition",
      concept: "languages",
      color: colorFor("languages"),
      grades: [12, 13],
    },
    {
      name: "History",
      slug: "dp-history",
      department: "Group 3: Individuals and Societies",
      concept: "history",
      color: colorFor("history"),
      grades: [12, 13],
    },
    {
      name: "Geography",
      slug: "dp-geography",
      department: "Group 3: Individuals and Societies",
      concept: "geography",
      color: colorFor("geography"),
      grades: [12, 13],
    },
    {
      name: "Economics",
      slug: "dp-economics",
      department: "Group 3: Individuals and Societies",
      concept: "economics",
      color: colorFor("economics"),
      grades: [12, 13],
    },
    {
      name: "Psychology",
      slug: "dp-psychology",
      department: "Group 3: Individuals and Societies",
      concept: "psychology",
      color: colorFor("psychology"),
      grades: [12, 13],
    },
    {
      name: "Biology",
      slug: "dp-biology",
      department: "Group 4: Sciences",
      concept: "biology",
      color: colorFor("biology"),
      grades: [12, 13],
    },
    {
      name: "Chemistry",
      slug: "dp-chemistry",
      department: "Group 4: Sciences",
      concept: "chemistry",
      color: colorFor("chemistry"),
      grades: [12, 13],
    },
    {
      name: "Physics",
      slug: "dp-physics",
      department: "Group 4: Sciences",
      concept: "physics",
      color: colorFor("physics"),
      grades: [12, 13],
    },
    {
      name: "Computer Science",
      slug: "dp-cs",
      department: "Group 4: Sciences",
      concept: "computer-science",
      color: colorFor("computer-science"),
      grades: [12, 13],
    },
    {
      name: "Mathematics: Analysis and Approaches",
      slug: "dp-math-aa",
      department: "Group 5: Mathematics",
      concept: "math",
      color: colorFor("math"),
      grades: [12, 13],
    },
    {
      name: "Mathematics: Applications and Interpretation",
      slug: "dp-math-ai",
      department: "Group 5: Mathematics",
      concept: "math",
      color: colorFor("math"),
      grades: [12, 13],
    },
    {
      name: "Visual Arts",
      slug: "dp-visual-arts",
      department: "Group 6: The Arts",
      concept: "arts",
      color: colorFor("arts"),
      grades: [12, 13],
    },
  ],
}

// ============================================================================
// 3. SAUDI ARABIA (SA)
// ============================================================================

const SAUDI: CurriculumWithSubjects = {
  curriculum: {
    country: "SA",
    code: "national",
    slug: "sa-national",
    name: "المنهج السعودي الوطني",
    lang: "ar",
    organization: "وزارة التعليم - المملكة العربية السعودية",
    website: "https://www.moe.gov.sa",
    gradeRange: "1-12",
    structure: "6+3+3", // Primary + Intermediate + Secondary
    description:
      "المنهج الوطني للمملكة العربية السعودية وفق رؤية 2030 التعليمية",
  },
  subjects: [
    {
      name: "اللغة العربية",
      slug: "arabic",
      department: "اللغات",
      concept: "arabic",
      color: colorFor("arabic"),
      grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
    {
      name: "الرياضيات",
      slug: "math",
      department: "الرياضيات",
      concept: "math",
      color: colorFor("math"),
      grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
    {
      name: "العلوم",
      slug: "science",
      department: "العلوم",
      concept: "science",
      color: colorFor("science"),
      grades: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    },
    {
      name: "اللغة الإنجليزية",
      slug: "english",
      department: "اللغات",
      concept: "english",
      color: colorFor("english"),
      grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
    {
      name: "التربية الإسلامية",
      slug: "islamic-studies",
      department: "التربية الإسلامية",
      concept: "religion",
      color: colorFor("religion"),
      grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
    {
      name: "الدراسات الاجتماعية",
      slug: "social-studies",
      department: "العلوم الاجتماعية",
      concept: "history",
      color: colorFor("history"),
      grades: [4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
    {
      name: "المهارات الرقمية",
      slug: "digital-skills",
      department: "التقنية",
      concept: "computer-science",
      color: colorFor("computer-science"),
      grades: [4, 5, 6, 7, 8, 9],
    },
    {
      name: "حاسب آلي",
      slug: "computer",
      department: "التقنية",
      concept: "computer-science",
      color: colorFor("computer-science"),
      grades: [10, 11, 12],
    },
    {
      name: "التربية البدنية والدفاع عن النفس",
      slug: "pe",
      department: "التربية البدنية",
      concept: "pe",
      color: colorFor("pe"),
      grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
    {
      name: "التربية الفنية",
      slug: "art",
      department: "الفنون",
      concept: "arts",
      color: colorFor("arts"),
      grades: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    },
    {
      name: "المهارات الحياتية والأسرية",
      slug: "life-skills",
      department: "المهارات الحياتية",
      concept: "life-skills",
      color: colorFor("life-skills"),
      grades: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    },
    {
      name: "الأحياء",
      slug: "biology",
      department: "العلوم",
      concept: "biology",
      color: colorFor("biology"),
      grades: [10, 11, 12],
    },
    {
      name: "الكيمياء",
      slug: "chemistry",
      department: "العلوم",
      concept: "chemistry",
      color: colorFor("chemistry"),
      grades: [10, 11, 12],
    },
    {
      name: "الفيزياء",
      slug: "physics",
      department: "العلوم",
      concept: "physics",
      color: colorFor("physics"),
      grades: [10, 11, 12],
    },
    {
      name: "التفكير الناقد",
      slug: "critical-thinking",
      department: "المهارات الحياتية",
      concept: "life-skills",
      color: colorFor("life-skills"),
      grades: [10, 11, 12],
    },
  ],
}

// ============================================================================
// 4. EGYPT (EG)
// ============================================================================

const EGYPT: CurriculumWithSubjects = {
  curriculum: {
    country: "EG",
    code: "national",
    slug: "eg-national",
    name: "المنهج المصري الوطني",
    lang: "ar",
    organization: "وزارة التربية والتعليم والتعليم الفني - مصر",
    website: "https://moe.gov.eg",
    gradeRange: "1-12",
    structure: "6+3+3", // Primary + Preparatory + Secondary
    description: "المنهج الوطني لجمهورية مصر العربية - نظام التعليم 2.0",
  },
  subjects: [
    {
      name: "اللغة العربية",
      slug: "arabic",
      department: "اللغات",
      concept: "arabic",
      color: colorFor("arabic"),
      grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
    {
      name: "الرياضيات",
      slug: "math",
      department: "الرياضيات",
      concept: "math",
      color: colorFor("math"),
      grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
    {
      name: "اللغة الإنجليزية",
      slug: "english",
      department: "اللغات",
      concept: "english",
      color: colorFor("english"),
      grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
    {
      name: "العلوم",
      slug: "science",
      department: "العلوم",
      concept: "science",
      color: colorFor("science"),
      grades: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    },
    {
      name: "الدراسات الاجتماعية",
      slug: "social-studies",
      department: "العلوم الاجتماعية",
      concept: "history",
      color: colorFor("history"),
      grades: [4, 5, 6, 7, 8, 9],
    },
    {
      name: "التربية الدينية الإسلامية",
      slug: "islamic-ed",
      department: "التربية الدينية",
      concept: "religion",
      color: colorFor("religion"),
      grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
    {
      name: "الحاسب الآلي وتكنولوجيا المعلومات",
      slug: "ict",
      department: "التقنية",
      concept: "computer-science",
      color: colorFor("computer-science"),
      grades: [4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
    {
      name: "التربية الفنية",
      slug: "art",
      department: "الفنون",
      concept: "arts",
      color: colorFor("arts"),
      grades: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    },
    {
      name: "التربية البدنية",
      slug: "pe",
      department: "التربية البدنية",
      concept: "pe",
      color: colorFor("pe"),
      grades: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    },
    {
      name: "اللغة الفرنسية",
      slug: "french",
      department: "اللغات",
      concept: "languages",
      color: colorFor("languages"),
      grades: [7, 8, 9, 10, 11, 12],
    },
    {
      name: "الأحياء",
      slug: "biology",
      department: "العلوم",
      concept: "biology",
      color: colorFor("biology"),
      grades: [10, 11, 12],
    },
    {
      name: "الكيمياء",
      slug: "chemistry",
      department: "العلوم",
      concept: "chemistry",
      color: colorFor("chemistry"),
      grades: [10, 11, 12],
    },
    {
      name: "الفيزياء",
      slug: "physics",
      department: "العلوم",
      concept: "physics",
      color: colorFor("physics"),
      grades: [10, 11, 12],
    },
    {
      name: "التاريخ",
      slug: "history",
      department: "العلوم الاجتماعية",
      concept: "history",
      color: colorFor("history"),
      grades: [10, 11, 12],
    },
    {
      name: "الجغرافيا",
      slug: "geography",
      department: "العلوم الاجتماعية",
      concept: "geography",
      color: colorFor("geography"),
      grades: [10, 11, 12],
    },
    {
      name: "الفلسفة والمنطق",
      slug: "philosophy",
      department: "العلوم الاجتماعية",
      concept: "sociology",
      color: colorFor("sociology"),
      grades: [10, 11, 12],
    },
    {
      name: "علم النفس",
      slug: "psychology",
      department: "العلوم الاجتماعية",
      concept: "psychology",
      color: colorFor("psychology"),
      grades: [11, 12],
    },
    {
      name: "التربية الوطنية",
      slug: "civics",
      department: "العلوم الاجتماعية",
      concept: "civics",
      color: colorFor("civics"),
      grades: [7, 8, 9, 10, 11, 12],
    },
  ],
}

// ============================================================================
// 5. UAE (AE)
// ============================================================================

const UAE: CurriculumWithSubjects = {
  curriculum: {
    country: "AE",
    code: "national",
    slug: "ae-national",
    name: "المنهج الوطني الإماراتي",
    lang: "ar",
    organization: "وزارة التربية والتعليم - الإمارات العربية المتحدة",
    website: "https://www.moe.gov.ae",
    gradeRange: "1-12",
    structure: "4+4+4", // Cycle 1 (1-4) + Cycle 2 (5-8) + Cycle 3 (9-12)
    description: "المنهج الوطني لدولة الإمارات العربية المتحدة",
  },
  subjects: [
    {
      name: "اللغة العربية",
      slug: "arabic",
      department: "اللغات",
      concept: "arabic",
      color: colorFor("arabic"),
      grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
    {
      name: "الرياضيات",
      slug: "math",
      department: "الرياضيات",
      concept: "math",
      color: colorFor("math"),
      grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
    {
      name: "اللغة الإنجليزية",
      slug: "english",
      department: "اللغات",
      concept: "english",
      color: colorFor("english"),
      grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
    {
      name: "العلوم",
      slug: "science",
      department: "العلوم",
      concept: "science",
      color: colorFor("science"),
      grades: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    },
    {
      name: "التربية الإسلامية",
      slug: "islamic-studies",
      department: "التربية الإسلامية",
      concept: "religion",
      color: colorFor("religion"),
      grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
    {
      name: "الدراسات الاجتماعية",
      slug: "social-studies",
      department: "العلوم الاجتماعية",
      concept: "history",
      color: colorFor("history"),
      grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
    {
      name: "التربية الأخلاقية",
      slug: "moral-ed",
      department: "المهارات الحياتية",
      concept: "civics",
      color: colorFor("civics"),
      grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
    {
      name: "الحوسبة وتقنية المعلومات",
      slug: "computing",
      department: "التقنية",
      concept: "computer-science",
      color: colorFor("computer-science"),
      grades: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
    {
      name: "التربية البدنية والصحية",
      slug: "pe",
      department: "التربية البدنية",
      concept: "pe",
      color: colorFor("pe"),
      grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
    {
      name: "الفنون البصرية",
      slug: "art",
      department: "الفنون",
      concept: "arts",
      color: colorFor("arts"),
      grades: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    },
    {
      name: "الأحياء",
      slug: "biology",
      department: "العلوم",
      concept: "biology",
      color: colorFor("biology"),
      grades: [10, 11, 12],
    },
    {
      name: "الكيمياء",
      slug: "chemistry",
      department: "العلوم",
      concept: "chemistry",
      color: colorFor("chemistry"),
      grades: [10, 11, 12],
    },
    {
      name: "الفيزياء",
      slug: "physics",
      department: "العلوم",
      concept: "physics",
      color: colorFor("physics"),
      grades: [10, 11, 12],
    },
    {
      name: "إدارة الأعمال",
      slug: "business",
      department: "العلوم الاجتماعية",
      concept: "economics",
      color: colorFor("economics"),
      grades: [10, 11, 12],
    },
    {
      name: "التصميم والتكنولوجيا",
      slug: "design-tech",
      department: "التقنية",
      concept: "career-tech",
      color: colorFor("career-tech"),
      grades: [5, 6, 7, 8, 9],
    },
  ],
}

// ============================================================================
// 6. QATAR (QA)
// ============================================================================

const QATAR: CurriculumWithSubjects = {
  curriculum: {
    country: "QA",
    code: "national",
    slug: "qa-national",
    name: "المنهج القطري الوطني",
    lang: "ar",
    organization: "وزارة التربية والتعليم والتعليم العالي - دولة قطر",
    website: "https://www.edu.gov.qa",
    gradeRange: "1-12",
    structure: "6+3+3", // Primary + Preparatory + Secondary
    description: "المنهج الوطني لدولة قطر",
  },
  subjects: [
    {
      name: "اللغة العربية",
      slug: "arabic",
      department: "اللغات",
      concept: "arabic",
      color: colorFor("arabic"),
      grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
    {
      name: "الرياضيات",
      slug: "math",
      department: "الرياضيات",
      concept: "math",
      color: colorFor("math"),
      grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
    {
      name: "اللغة الإنجليزية",
      slug: "english",
      department: "اللغات",
      concept: "english",
      color: colorFor("english"),
      grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
    {
      name: "العلوم",
      slug: "science",
      department: "العلوم",
      concept: "science",
      color: colorFor("science"),
      grades: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    },
    {
      name: "التربية الإسلامية",
      slug: "islamic-studies",
      department: "التربية الإسلامية",
      concept: "religion",
      color: colorFor("religion"),
      grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
    {
      name: "المواد الاجتماعية",
      slug: "social-studies",
      department: "العلوم الاجتماعية",
      concept: "history",
      color: colorFor("history"),
      grades: [4, 5, 6, 7, 8, 9],
    },
    {
      name: "الحاسب الآلي",
      slug: "computing",
      department: "التقنية",
      concept: "computer-science",
      color: colorFor("computer-science"),
      grades: [4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
    {
      name: "التربية البدنية",
      slug: "pe",
      department: "التربية البدنية",
      concept: "pe",
      color: colorFor("pe"),
      grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
    {
      name: "التربية الفنية",
      slug: "art",
      department: "الفنون",
      concept: "arts",
      color: colorFor("arts"),
      grades: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    },
    {
      name: "الأحياء",
      slug: "biology",
      department: "العلوم",
      concept: "biology",
      color: colorFor("biology"),
      grades: [10, 11, 12],
    },
    {
      name: "الكيمياء",
      slug: "chemistry",
      department: "العلوم",
      concept: "chemistry",
      color: colorFor("chemistry"),
      grades: [10, 11, 12],
    },
    {
      name: "الفيزياء",
      slug: "physics",
      department: "العلوم",
      concept: "physics",
      color: colorFor("physics"),
      grades: [10, 11, 12],
    },
    {
      name: "التاريخ",
      slug: "history",
      department: "العلوم الاجتماعية",
      concept: "history",
      color: colorFor("history"),
      grades: [10, 11, 12],
    },
    {
      name: "الجغرافيا",
      slug: "geography",
      department: "العلوم الاجتماعية",
      concept: "geography",
      color: colorFor("geography"),
      grades: [10, 11, 12],
    },
  ],
}

// ============================================================================
// 7. KUWAIT (KW)
// ============================================================================

const KUWAIT: CurriculumWithSubjects = {
  curriculum: {
    country: "KW",
    code: "national",
    slug: "kw-national",
    name: "المنهج الكويتي الوطني",
    lang: "ar",
    organization: "وزارة التربية - دولة الكويت",
    website: "https://www.moe.edu.kw",
    gradeRange: "1-12",
    structure: "5+4+3", // Primary (1-5) + Intermediate (6-9) + Secondary (10-12)
    description: "المنهج الوطني لدولة الكويت",
  },
  subjects: [
    {
      name: "اللغة العربية",
      slug: "arabic",
      department: "اللغات",
      concept: "arabic",
      color: colorFor("arabic"),
      grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
    {
      name: "الرياضيات",
      slug: "math",
      department: "الرياضيات",
      concept: "math",
      color: colorFor("math"),
      grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
    {
      name: "اللغة الإنجليزية",
      slug: "english",
      department: "اللغات",
      concept: "english",
      color: colorFor("english"),
      grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
    {
      name: "العلوم",
      slug: "science",
      department: "العلوم",
      concept: "science",
      color: colorFor("science"),
      grades: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    },
    {
      name: "التربية الإسلامية",
      slug: "islamic-studies",
      department: "التربية الإسلامية",
      concept: "religion",
      color: colorFor("religion"),
      grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
    {
      name: "الاجتماعيات",
      slug: "social-studies",
      department: "العلوم الاجتماعية",
      concept: "history",
      color: colorFor("history"),
      grades: [4, 5, 6, 7, 8, 9],
    },
    {
      name: "الحاسوب",
      slug: "computing",
      department: "التقنية",
      concept: "computer-science",
      color: colorFor("computer-science"),
      grades: [5, 6, 7, 8, 9, 10, 11, 12],
    },
    {
      name: "التربية البدنية",
      slug: "pe",
      department: "التربية البدنية",
      concept: "pe",
      color: colorFor("pe"),
      grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
    {
      name: "التربية الفنية",
      slug: "art",
      department: "الفنون",
      concept: "arts",
      color: colorFor("arts"),
      grades: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    },
    {
      name: "التربية الموسيقية",
      slug: "music",
      department: "الفنون",
      concept: "arts",
      color: colorFor("arts"),
      grades: [1, 2, 3, 4, 5],
    },
    {
      name: "الأحياء",
      slug: "biology",
      department: "العلوم",
      concept: "biology",
      color: colorFor("biology"),
      grades: [10, 11, 12],
    },
    {
      name: "الكيمياء",
      slug: "chemistry",
      department: "العلوم",
      concept: "chemistry",
      color: colorFor("chemistry"),
      grades: [10, 11, 12],
    },
    {
      name: "الفيزياء",
      slug: "physics",
      department: "العلوم",
      concept: "physics",
      color: colorFor("physics"),
      grades: [10, 11, 12],
    },
    {
      name: "الدستور",
      slug: "constitution",
      department: "العلوم الاجتماعية",
      concept: "civics",
      color: colorFor("civics"),
      grades: [10, 11, 12],
    },
    {
      name: "التاريخ",
      slug: "history",
      department: "العلوم الاجتماعية",
      concept: "history",
      color: colorFor("history"),
      grades: [10, 11, 12],
    },
    {
      name: "الجغرافيا",
      slug: "geography",
      department: "العلوم الاجتماعية",
      concept: "geography",
      color: colorFor("geography"),
      grades: [10, 11, 12],
    },
    {
      name: "اللغة الفرنسية",
      slug: "french",
      department: "اللغات",
      concept: "languages",
      color: colorFor("languages"),
      grades: [6, 7, 8, 9, 10, 11, 12],
    },
  ],
}

// ============================================================================
// 8. JORDAN (JO)
// ============================================================================

const JORDAN: CurriculumWithSubjects = {
  curriculum: {
    country: "JO",
    code: "national",
    slug: "jo-national",
    name: "المنهج الأردني الوطني",
    lang: "ar",
    organization: "وزارة التربية والتعليم - المملكة الأردنية الهاشمية",
    website: "https://www.moe.gov.jo",
    gradeRange: "1-12",
    structure: "10+2", // Basic (1-10) + Secondary Tawjihi (11-12)
    description: "المنهج الوطني للمملكة الأردنية الهاشمية - نظام التوجيهي",
  },
  subjects: [
    {
      name: "اللغة العربية",
      slug: "arabic",
      department: "اللغات",
      concept: "arabic",
      color: colorFor("arabic"),
      grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
    {
      name: "الرياضيات",
      slug: "math",
      department: "الرياضيات",
      concept: "math",
      color: colorFor("math"),
      grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
    {
      name: "اللغة الإنجليزية",
      slug: "english",
      department: "اللغات",
      concept: "english",
      color: colorFor("english"),
      grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
    {
      name: "العلوم",
      slug: "science",
      department: "العلوم",
      concept: "science",
      color: colorFor("science"),
      grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    },
    {
      name: "التربية الإسلامية",
      slug: "islamic-studies",
      department: "التربية الإسلامية",
      concept: "religion",
      color: colorFor("religion"),
      grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
    {
      name: "التربية الاجتماعية والوطنية",
      slug: "social-national",
      department: "العلوم الاجتماعية",
      concept: "civics",
      color: colorFor("civics"),
      grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    },
    {
      name: "التاريخ",
      slug: "history",
      department: "العلوم الاجتماعية",
      concept: "history",
      color: colorFor("history"),
      grades: [5, 6, 7, 8, 9, 10, 11, 12],
    },
    {
      name: "الجغرافيا",
      slug: "geography",
      department: "العلوم الاجتماعية",
      concept: "geography",
      color: colorFor("geography"),
      grades: [5, 6, 7, 8, 9, 10, 11, 12],
    },
    {
      name: "الحاسوب",
      slug: "computing",
      department: "التقنية",
      concept: "computer-science",
      color: colorFor("computer-science"),
      grades: [4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
    {
      name: "التربية البدنية",
      slug: "pe",
      department: "التربية البدنية",
      concept: "pe",
      color: colorFor("pe"),
      grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    },
    {
      name: "التربية الفنية",
      slug: "art",
      department: "الفنون",
      concept: "arts",
      color: colorFor("arts"),
      grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    },
    {
      name: "التربية المهنية",
      slug: "vocational",
      department: "التقنية",
      concept: "career-tech",
      color: colorFor("career-tech"),
      grades: [5, 6, 7, 8, 9, 10],
    },
    {
      name: "الأحياء",
      slug: "biology",
      department: "العلوم",
      concept: "biology",
      color: colorFor("biology"),
      grades: [11, 12],
    },
    {
      name: "الكيمياء",
      slug: "chemistry",
      department: "العلوم",
      concept: "chemistry",
      color: colorFor("chemistry"),
      grades: [11, 12],
    },
    {
      name: "الفيزياء",
      slug: "physics",
      department: "العلوم",
      concept: "physics",
      color: colorFor("physics"),
      grades: [11, 12],
    },
    {
      name: "علوم الأرض والبيئة",
      slug: "earth-science",
      department: "العلوم",
      concept: "earth-science",
      color: colorFor("earth-science"),
      grades: [11, 12],
    },
    {
      name: "الثقافة المالية",
      slug: "financial-literacy",
      department: "العلوم الاجتماعية",
      concept: "economics",
      color: colorFor("economics"),
      grades: [7, 8, 9, 10, 11, 12],
    },
  ],
}

// ============================================================================
// ALL CURRICULA
// ============================================================================

const ALL_CURRICULA: CurriculumWithSubjects[] = [
  BRITISH,
  IB,
  SAUDI,
  EGYPT,
  UAE,
  QATAR,
  KUWAIT,
  JORDAN,
]

// Concept → old curated banner S3 slug (wide 2048x378 images from ClickView)
const CONCEPT_BANNER_SLUG: Record<string, string> = {
  arts: "the-arts",
  english: "english",
  languages: "french",
  math: "mathematics",
  science: "science",
  physics: "physics",
  chemistry: "chemistry",
  biology: "biology",
  "earth-science": "earth-space-sciences",
  "computer-science": "computer-science",
  history: "history",
  geography: "geography",
  civics: "social-studies",
  economics: "business-economics",
  psychology: "psychology",
  religion: "islamic-education",
  pe: "physical-education",
  health: "health",
  "life-skills": "life-skills",
  "career-tech": "career-education",
  celebrations: "celebrations",
  "teacher-pd": "teacher-development",
  sociology: "sociology",
}

function conceptBannerKey(concept: string | null): string | null {
  if (!concept) return null
  const slug = CONCEPT_BANNER_SLUG[concept]
  return slug ? `catalog/subjects/${slug}/banner` : null
}

// ============================================================================
// Seed Function
// ============================================================================

export async function seedWorldCurricula(prisma: PrismaClient): Promise<void> {
  console.log("  Seeding World Curricula...")

  let curriculumCount = 0
  let subjectCount = 0
  let skippedSubjects = 0

  for (const entry of ALL_CURRICULA) {
    const { curriculum: cur, subjects } = entry

    // 1. Upsert Curriculum record
    const curriculum = await prisma.curriculum.upsert({
      where: {
        country_code: { country: cur.country, code: cur.code },
      },
      create: {
        name: cur.name,
        slug: cur.slug,
        code: cur.code,
        country: cur.country,
        lang: cur.lang,
        description: cur.description,
        organization: cur.organization,
        website: cur.website,
        gradeRange: cur.gradeRange,
        structure: cur.structure,
        status: "PUBLISHED",
      },
      update: {
        name: cur.name,
        organization: cur.organization,
        website: cur.website,
        gradeRange: cur.gradeRange,
        structure: cur.structure,
        description: cur.description,
      },
    })

    curriculumCount++
    console.log(`  ${cur.country}: ${cur.name} (${subjects.length} subjects)`)

    // 2. Create grade-specific subjects
    let sortIdx = getSortBase(cur.country)

    for (const subj of subjects) {
      for (const grade of subj.grades) {
        const slug = `${cur.slug}-g${grade}-${subj.slug}`
        const level = gradeToLevel(grade)
        const gradeConceptPrefix = `catalog/concepts/g${grade}-${subj.concept}`

        // Check if already exists
        const existing = await prisma.subject.findUnique({
          where: { slug },
          select: { id: true },
        })

        if (existing) {
          skippedSubjects++
          continue
        }

        await prisma.subject.create({
          data: {
            name: subj.name,
            slug,
            lang: cur.lang,
            department: subj.department,
            country: cur.country,
            curriculum: cur.code,
            curriculumId: curriculum.id,
            concept: subj.concept,
            color: subj.color,
            levels: [level],
            grades: [grade],
            thumbnail: `${gradeConceptPrefix}/thumbnail`,
            banner: conceptBannerKey(subj.concept),
            cover: `catalog/concepts/${subj.concept}/cover`,
            status: "PUBLISHED",
            sortOrder: sortIdx++,
          },
        })

        subjectCount++
      }
    }
  }

  logSuccess("Curricula", curriculumCount, "curriculum records")
  logSuccess("Subjects", subjectCount, `grade-specific subjects created`)
  if (skippedSubjects > 0) {
    logSuccess("Skipped", skippedSubjects, "subjects already existed")
  }
}

/**
 * Sort order base per country to avoid collisions:
 * SD: 1000-1999, US: 0-999, GB: 2000-2999, IB: 3000-3999,
 * SA: 4000-4999, EG: 5000-5999, AE: 6000-6999, QA: 7000-7999,
 * KW: 8000-8999, JO: 9000-9999
 */
function getSortBase(country: string): number {
  const bases: Record<string, number> = {
    US: 0,
    SD: 1000,
    GB: 2000,
    "*": 3000, // IB
    SA: 4000,
    EG: 5000,
    AE: 6000,
    QA: 7000,
    KW: 8000,
    JO: 9000,
  }
  return bases[country] ?? 10000
}
