/**
 * Seed Catalog Exam Templates, Blueprints, and Paper Templates
 *
 * Creates:
 * - ~8 CatalogExamBlueprint (one per subject category)
 * - CatalogExamTemplate records (2 per published subject)
 * - ~8 CatalogPaperTemplate defaults
 *
 * Usage:
 *   pnpm db:seed:single catalog-exam-templates
 */

import type { PrismaClient } from "@prisma/client"

// ============================================================================
// BLUEPRINT CATEGORY DATA
// ============================================================================

const BLUEPRINT_CATEGORIES = [
  {
    category: "STEM_MATH",
    name: "STEM - Mathematics",
    description: "Mathematics, algebra, geometry, calculus, statistics",
    questionTypeWeights: {
      MULTIPLE_CHOICE: 0.25,
      FILL_BLANK: 0.2,
      SHORT_ANSWER: 0.2,
      ESSAY: 0.1,
      TRUE_FALSE: 0.1,
      MATCHING: 0.05,
      ORDERING: 0.05,
      MULTI_SELECT: 0.05,
    },
    bloomWeights: {
      REMEMBER: 0.1,
      UNDERSTAND: 0.15,
      APPLY: 0.35,
      ANALYZE: 0.2,
      EVALUATE: 0.1,
      CREATE: 0.1,
    },
    difficultyCurves: {
      ELEMENTARY: { EASY: 0.5, MEDIUM: 0.35, HARD: 0.15 },
      MIDDLE: { EASY: 0.3, MEDIUM: 0.45, HARD: 0.25 },
      HIGH: { EASY: 0.2, MEDIUM: 0.4, HARD: 0.4 },
    },
    examTypeConfigs: {
      final: {
        duration: [90, 150],
        marks: [80, 100],
        questions: [30, 60],
        passing: 0.5,
      },
      midterm: {
        duration: [60, 90],
        marks: [50, 80],
        questions: [20, 40],
        passing: 0.5,
      },
      chapter_test: {
        duration: [30, 60],
        marks: [30, 60],
        questions: [15, 30],
        passing: 0.5,
      },
      quiz: {
        duration: [10, 25],
        marks: [10, 30],
        questions: [5, 15],
        passing: 0.5,
      },
      practice: {
        duration: [20, 45],
        marks: [20, 50],
        questions: [10, 25],
        passing: 0,
      },
      diagnostic: {
        duration: [30, 60],
        marks: [30, 60],
        questions: [15, 30],
        passing: 0,
      },
    },
    classificationRules: [
      "math",
      "algebra",
      "geometry",
      "calculus",
      "statistics",
      "trigonometry",
    ],
  },
  {
    category: "STEM_SCIENCE",
    name: "STEM - Science",
    description: "Physics, chemistry, biology, earth science",
    questionTypeWeights: {
      MULTIPLE_CHOICE: 0.3,
      TRUE_FALSE: 0.1,
      SHORT_ANSWER: 0.2,
      ESSAY: 0.15,
      FILL_BLANK: 0.1,
      MATCHING: 0.1,
      ORDERING: 0.05,
    },
    bloomWeights: {
      REMEMBER: 0.15,
      UNDERSTAND: 0.2,
      APPLY: 0.25,
      ANALYZE: 0.2,
      EVALUATE: 0.1,
      CREATE: 0.1,
    },
    difficultyCurves: {
      ELEMENTARY: { EASY: 0.5, MEDIUM: 0.35, HARD: 0.15 },
      MIDDLE: { EASY: 0.3, MEDIUM: 0.45, HARD: 0.25 },
      HIGH: { EASY: 0.2, MEDIUM: 0.4, HARD: 0.4 },
    },
    examTypeConfigs: {
      final: {
        duration: [90, 150],
        marks: [80, 100],
        questions: [30, 50],
        passing: 0.5,
      },
      midterm: {
        duration: [60, 90],
        marks: [50, 80],
        questions: [20, 35],
        passing: 0.5,
      },
      chapter_test: {
        duration: [30, 60],
        marks: [30, 50],
        questions: [15, 25],
        passing: 0.5,
      },
      quiz: {
        duration: [10, 25],
        marks: [10, 30],
        questions: [5, 15],
        passing: 0.5,
      },
      practice: {
        duration: [20, 45],
        marks: [20, 50],
        questions: [10, 25],
        passing: 0,
      },
      diagnostic: {
        duration: [30, 60],
        marks: [30, 60],
        questions: [15, 30],
        passing: 0,
      },
    },
    classificationRules: [
      "physics",
      "chemistry",
      "biology",
      "science",
      "earth",
    ],
  },
  {
    category: "LANGUAGE_ARTS",
    name: "Language Arts",
    description: "English, Arabic, literature, grammar, writing",
    questionTypeWeights: {
      SHORT_ANSWER: 0.25,
      ESSAY: 0.25,
      MULTIPLE_CHOICE: 0.2,
      FILL_BLANK: 0.15,
      TRUE_FALSE: 0.05,
      MATCHING: 0.1,
    },
    bloomWeights: {
      REMEMBER: 0.1,
      UNDERSTAND: 0.2,
      APPLY: 0.15,
      ANALYZE: 0.25,
      EVALUATE: 0.2,
      CREATE: 0.1,
    },
    difficultyCurves: {
      ELEMENTARY: { EASY: 0.5, MEDIUM: 0.35, HARD: 0.15 },
      MIDDLE: { EASY: 0.3, MEDIUM: 0.45, HARD: 0.25 },
      HIGH: { EASY: 0.2, MEDIUM: 0.4, HARD: 0.4 },
    },
    examTypeConfigs: {
      final: {
        duration: [90, 120],
        marks: [80, 100],
        questions: [25, 45],
        passing: 0.5,
      },
      midterm: {
        duration: [60, 90],
        marks: [50, 80],
        questions: [15, 30],
        passing: 0.5,
      },
      chapter_test: {
        duration: [30, 60],
        marks: [30, 50],
        questions: [10, 20],
        passing: 0.5,
      },
      quiz: {
        duration: [10, 20],
        marks: [10, 25],
        questions: [5, 10],
        passing: 0.5,
      },
      practice: {
        duration: [20, 40],
        marks: [20, 40],
        questions: [8, 15],
        passing: 0,
      },
      diagnostic: {
        duration: [30, 60],
        marks: [30, 50],
        questions: [10, 20],
        passing: 0,
      },
    },
    classificationRules: [
      "english",
      "arabic",
      "language",
      "literature",
      "grammar",
      "writing",
    ],
  },
  {
    category: "SOCIAL_STUDIES",
    name: "Social Studies",
    description: "History, geography, civics, economics",
    questionTypeWeights: {
      MULTIPLE_CHOICE: 0.3,
      SHORT_ANSWER: 0.25,
      ESSAY: 0.2,
      TRUE_FALSE: 0.1,
      MATCHING: 0.1,
      FILL_BLANK: 0.05,
    },
    bloomWeights: {
      REMEMBER: 0.2,
      UNDERSTAND: 0.2,
      APPLY: 0.15,
      ANALYZE: 0.25,
      EVALUATE: 0.15,
      CREATE: 0.05,
    },
    difficultyCurves: {
      ELEMENTARY: { EASY: 0.5, MEDIUM: 0.35, HARD: 0.15 },
      MIDDLE: { EASY: 0.3, MEDIUM: 0.45, HARD: 0.25 },
      HIGH: { EASY: 0.2, MEDIUM: 0.4, HARD: 0.4 },
    },
    examTypeConfigs: {
      final: {
        duration: [90, 120],
        marks: [80, 100],
        questions: [30, 50],
        passing: 0.5,
      },
      midterm: {
        duration: [60, 90],
        marks: [50, 70],
        questions: [20, 35],
        passing: 0.5,
      },
      chapter_test: {
        duration: [30, 60],
        marks: [30, 50],
        questions: [15, 25],
        passing: 0.5,
      },
      quiz: {
        duration: [10, 20],
        marks: [10, 25],
        questions: [5, 12],
        passing: 0.5,
      },
      practice: {
        duration: [20, 40],
        marks: [20, 40],
        questions: [10, 20],
        passing: 0,
      },
      diagnostic: {
        duration: [30, 60],
        marks: [30, 50],
        questions: [15, 25],
        passing: 0,
      },
    },
    classificationRules: [
      "history",
      "geography",
      "civics",
      "economics",
      "social",
    ],
  },
  {
    category: "ARTS_HUMANITIES",
    name: "Arts & Humanities",
    description: "Art, music, philosophy, religious studies",
    questionTypeWeights: {
      ESSAY: 0.35,
      SHORT_ANSWER: 0.25,
      MULTIPLE_CHOICE: 0.2,
      MATCHING: 0.1,
      TRUE_FALSE: 0.1,
    },
    bloomWeights: {
      REMEMBER: 0.1,
      UNDERSTAND: 0.15,
      APPLY: 0.15,
      ANALYZE: 0.2,
      EVALUATE: 0.25,
      CREATE: 0.15,
    },
    difficultyCurves: {
      ELEMENTARY: { EASY: 0.5, MEDIUM: 0.35, HARD: 0.15 },
      MIDDLE: { EASY: 0.3, MEDIUM: 0.45, HARD: 0.25 },
      HIGH: { EASY: 0.2, MEDIUM: 0.4, HARD: 0.4 },
    },
    examTypeConfigs: {
      final: {
        duration: [60, 120],
        marks: [60, 100],
        questions: [15, 30],
        passing: 0.5,
      },
      midterm: {
        duration: [45, 90],
        marks: [40, 70],
        questions: [10, 25],
        passing: 0.5,
      },
      chapter_test: {
        duration: [30, 60],
        marks: [30, 50],
        questions: [10, 20],
        passing: 0.5,
      },
      quiz: {
        duration: [10, 20],
        marks: [10, 20],
        questions: [5, 10],
        passing: 0.5,
      },
      practice: {
        duration: [20, 40],
        marks: [20, 40],
        questions: [5, 15],
        passing: 0,
      },
      diagnostic: {
        duration: [30, 60],
        marks: [30, 50],
        questions: [10, 20],
        passing: 0,
      },
    },
    classificationRules: ["art", "music", "philosophy", "religion", "islamic"],
  },
  {
    category: "HEALTH_PE",
    name: "Health & Physical Education",
    description: "Physical education, health science, nutrition",
    questionTypeWeights: {
      MULTIPLE_CHOICE: 0.35,
      TRUE_FALSE: 0.2,
      SHORT_ANSWER: 0.2,
      MATCHING: 0.15,
      FILL_BLANK: 0.1,
    },
    bloomWeights: {
      REMEMBER: 0.25,
      UNDERSTAND: 0.25,
      APPLY: 0.25,
      ANALYZE: 0.15,
      EVALUATE: 0.05,
      CREATE: 0.05,
    },
    difficultyCurves: {
      ELEMENTARY: { EASY: 0.5, MEDIUM: 0.35, HARD: 0.15 },
      MIDDLE: { EASY: 0.35, MEDIUM: 0.4, HARD: 0.25 },
      HIGH: { EASY: 0.25, MEDIUM: 0.45, HARD: 0.3 },
    },
    examTypeConfigs: {
      final: {
        duration: [60, 90],
        marks: [60, 80],
        questions: [25, 40],
        passing: 0.5,
      },
      midterm: {
        duration: [45, 60],
        marks: [40, 60],
        questions: [15, 30],
        passing: 0.5,
      },
      chapter_test: {
        duration: [20, 40],
        marks: [20, 40],
        questions: [10, 20],
        passing: 0.5,
      },
      quiz: {
        duration: [10, 15],
        marks: [10, 20],
        questions: [5, 10],
        passing: 0.5,
      },
      practice: {
        duration: [15, 30],
        marks: [15, 30],
        questions: [8, 15],
        passing: 0,
      },
      diagnostic: {
        duration: [20, 40],
        marks: [20, 40],
        questions: [10, 20],
        passing: 0,
      },
    },
    classificationRules: ["health", "physical", "pe", "nutrition", "sport"],
  },
  {
    category: "PRACTICAL_SKILLS",
    name: "Practical Skills",
    description: "Technology, computer science, vocational subjects",
    questionTypeWeights: {
      MULTIPLE_CHOICE: 0.25,
      SHORT_ANSWER: 0.25,
      FILL_BLANK: 0.15,
      TRUE_FALSE: 0.1,
      ESSAY: 0.1,
      MATCHING: 0.1,
      ORDERING: 0.05,
    },
    bloomWeights: {
      REMEMBER: 0.1,
      UNDERSTAND: 0.15,
      APPLY: 0.35,
      ANALYZE: 0.2,
      EVALUATE: 0.1,
      CREATE: 0.1,
    },
    difficultyCurves: {
      ELEMENTARY: { EASY: 0.45, MEDIUM: 0.4, HARD: 0.15 },
      MIDDLE: { EASY: 0.3, MEDIUM: 0.45, HARD: 0.25 },
      HIGH: { EASY: 0.2, MEDIUM: 0.4, HARD: 0.4 },
    },
    examTypeConfigs: {
      final: {
        duration: [60, 120],
        marks: [60, 100],
        questions: [20, 40],
        passing: 0.5,
      },
      midterm: {
        duration: [45, 90],
        marks: [40, 70],
        questions: [15, 30],
        passing: 0.5,
      },
      chapter_test: {
        duration: [30, 60],
        marks: [30, 50],
        questions: [10, 25],
        passing: 0.5,
      },
      quiz: {
        duration: [10, 20],
        marks: [10, 25],
        questions: [5, 12],
        passing: 0.5,
      },
      practice: {
        duration: [20, 45],
        marks: [20, 50],
        questions: [10, 25],
        passing: 0,
      },
      diagnostic: {
        duration: [30, 60],
        marks: [30, 50],
        questions: [10, 25],
        passing: 0,
      },
    },
    classificationRules: [
      "computer",
      "technology",
      "ict",
      "programming",
      "vocational",
    ],
  },
  {
    category: "WORLD_LANGUAGES",
    name: "World Languages",
    description: "Foreign languages (French, Spanish, etc.)",
    questionTypeWeights: {
      MULTIPLE_CHOICE: 0.2,
      FILL_BLANK: 0.2,
      SHORT_ANSWER: 0.2,
      MATCHING: 0.15,
      ESSAY: 0.1,
      TRUE_FALSE: 0.1,
      ORDERING: 0.05,
    },
    bloomWeights: {
      REMEMBER: 0.2,
      UNDERSTAND: 0.2,
      APPLY: 0.3,
      ANALYZE: 0.15,
      EVALUATE: 0.1,
      CREATE: 0.05,
    },
    difficultyCurves: {
      ELEMENTARY: { EASY: 0.5, MEDIUM: 0.35, HARD: 0.15 },
      MIDDLE: { EASY: 0.3, MEDIUM: 0.45, HARD: 0.25 },
      HIGH: { EASY: 0.2, MEDIUM: 0.4, HARD: 0.4 },
    },
    examTypeConfigs: {
      final: {
        duration: [60, 120],
        marks: [60, 100],
        questions: [25, 45],
        passing: 0.5,
      },
      midterm: {
        duration: [45, 90],
        marks: [40, 70],
        questions: [15, 30],
        passing: 0.5,
      },
      chapter_test: {
        duration: [30, 60],
        marks: [30, 50],
        questions: [10, 20],
        passing: 0.5,
      },
      quiz: {
        duration: [10, 20],
        marks: [10, 25],
        questions: [5, 12],
        passing: 0.5,
      },
      practice: {
        duration: [20, 40],
        marks: [20, 40],
        questions: [8, 20],
        passing: 0,
      },
      diagnostic: {
        duration: [30, 60],
        marks: [30, 50],
        questions: [10, 25],
        passing: 0,
      },
    },
    classificationRules: [
      "french",
      "spanish",
      "german",
      "chinese",
      "japanese",
      "korean",
    ],
  },
]

// ============================================================================
// PAPER TEMPLATE DEFAULTS
// ============================================================================

const PAPER_TEMPLATES = [
  {
    name: "Classic Arabic",
    template: "CLASSIC",
    layout: "SINGLE_COLUMN",
    lang: "ar",
  },
  {
    name: "Classic English",
    template: "CLASSIC",
    layout: "SINGLE_COLUMN",
    lang: "en",
  },
  {
    name: "Modern Arabic",
    template: "MODERN",
    layout: "SINGLE_COLUMN",
    lang: "ar",
  },
  {
    name: "Modern English",
    template: "MODERN",
    layout: "SINGLE_COLUMN",
    lang: "en",
  },
  {
    name: "Formal Arabic",
    template: "FORMAL",
    layout: "SINGLE_COLUMN",
    lang: "ar",
  },
  {
    name: "Formal English",
    template: "FORMAL",
    layout: "SINGLE_COLUMN",
    lang: "en",
  },
  {
    name: "Two-Column Arabic",
    template: "CLASSIC",
    layout: "TWO_COLUMN",
    lang: "ar",
  },
  {
    name: "Two-Column English",
    template: "CLASSIC",
    layout: "TWO_COLUMN",
    lang: "en",
  },
]

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

export async function seedCatalogExamTemplates(prisma: PrismaClient) {
  console.log("\n--- Seed Catalog Exam Templates ---")

  // 1. Seed blueprints
  let blueprintCount = 0
  for (const bp of BLUEPRINT_CATEGORIES) {
    await prisma.catalogExamBlueprint.upsert({
      where: { category: bp.category },
      update: {
        name: bp.name,
        description: bp.description,
        questionTypeWeights: bp.questionTypeWeights,
        bloomWeights: bp.bloomWeights,
        difficultyCurves: bp.difficultyCurves,
        examTypeConfigs: bp.examTypeConfigs,
        classificationRules: bp.classificationRules,
      },
      create: {
        category: bp.category,
        name: bp.name,
        description: bp.description,
        questionTypeWeights: bp.questionTypeWeights,
        bloomWeights: bp.bloomWeights,
        difficultyCurves: bp.difficultyCurves,
        examTypeConfigs: bp.examTypeConfigs,
        classificationRules: bp.classificationRules,
      },
    })
    blueprintCount++
  }
  console.log(`  Created/updated ${blueprintCount} blueprints`)

  // 2. Seed exam templates (2 per published subject)
  const subjects = await prisma.catalogSubject.findMany({
    where: { status: "PUBLISHED" },
    select: { id: true, name: true, levels: true },
  })

  let templateCount = 0
  for (const subject of subjects) {
    for (const examType of ["midterm", "final"] as const) {
      const config = BLUEPRINT_CATEGORIES[0].examTypeConfigs[examType]
      const duration = Math.round((config.duration[0] + config.duration[1]) / 2)
      const marks = Math.round((config.marks[0] + config.marks[1]) / 2)
      const totalQ = Math.round((config.questions[0] + config.questions[1]) / 2)

      // Build a simple balanced distribution
      const distribution = {
        MULTIPLE_CHOICE: {
          EASY: Math.ceil(totalQ * 0.15),
          MEDIUM: Math.ceil(totalQ * 0.15),
        },
        SHORT_ANSWER: {
          MEDIUM: Math.ceil(totalQ * 0.15),
          HARD: Math.ceil(totalQ * 0.1),
        },
        TRUE_FALSE: { EASY: Math.ceil(totalQ * 0.1) },
        ESSAY: {
          MEDIUM: Math.ceil(totalQ * 0.1),
          HARD: Math.ceil(totalQ * 0.05),
        },
      }

      await prisma.catalogExamTemplate.upsert({
        where: {
          id: `tpl-${subject.id}-${examType}`.slice(0, 25),
        },
        update: {},
        create: {
          id: `tpl-${subject.id}-${examType}`.slice(0, 25),
          catalogSubjectId: subject.id,
          name: `${subject.name} - ${examType === "midterm" ? "Midterm" : "Final"} Template`,
          examType,
          duration,
          totalMarks: marks,
          distribution,
          levels: subject.levels,
          approvalStatus: "APPROVED",
          visibility: "PUBLIC",
          status: "PUBLISHED",
        },
      })
      templateCount++
    }
  }
  console.log(`  Created ${templateCount} exam templates`)

  // 3. Seed paper templates
  let paperCount = 0
  for (const pt of PAPER_TEMPLATES) {
    const existing = await prisma.catalogPaperTemplate.findFirst({
      where: { name: pt.name },
    })
    if (!existing) {
      await prisma.catalogPaperTemplate.create({
        data: {
          name: pt.name,
          template: pt.template,
          layout: pt.layout,
          lang: pt.lang,
          approvalStatus: "APPROVED",
          visibility: "PUBLIC",
          status: "PUBLISHED",
        },
      })
      paperCount++
    }
  }
  console.log(`  Created ${paperCount} paper templates`)

  console.log("  Catalog exam templates seed complete")
}

// Direct execution
if (require.main === module) {
  const { PrismaClient } = require("@prisma/client")
  const _prisma = new PrismaClient()
  seedCatalogExamTemplates(_prisma)
    .then(() => _prisma.$disconnect())
    .catch((e: unknown) => {
      console.error(e)
      _prisma.$disconnect()
      process.exit(1)
    })
}
