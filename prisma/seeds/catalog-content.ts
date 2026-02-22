/**
 * Catalog Content Seed
 *
 * Seeds 5 content types for all ClickView catalog subjects:
 * - LessonVideo (lesson-level, ~600)
 * - CatalogMaterial (subject + chapter + lesson level, ~325)
 * - CatalogExam (subject + chapter + lesson level, ~863)
 * - CatalogQuestion (subject + chapter + lesson level, ~2600)
 * - CatalogAssignment (lesson-level, ~600)
 *
 * Usage: pnpm db:seed:single catalog-content
 */

import type { PrismaClient } from "@prisma/client"

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

const YOUTUBE_IDS = [
  "dQw4w9WgXcQ",
  "9bZkp7q19f0",
  "kJQP7kiw5Fk",
  "JGwWNGJdvx8",
  "RgKAFK5djSk",
  "OPf0YbXqDm0",
  "CevxZvSJLk8",
  "hT_nvWreIhg",
  "fJ9rUzIMcZQ",
  "60ItHLz5WEA",
]

const BLOOM_LEVELS = [
  "REMEMBER",
  "UNDERSTAND",
  "APPLY",
  "ANALYZE",
  "EVALUATE",
  "CREATE",
] as const

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

function pickYoutubeId(index: number): string {
  return YOUTUBE_IDS[index % YOUTUBE_IDS.length]
}

function mcqOptions(topic: string): object[] {
  return [
    { label: `Correct answer for ${topic}`, isCorrect: true },
    { label: `Wrong answer A`, isCorrect: false },
    { label: `Wrong answer B`, isCorrect: false },
    { label: `Wrong answer C`, isCorrect: false },
  ]
}

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

export async function seedCatalogContent(prisma: PrismaClient): Promise<void> {
  // 1. Resolve users + demo school for multi-creator videos
  const [devUser, teacherUser, demoSchool] = await Promise.all([
    prisma.user.findFirst({
      where: { email: "dev@databayt.org" },
      select: { id: true },
    }),
    prisma.user.findFirst({
      where: { email: "teacher@databayt.org" },
      select: { id: true },
    }),
    prisma.school.findFirst({
      where: { domain: "demo" },
      select: { id: true },
    }),
  ])
  if (!devUser) {
    throw new Error("dev@databayt.org not found. Run auth seed first.")
  }
  const userId = devUser.id
  const teacherUserId = teacherUser?.id ?? null
  const demoSchoolId = demoSchool?.id ?? null

  // 2. Fetch all published catalog subjects with chapters + lessons
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

  // 3. Build all records in memory
  const videos: Parameters<typeof prisma.lessonVideo.createMany>[0]["data"] = []
  const materials: Parameters<
    typeof prisma.catalogMaterial.createMany
  >[0]["data"] = []
  const exams: Parameters<typeof prisma.catalogExam.createMany>[0]["data"] = []
  const questions: Parameters<
    typeof prisma.catalogQuestion.createMany
  >[0]["data"] = []
  const assignments: Parameters<
    typeof prisma.catalogAssignment.createMany
  >[0]["data"] = []

  let globalIdx = 0

  for (let si = 0; si < subjects.length; si++) {
    const subject = subjects[si]
    const isFeaturedSubject = si // use subject index for featured video pick

    // --- Subject-level materials (2: textbook + syllabus) ---
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

    // --- Subject-level exam (1: final) ---
    const finalQCount = randomNumber(30, 50)
    exams.push({
      subjectId: subject.id,
      title: `${subject.name} - Final Exam`,
      description: `Comprehensive final examination for ${subject.name}`,
      lang: "en",
      examType: "final",
      durationMinutes: randomNumber(90, 120),
      totalMarks: randomNumber(80, 100),
      passingMarks: randomNumber(40, 50),
      totalQuestions: finalQCount,
      status: "PUBLISHED",
      usageCount: randomNumber(50, 300),
    })

    // --- Subject-level questions (6: 2 per difficulty) ---
    for (const diff of DIFFICULTIES) {
      for (let q = 0; q < 2; q++) {
        const qType = QUESTION_TYPES[globalIdx % QUESTION_TYPES.length]
        const bloom = BLOOM_LEVELS[globalIdx % BLOOM_LEVELS.length]
        questions.push({
          catalogSubjectId: subject.id,
          questionText: `${subject.name} ${diff.toLowerCase()} question ${q + 1}: What is a key concept in this subject?`,
          questionType: qType,
          difficulty: diff,
          bloomLevel: bloom,
          points: diff === "EASY" ? 1 : diff === "MEDIUM" ? 2 : 3,
          options:
            qType === "MULTIPLE_CHOICE" ? mcqOptions(subject.name) : null,
          sampleAnswer: `Sample answer for ${subject.name} question`,
          explanation: `This tests understanding of ${subject.name} at ${diff.toLowerCase()} level.`,
          approvalStatus: "APPROVED",
          visibility: "PUBLIC",
          status: "PUBLISHED",
          usageCount: randomNumber(10, 200),
        })
        globalIdx++
      }
    }

    // --- Chapter level ---
    for (let ci = 0; ci < subject.chapters.length; ci++) {
      const chapter = subject.chapters[ci]

      // Chapter material (1: study guide)
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

      // Chapter exam (1: chapter_test)
      const chQCount = randomNumber(15, 30)
      exams.push({
        subjectId: subject.id,
        chapterId: chapter.id,
        title: `${chapter.name} - Chapter Test`,
        description: `Assessment for ${chapter.name}`,
        lang: "en",
        examType: "chapter_test",
        durationMinutes: randomNumber(30, 60),
        totalMarks: randomNumber(40, 70),
        passingMarks: randomNumber(20, 35),
        totalQuestions: chQCount,
        status: "PUBLISHED",
        usageCount: randomNumber(20, 150),
      })

      // Chapter questions (3: 1 per difficulty)
      for (const diff of DIFFICULTIES) {
        const qType = QUESTION_TYPES[globalIdx % QUESTION_TYPES.length]
        const bloom = BLOOM_LEVELS[globalIdx % BLOOM_LEVELS.length]
        questions.push({
          catalogChapterId: chapter.id,
          questionText: `${chapter.name} (${diff.toLowerCase()}): Explain a concept from this chapter.`,
          questionType: qType,
          difficulty: diff,
          bloomLevel: bloom,
          points: diff === "EASY" ? 1 : diff === "MEDIUM" ? 2 : 3,
          options:
            qType === "MULTIPLE_CHOICE" ? mcqOptions(chapter.name) : null,
          sampleAnswer: `Sample answer for ${chapter.name}`,
          explanation: `This tests ${chapter.name} knowledge at ${diff.toLowerCase()} level.`,
          approvalStatus: "APPROVED",
          visibility: "PUBLIC",
          status: "PUBLISHED",
          usageCount: randomNumber(5, 100),
        })
        globalIdx++
      }

      // --- Lesson level (first 3 lessons per chapter) ---
      const lessonSlice = chapter.lessons.slice(0, 3)
      for (let li = 0; li < lessonSlice.length; li++) {
        const lesson = lessonSlice[li]
        const lessonSeed = si * 1000 + ci * 100 + li

        // Video (1 per lesson) — ~70% platform, ~30% school contributor
        const duration = randomNumber(300, 1800)
        const viewCount = randomNumber(100, 5000)
        const isFeatured = li === 0 && ci === 0 // first lesson of first chapter = featured
        const isSchoolVideo =
          teacherUserId && demoSchoolId && seededRandom(lessonSeed + 42) < 0.3

        videos.push({
          catalogLessonId: lesson.id,
          userId: isSchoolVideo ? teacherUserId : userId,
          schoolId: isSchoolVideo ? demoSchoolId : null,
          title: `${lesson.name} - Introduction`,
          description: `Video lesson covering ${lesson.name}`,
          lang: "en",
          videoUrl: `https://www.youtube.com/watch?v=${pickYoutubeId(lessonSeed)}`,
          durationSeconds: duration,
          provider: "youtube",
          externalId: pickYoutubeId(lessonSeed),
          visibility: isSchoolVideo ? "SCHOOL" : "PUBLIC",
          approvalStatus: "APPROVED",
          viewCount,
          isFeatured: isSchoolVideo ? false : isFeatured,
        })

        // Lesson exam (1: quiz)
        const quizQCount = randomNumber(5, 15)
        exams.push({
          subjectId: subject.id,
          chapterId: chapter.id,
          lessonId: lesson.id,
          title: `${lesson.name} - Quiz`,
          description: `Quick quiz for ${lesson.name}`,
          lang: "en",
          examType: "quiz",
          durationMinutes: randomNumber(10, 20),
          totalMarks: randomNumber(10, 30),
          passingMarks: randomNumber(5, 15),
          totalQuestions: quizQCount,
          status: "PUBLISHED",
          usageCount: randomNumber(10, 100),
        })

        // Lesson questions (3: 1 per difficulty)
        for (const diff of DIFFICULTIES) {
          const qType = QUESTION_TYPES[globalIdx % QUESTION_TYPES.length]
          const bloom = BLOOM_LEVELS[globalIdx % BLOOM_LEVELS.length]
          questions.push({
            catalogLessonId: lesson.id,
            questionText: `${lesson.name} (${diff.toLowerCase()}): What is the main takeaway from this lesson?`,
            questionType: qType,
            difficulty: diff,
            bloomLevel: bloom,
            points: diff === "EASY" ? 1 : diff === "MEDIUM" ? 2 : 3,
            options:
              qType === "MULTIPLE_CHOICE" ? mcqOptions(lesson.name) : null,
            sampleAnswer: `Sample answer for ${lesson.name}`,
            explanation: `This covers ${lesson.name} at ${diff.toLowerCase()} difficulty.`,
            approvalStatus: "APPROVED",
            visibility: "PUBLIC",
            status: "PUBLISHED",
            usageCount: randomNumber(5, 80),
          })
          globalIdx++
        }

        // Assignment (1: homework)
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

  // 4. Batch insert (5 createMany calls)
  console.log(`   Inserting ${videos.length} videos...`)
  const videoResult = await prisma.lessonVideo.createMany({
    data: videos,
    skipDuplicates: true,
  })
  logSuccess("Videos", videoResult.count)

  console.log(`   Inserting ${materials.length} materials...`)
  const materialResult = await prisma.catalogMaterial.createMany({
    data: materials,
    skipDuplicates: true,
  })
  logSuccess("Materials", materialResult.count)

  console.log(`   Inserting ${exams.length} exams...`)
  const examResult = await prisma.catalogExam.createMany({
    data: exams,
    skipDuplicates: true,
  })
  logSuccess("Exams", examResult.count)

  console.log(`   Inserting ${questions.length} questions...`)
  const questionResult = await prisma.catalogQuestion.createMany({
    data: questions,
    skipDuplicates: true,
  })
  logSuccess("Questions", questionResult.count)

  console.log(`   Inserting ${assignments.length} assignments...`)
  const assignmentResult = await prisma.catalogAssignment.createMany({
    data: assignments,
    skipDuplicates: true,
  })
  logSuccess("Assignments", assignmentResult.count)

  console.log(`\n   Summary:`)
  console.log(`   - Videos:      ${videoResult.count}`)
  console.log(`   - Materials:   ${materialResult.count}`)
  console.log(`   - Exams:       ${examResult.count}`)
  console.log(`   - Questions:   ${questionResult.count}`)
  console.log(`   - Assignments: ${assignmentResult.count}`)
  console.log(
    `   - Total:       ${videoResult.count + materialResult.count + examResult.count + questionResult.count + assignmentResult.count}`
  )
}
