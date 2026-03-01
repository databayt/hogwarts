// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Catalog Content Seed (Optimized for ClickView K-12 62 Subjects)
 *
 * Seeds 4 content types with subject-aware exam blueprints:
 * - CatalogMaterial (subject + chapter level)
 * - CatalogExam (subject + chapter + lesson level) with proper distribution JSON
 * - CatalogQuestion (subject + chapter + ALL lessons) with category-specific text
 * - CatalogAssignment (lesson-level)
 *
 * Key optimizations over previous version:
 * 1. Subject-aware question distributions (STEM vs Humanities vs Languages)
 * 2. Bloom's taxonomy alignment per subject category
 * 3. Difficulty curves by school level (Elementary=easy-heavy, High=balanced)
 * 4. Rich distribution JSON on every CatalogExam (not null)
 * 5. Full lesson coverage (ALL lessons, not just first 3 per chapter)
 * 6. More exam types: midterm, practice, diagnostic (not just final/test/quiz)
 * 7. Category-specific MCQ options (not generic "Wrong answer A/B/C")
 * 8. 10 question templates per category (80 total) cycling by index
 *
 * Scale: ~62 subjects -> ~1600 exams -> ~8000 questions -> ~1000 assignments
 *
 * Usage: pnpm db:seed:single catalog-content
 */

import type { PrismaClient } from "@prisma/client"

import {
  buildBloomDistribution,
  buildDistribution,
  CHAPTER_LEVEL_EXAM_TYPES,
  extractSchoolLevel,
  generateQuestionText,
  getBloomFromTemplate,
  getExamTypeConfig,
  getMcqOptions,
  getSubjectCategory,
  LESSON_LEVEL_EXAM_TYPES,
  QUESTIONS_PER_CHAPTER,
  QUESTIONS_PER_LESSON,
  QUESTIONS_PER_SUBJECT,
  SUBJECT_LEVEL_EXAM_TYPES,
  type ExamType,
  type SubjectCategory,
} from "./exam-blueprints"
import { logSuccess, randomNumber } from "./utils"

// ============================================================================
// TYPES
// ============================================================================

interface SubjectWithContent {
  id: string
  name: string
  slug: string
  chapters: {
    id: string
    name: string
    slug: string
    lessons: {
      id: string
      name: string
      slug: string
    }[]
  }[]
}

// ============================================================================
// CONSTANTS
// ============================================================================

const QUESTION_TYPES = [
  "MULTIPLE_CHOICE",
  "TRUE_FALSE",
  "SHORT_ANSWER",
  "ESSAY",
  "FILL_BLANK",
  "MATCHING",
  "ORDERING",
  "MULTI_SELECT",
] as const

const DIFFICULTIES = ["EASY", "MEDIUM", "HARD"] as const

// ============================================================================
// HELPERS
// ============================================================================

/** Seeded pseudo-random for deterministic output */
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

/** Pick a random value in range using seed */
function seededRange(min: number, max: number, seed: number): number {
  return Math.floor(seededRandom(seed) * (max - min + 1)) + min
}

/** Cycle through question types deterministically */
function cycleQuestionType(index: number): (typeof QUESTION_TYPES)[number] {
  return QUESTION_TYPES[index % QUESTION_TYPES.length]
}

/** Points by difficulty */
function pointsForDifficulty(diff: string): number {
  return diff === "EASY" ? 1 : diff === "MEDIUM" ? 2 : 3
}

/** Build question data for a given scope */
function buildQuestion(
  category: SubjectCategory,
  topicName: string,
  chapterName: string,
  difficulty: (typeof DIFFICULTIES)[number],
  globalIdx: number,
  scopeIds: {
    catalogSubjectId?: string
    catalogChapterId?: string
    catalogLessonId?: string
  }
): Record<string, unknown> {
  const qType = cycleQuestionType(globalIdx)
  const bloomLevel = getBloomFromTemplate(category, globalIdx)
  const questionText = generateQuestionText(
    category,
    topicName,
    chapterName,
    difficulty,
    globalIdx
  )

  const isObjective =
    qType === "MULTIPLE_CHOICE" ||
    qType === "TRUE_FALSE" ||
    qType === "MULTI_SELECT"

  return {
    ...scopeIds,
    questionText,
    questionType: qType,
    difficulty,
    bloomLevel,
    points: pointsForDifficulty(difficulty),
    options: isObjective ? getMcqOptions(category, topicName) : undefined,
    sampleAnswer:
      qType === "SHORT_ANSWER" || qType === "ESSAY"
        ? `Sample answer demonstrating understanding of ${topicName} at ${difficulty.toLowerCase()} level.`
        : undefined,
    explanation: `This question tests ${bloomLevel.toLowerCase()}-level thinking about ${topicName}.`,
    approvalStatus: "APPROVED",
    visibility: "PUBLIC",
    status: "PUBLISHED",
    usageCount: randomNumber(5, 200),
  }
}

/** Build exam data with proper distribution JSON */
function buildExam(
  subjectId: string,
  category: SubjectCategory,
  level: "elementary" | "middle" | "high",
  examType: ExamType,
  title: string,
  description: string,
  seed: number,
  scopeIds: { chapterId?: string; lessonId?: string }
): Record<string, unknown> {
  const config = getExamTypeConfig(examType)
  const totalQuestions = seededRange(
    config.questionCountRange[0],
    config.questionCountRange[1],
    seed
  )
  const duration = seededRange(
    config.durationRange[0],
    config.durationRange[1],
    seed + 1
  )
  const totalMarks = seededRange(
    config.totalMarksRange[0],
    config.totalMarksRange[1],
    seed + 2
  )
  const passingMarks =
    config.passingPercent > 0
      ? Math.round(totalMarks * (config.passingPercent / 100))
      : null

  const distribution = buildDistribution(totalQuestions, category, level)
  const bloomDistribution = buildBloomDistribution(totalQuestions, category)

  return {
    subjectId,
    ...scopeIds,
    title,
    description,
    lang: "en",
    examType,
    durationMinutes: duration,
    totalMarks,
    passingMarks,
    totalQuestions,
    distribution,
    questions: { bloomDistribution },
    status: "PUBLISHED",
    usageCount: randomNumber(10, 300),
  }
}

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

export async function seedCatalogContent(prisma: PrismaClient): Promise<void> {
  // 1. Fetch all published catalog subjects with chapters + lessons
  const subjects: SubjectWithContent[] = await prisma.catalogSubject.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      chapters: {
        where: { status: "PUBLISHED" },
        orderBy: { sequenceOrder: "asc" },
        select: {
          id: true,
          name: true,
          slug: true,
          lessons: {
            where: { status: "PUBLISHED" },
            orderBy: { sequenceOrder: "asc" },
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
    },
  })

  if (subjects.length === 0) {
    console.log(
      "   No catalog subjects found. Run clickview-catalog seed first."
    )
    return
  }

  console.log(`   Found ${subjects.length} subjects`)

  // 2. Build all records in memory
  const materials: Record<string, unknown>[] = []
  const exams: Record<string, unknown>[] = []
  const questions: Record<string, unknown>[] = []
  const assignments: Record<string, unknown>[] = []

  let globalIdx = 0

  for (let si = 0; si < subjects.length; si++) {
    const subject = subjects[si]
    const category = getSubjectCategory(subject.name)
    const level = extractSchoolLevel(subject.slug)

    // --- Subject-level materials (3: textbook + syllabus + reference) ---
    materials.push({
      catalogSubjectId: subject.id,
      title: `${subject.name} - Textbook`,
      description: `Complete textbook for ${subject.name}`,
      lang: "en",
      type: "TEXTBOOK",
      fileSize: randomNumber(5_000_000, 50_000_000),
      mimeType: "application/pdf",
      pageCount: randomNumber(150, 500),
      status: "PUBLISHED",
      approvalStatus: "APPROVED",
      visibility: "PUBLIC",
      downloadCount: randomNumber(50, 500),
      usageCount: randomNumber(100, 1000),
    })
    materials.push({
      catalogSubjectId: subject.id,
      title: `${subject.name} - Syllabus`,
      description: `Course syllabus and outline for ${subject.name}`,
      lang: "en",
      type: "SYLLABUS",
      fileSize: randomNumber(500_000, 2_000_000),
      mimeType: "application/pdf",
      pageCount: randomNumber(5, 20),
      status: "PUBLISHED",
      approvalStatus: "APPROVED",
      visibility: "PUBLIC",
      downloadCount: randomNumber(100, 500),
      usageCount: randomNumber(200, 800),
    })
    materials.push({
      catalogSubjectId: subject.id,
      title: `${subject.name} - Reference Sheet`,
      description: `Quick reference guide and formula sheet for ${subject.name}`,
      lang: "en",
      type: "REFERENCE",
      fileSize: randomNumber(200_000, 1_000_000),
      mimeType: "application/pdf",
      pageCount: randomNumber(2, 10),
      status: "PUBLISHED",
      approvalStatus: "APPROVED",
      visibility: "PUBLIC",
      downloadCount: randomNumber(80, 600),
      usageCount: randomNumber(150, 900),
    })

    // --- Subject-level exams (final + midterm) ---
    for (const examType of SUBJECT_LEVEL_EXAM_TYPES) {
      const seed = si * 1000 + (examType === "final" ? 0 : 500)
      exams.push(
        buildExam(
          subject.id,
          category,
          level,
          examType,
          `${subject.name} - ${examType === "final" ? "Final Exam" : "Midterm Exam"}`,
          `${examType === "final" ? "Comprehensive final" : "Mid-semester"} examination for ${subject.name}`,
          seed,
          {}
        )
      )
    }

    // --- Subject-level questions (10 per subject, spread across difficulties) ---
    for (let q = 0; q < QUESTIONS_PER_SUBJECT; q++) {
      const diff = DIFFICULTIES[q % DIFFICULTIES.length]
      questions.push(
        buildQuestion(category, subject.name, subject.name, diff, globalIdx, {
          catalogSubjectId: subject.id,
        })
      )
      globalIdx++
    }

    // --- Chapter level ---
    for (let ci = 0; ci < subject.chapters.length; ci++) {
      const chapter = subject.chapters[ci]

      // Chapter materials (2: study guide + project)
      materials.push({
        catalogChapterId: chapter.id,
        title: `${chapter.name} - Study Guide`,
        description: `Study guide for ${chapter.name}`,
        lang: "en",
        type: "STUDY_GUIDE",
        fileSize: randomNumber(500_000, 5_000_000),
        mimeType: "application/pdf",
        pageCount: randomNumber(10, 40),
        status: "PUBLISHED",
        approvalStatus: "APPROVED",
        visibility: "PUBLIC",
        downloadCount: randomNumber(10, 200),
        usageCount: randomNumber(20, 400),
      })
      // ~40% of chapters get a project brief
      if (seededRandom(si * 100 + ci) > 0.6) {
        materials.push({
          catalogChapterId: chapter.id,
          title: `${chapter.name} - Project`,
          description: `Multi-lesson project brief for ${chapter.name}`,
          lang: "en",
          type: "PROJECT",
          fileSize: randomNumber(300_000, 2_000_000),
          mimeType: "application/pdf",
          pageCount: randomNumber(3, 12),
          status: "PUBLISHED",
          approvalStatus: "APPROVED",
          visibility: "PUBLIC",
          downloadCount: randomNumber(5, 100),
          usageCount: randomNumber(10, 200),
        })
      }

      // Chapter exams (chapter_test + practice)
      for (const examType of CHAPTER_LEVEL_EXAM_TYPES) {
        const seed =
          si * 10000 + ci * 100 + (examType === "chapter_test" ? 0 : 50)
        exams.push(
          buildExam(
            subject.id,
            category,
            level,
            examType,
            `${chapter.name} - ${examType === "chapter_test" ? "Chapter Test" : "Practice Test"}`,
            `${examType === "chapter_test" ? "Assessment" : "Practice"} for ${chapter.name}`,
            seed,
            { chapterId: chapter.id }
          )
        )
      }

      // Chapter questions (6 per chapter: 2 per difficulty)
      for (let q = 0; q < QUESTIONS_PER_CHAPTER; q++) {
        const diff = DIFFICULTIES[q % DIFFICULTIES.length]
        questions.push(
          buildQuestion(category, chapter.name, chapter.name, diff, globalIdx, {
            catalogChapterId: chapter.id,
          })
        )
        globalIdx++
      }

      // --- Lesson level (ALL lessons, not just first 3) ---
      for (let li = 0; li < chapter.lessons.length; li++) {
        const lesson = chapter.lessons[li]
        const lessonSeed = si * 100000 + ci * 1000 + li

        // Lesson exams (quiz + diagnostic)
        for (const examType of LESSON_LEVEL_EXAM_TYPES) {
          const seed = lessonSeed + (examType === "quiz" ? 0 : 500)
          exams.push(
            buildExam(
              subject.id,
              category,
              level,
              examType,
              `${lesson.name} - ${examType === "quiz" ? "Quiz" : "Diagnostic"}`,
              `${examType === "quiz" ? "Quick quiz" : "Diagnostic assessment"} for ${lesson.name}`,
              seed,
              { chapterId: chapter.id, lessonId: lesson.id }
            )
          )
        }

        // Lesson questions (4 per lesson: spread across difficulties + 1 extra)
        for (let q = 0; q < QUESTIONS_PER_LESSON; q++) {
          const diff = DIFFICULTIES[q % DIFFICULTIES.length]
          questions.push(
            buildQuestion(
              category,
              lesson.name,
              chapter.name,
              diff,
              globalIdx,
              { catalogLessonId: lesson.id }
            )
          )
          globalIdx++
        }

        // Lesson materials (varies per lesson — worksheet + presentation always, others probabilistic)
        materials.push({
          catalogLessonId: lesson.id,
          title: `${lesson.name} - Worksheet`,
          description: `Practice exercises for ${lesson.name}`,
          lang: "en",
          type: "WORKSHEET",
          fileSize: randomNumber(100_000, 1_000_000),
          mimeType: "application/pdf",
          pageCount: randomNumber(2, 8),
          status: "PUBLISHED",
          approvalStatus: "APPROVED",
          visibility: "PUBLIC",
          downloadCount: randomNumber(20, 300),
          usageCount: randomNumber(30, 500),
        })
        materials.push({
          catalogLessonId: lesson.id,
          title: `${lesson.name} - Slides`,
          description: `Presentation slides for ${lesson.name}`,
          lang: "en",
          type: "PRESENTATION",
          fileSize: randomNumber(2_000_000, 15_000_000),
          mimeType: "application/pdf",
          pageCount: randomNumber(10, 35),
          status: "PUBLISHED",
          approvalStatus: "APPROVED",
          visibility: "PUBLIC",
          downloadCount: randomNumber(30, 400),
          usageCount: randomNumber(50, 600),
        })
        // ~60% of lessons get notes
        if (seededRandom(lessonSeed + 1) > 0.4) {
          materials.push({
            catalogLessonId: lesson.id,
            title: `${lesson.name} - Notes`,
            description: `Class handout and notes for ${lesson.name}`,
            lang: "en",
            type: "LESSON_NOTES",
            fileSize: randomNumber(100_000, 2_000_000),
            mimeType: "application/pdf",
            pageCount: randomNumber(2, 12),
            status: "PUBLISHED",
            approvalStatus: "APPROVED",
            visibility: "PUBLIC",
            downloadCount: randomNumber(15, 250),
            usageCount: randomNumber(20, 350),
          })
        }
        // ~30% of lessons get a video guide
        if (seededRandom(lessonSeed + 2) > 0.7) {
          materials.push({
            catalogLessonId: lesson.id,
            title: `${lesson.name} - Video Guide`,
            description: `Instructional video for ${lesson.name}`,
            lang: "en",
            type: "VIDEO_GUIDE",
            externalUrl: `https://example.com/videos/${lesson.id}`,
            status: "PUBLISHED",
            approvalStatus: "APPROVED",
            visibility: "PUBLIC",
            downloadCount: randomNumber(10, 150),
            usageCount: randomNumber(30, 300),
          })
        }
        // ~20% of lessons (science-heavy) get a lab manual
        if (
          seededRandom(lessonSeed + 3) > 0.8 &&
          (category === "STEM_SCIENCE" || category === "STEM_MATH")
        ) {
          materials.push({
            catalogLessonId: lesson.id,
            title: `${lesson.name} - Lab Manual`,
            description: `Step-by-step lab procedure for ${lesson.name}`,
            lang: "en",
            type: "LAB_MANUAL",
            fileSize: randomNumber(500_000, 3_000_000),
            mimeType: "application/pdf",
            pageCount: randomNumber(4, 15),
            status: "PUBLISHED",
            approvalStatus: "APPROVED",
            visibility: "PUBLIC",
            downloadCount: randomNumber(5, 100),
            usageCount: randomNumber(10, 150),
          })
        }

        // Assignment (1 per lesson: homework or project)
        const isProject = seededRandom(lessonSeed) > 0.8
        assignments.push({
          catalogLessonId: lesson.id,
          title: `${lesson.name} - ${isProject ? "Project" : "Homework"}`,
          description: `${isProject ? "Project" : "Homework"} assignment for ${lesson.name}`,
          lang: "en",
          instructions: `Complete all tasks related to ${lesson.name}. Show your work.`,
          assignmentType: isProject ? "project" : "homework",
          totalPoints: randomNumber(10, 100),
          estimatedTime: randomNumber(30, 120),
          status: "PUBLISHED",
          approvalStatus: "APPROVED",
          visibility: "PUBLIC",
          usageCount: randomNumber(10, 150),
        })
      }
    }
  }

  // 3. Batch insert
  console.log(`   Inserting ${materials.length} materials...`)
  const materialResult = await prisma.catalogMaterial.createMany({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: materials as any,
    skipDuplicates: true,
  })
  logSuccess("Materials", materialResult.count)

  console.log(`   Inserting ${exams.length} exams...`)
  const examResult = await prisma.catalogExam.createMany({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: exams as any,
    skipDuplicates: true,
  })
  logSuccess("Exams", examResult.count)

  console.log(`   Inserting ${questions.length} questions...`)
  const questionResult = await prisma.catalogQuestion.createMany({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: questions as any,
    skipDuplicates: true,
  })
  logSuccess("Questions", questionResult.count)

  console.log(`   Inserting ${assignments.length} assignments...`)
  const assignmentResult = await prisma.catalogAssignment.createMany({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: assignments as any,
    skipDuplicates: true,
  })
  logSuccess("Assignments", assignmentResult.count)

  // 3b. Create CatalogExamQuestion junction records
  // Link each exam to questions in its scope (subject/chapter/lesson)
  console.log(`   Creating CatalogExamQuestion junction records...`)
  const createdExams = await prisma.catalogExam.findMany({
    select: {
      id: true,
      subjectId: true,
      chapterId: true,
      lessonId: true,
      totalQuestions: true,
    },
    orderBy: { createdAt: "desc" },
    take: exams.length,
  })

  let junctionCount = 0
  const JUNCTION_BATCH_SIZE = 500
  const junctionBatch: {
    catalogExamId: string
    catalogQuestionId: string
    order: number
    points: number
  }[] = []

  for (const exam of createdExams) {
    // Find questions in the same scope
    const scopeWhere: Record<string, unknown> = {}
    if (exam.lessonId) {
      scopeWhere.catalogLessonId = exam.lessonId
    } else if (exam.chapterId) {
      scopeWhere.catalogChapterId = exam.chapterId
    } else if (exam.subjectId) {
      scopeWhere.catalogSubjectId = exam.subjectId
    } else {
      continue
    }

    const scopeQuestions = await prisma.catalogQuestion.findMany({
      where: scopeWhere,
      select: { id: true, points: true },
      take: exam.totalQuestions || 10,
    })

    for (let i = 0; i < scopeQuestions.length; i++) {
      junctionBatch.push({
        catalogExamId: exam.id,
        catalogQuestionId: scopeQuestions[i].id,
        order: i + 1,
        points: Number(scopeQuestions[i].points) || 1,
      })
    }

    // Flush batch periodically
    if (junctionBatch.length >= JUNCTION_BATCH_SIZE) {
      const result = await prisma.catalogExamQuestion.createMany({
        data: junctionBatch,
        skipDuplicates: true,
      })
      junctionCount += result.count
      junctionBatch.length = 0
    }
  }

  // Flush remaining
  if (junctionBatch.length > 0) {
    const result = await prisma.catalogExamQuestion.createMany({
      data: junctionBatch,
      skipDuplicates: true,
    })
    junctionCount += result.count
  }
  logSuccess("ExamQuestions (junction)", junctionCount)

  // 4. Summary with category breakdown
  const categoryBreakdown = new Map<string, number>()
  for (const subject of subjects) {
    const cat = getSubjectCategory(subject.name)
    categoryBreakdown.set(cat, (categoryBreakdown.get(cat) || 0) + 1)
  }

  console.log(`\n   Summary:`)
  console.log(`   - Materials:       ${materialResult.count}`)
  console.log(`   - Exams:           ${examResult.count}`)
  console.log(`   - Questions:       ${questionResult.count}`)
  console.log(`   - ExamQuestions:   ${junctionCount}`)
  console.log(`   - Assignments:     ${assignmentResult.count}`)
  console.log(
    `   - Total:           ${materialResult.count + examResult.count + questionResult.count + junctionCount + assignmentResult.count}`
  )
  console.log(`\n   Category breakdown:`)
  categoryBreakdown.forEach((count, cat) => {
    console.log(`   - ${cat}: ${count} subjects`)
  })
  console.log(`   - Videos:      Use 'pnpm seed:videos' for real HD videos`)
}
