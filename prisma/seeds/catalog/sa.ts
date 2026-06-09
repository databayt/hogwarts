// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Saudi Arabia (SA) — subjects-only national curriculum.
 *
 * Grade-spanning subjects on the shared concept thumbnails; no authored
 * chapter/lesson tree yet. Graduates to a syncCurriculumTree caller once
 * curriculum/sa/ is authored. Curriculum record owned by registry.ts.
 *
 * Usage: pnpm db:seed:single sa
 */

import type { PrismaClient } from "@prisma/client"

import {
  colorFor,
  seedSubjectsOnly,
  type CurriculumWithSubjects,
} from "./engine"

const DATA: CurriculumWithSubjects = {
  curriculum: {
    country: "SA",
    code: "SA",
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

export async function seedSaCurriculum(prisma: PrismaClient): Promise<void> {
  await seedSubjectsOnly(prisma, DATA)
}
