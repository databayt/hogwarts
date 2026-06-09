// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Jordan (JO) — subjects-only national curriculum.
 *
 * Grade-spanning subjects on the shared concept thumbnails; no authored
 * chapter/lesson tree yet. Graduates to a syncCurriculumTree caller once
 * curriculum/jo/ is authored. Curriculum record owned by registry.ts.
 *
 * Usage: pnpm db:seed:single jo
 */

import type { PrismaClient } from "@prisma/client"

import {
  colorFor,
  seedSubjectsOnly,
  type CurriculumWithSubjects,
} from "./engine"

const DATA: CurriculumWithSubjects = {
  curriculum: {
    country: "JO",
    code: "JO",
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

export async function seedJoCurriculum(prisma: PrismaClient): Promise<void> {
  await seedSubjectsOnly(prisma, DATA)
}
