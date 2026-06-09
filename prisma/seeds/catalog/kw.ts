// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Kuwait (KW) — subjects-only national curriculum.
 *
 * Grade-spanning subjects on the shared concept thumbnails; no authored
 * chapter/lesson tree yet. Graduates to a syncCurriculumTree caller once
 * curriculum/kw/ is authored. Curriculum record owned by registry.ts.
 *
 * Usage: pnpm db:seed:single kw
 */

import type { PrismaClient } from "@prisma/client"

import {
  colorFor,
  seedSubjectsOnly,
  type CurriculumWithSubjects,
} from "./engine"

const DATA: CurriculumWithSubjects = {
  curriculum: {
    country: "KW",
    code: "KW",
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

export async function seedKwCurriculum(prisma: PrismaClient): Promise<void> {
  await seedSubjectsOnly(prisma, DATA)
}
