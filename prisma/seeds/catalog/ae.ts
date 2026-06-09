// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * UAE (AE) — subjects-only national curriculum.
 *
 * Grade-spanning subjects on the shared concept thumbnails; no authored
 * chapter/lesson tree yet. Graduates to a syncCurriculumTree caller once
 * curriculum/ae/ is authored. Curriculum record owned by registry.ts.
 *
 * Usage: pnpm db:seed:single ae
 */

import type { PrismaClient } from "@prisma/client"

import {
  colorFor,
  seedSubjectsOnly,
  type CurriculumWithSubjects,
} from "./engine"

const DATA: CurriculumWithSubjects = {
  curriculum: {
    country: "AE",
    code: "AE",
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
      concept: "languages",
      color: colorFor("languages"),
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

export async function seedAeCurriculum(prisma: PrismaClient): Promise<void> {
  await seedSubjectsOnly(prisma, DATA)
}
