/**
 * Assignments Seed
 * Creates Assignments and Submissions for all classes
 *
 * Phase 9: Assignments & Submissions
 */

import type { PrismaClient, SubmissionStatus } from "@prisma/client"

import type { ClassRef, StudentRef, TeacherRef } from "./types"
import {
  getRandomScore,
  logPhase,
  logSuccess,
  processBatch,
  randomElement,
  randomNumber,
} from "./utils"

// ============================================================================
// ASSIGNMENT DATA
// ============================================================================

const ASSIGNMENT_TYPES = [
  "HOMEWORK",
  "PROJECT",
  "QUIZ",
  "PRESENTATION",
  "ESSAY",
  "LAB_REPORT",
] as const

const ASSIGNMENT_TEMPLATES = {
  HOMEWORK: [
    {
      title: "تمرين مراجعة الفصل", // EN: "Chapter Review Exercise"
      description: "أكمل تمارين المراجعة في نهاية الفصل. أظهر جميع خطوات الحل.",
      points: 20,
      weight: 5,
    },
    {
      title: "مجموعة مسائل تدريبية", // EN: "Practice Problems Set"
      description: "حل المسائل التدريبية المعينة. موعد التسليم نهاية الأسبوع.",
      points: 25,
      weight: 5,
    },
    {
      title: "ورقة عمل أسبوعية", // EN: "Weekly Worksheet"
      description: "أكمل جميع الأسئلة في ورقة العمل.",
      points: 15,
      weight: 3,
    },
  ],
  PROJECT: [
    {
      title: "مشروع بحثي", // EN: "Research Project"
      description: "ابحث في الموضوع المعين وأعد تقريرًا مفصلاً مع المراجع.",
      points: 100,
      weight: 15,
    },
    {
      title: "مشروع جماعي", // EN: "Group Project"
      description: "اعمل مع فريقك لإكمال المشروع المعين. يجب تضمين عرض تقديمي.",
      points: 80,
      weight: 12,
    },
  ],
  QUIZ: [
    {
      title: "اختبار سريع", // EN: "Quick Quiz"
      description: "اختبار قصير يغطي الدروس الأخيرة. يسمح بالكتاب المفتوح.",
      points: 20,
      weight: 5,
    },
    {
      title: "اختبار الفصل", // EN: "Chapter Quiz"
      description: "اختبار على محتوى الفصل. لا يسمح بالملاحظات.",
      points: 30,
      weight: 7,
    },
  ],
  PRESENTATION: [
    {
      title: "عرض تقديمي", // EN: "Class Presentation"
      description: "أعد وقدم عرضًا تقديميًا لمدة 10 دقائق حول الموضوع المعين.",
      points: 50,
      weight: 10,
    },
  ],
  ESSAY: [
    {
      title: "مهمة مقالية", // EN: "Essay Assignment"
      description:
        "اكتب مقالًا من 500 كلمة حول الموضوع المعين. يجب تضمين الاستشهادات.",
      points: 40,
      weight: 8,
    },
  ],
  LAB_REPORT: [
    {
      title: "تقرير مختبر", // EN: "Lab Report"
      description: "وثق نتائج المختبر باتباع تنسيق المنهج العلمي.",
      points: 35,
      weight: 7,
    },
  ],
}

const FEEDBACK_TEMPLATES = {
  excellent: [
    "عمل ممتاز! أظهرت فهمًا عميقًا للمادة.", // EN: "Excellent work! You demonstrated thorough understanding."
    "تقديم متميز. واصل العمل الجيد!", // EN: "Outstanding submission. Keep up the great work!"
    "أحسنت. اهتمامك بالتفاصيل مثير للإعجاب.", // EN: "Very well done. Your attention to detail is impressive."
  ],
  good: [
    "عمل جيد. تحتاج بعض التحسينات البسيطة.", // EN: "Good work. Minor improvements needed."
    "جهد متين. راجع الملاحظات لاقتراحات التحسين.", // EN: "Solid effort. Review feedback for improvements."
    "عمل جيد بشكل عام. بعض المجالات تحتاج مزيدًا من الاهتمام.", // EN: "Nice job overall. A few areas need more attention."
  ],
  average: [
    "عمل مقبول. يرجى مراجعة المادة والتحسين.", // EN: "Satisfactory work. Please review and improve."
    "تقديم مقبول. تحتاج مزيدًا من الجهد للحصول على درجات أفضل.", // EN: "Acceptable submission. More effort needed."
    "أداء متوسط. راجع الملاحظات لمعرفة مجالات التحسين.", // EN: "Average performance. See comments for improvement."
  ],
  poor: [
    "هذا التقديم يحتاج تحسينًا كبيرًا. يرجى مراجعتي.", // EN: "This submission needs significant improvement."
    "أقل من المتوقع. يلزم عمل إضافي.", // EN: "Below expectations. Additional work required."
    "يرجى المراجعة وإعادة التقديم وفقًا للإرشادات.", // EN: "Please revise and resubmit following guidelines."
  ],
}

// ============================================================================
// SEED FUNCTIONS
// ============================================================================

/**
 * Seed assignments for classes
 */
export async function seedAssignments(
  prisma: PrismaClient,
  schoolId: string,
  classes: ClassRef[],
  teachers: TeacherRef[],
  termStart: Date,
  termEnd: Date
): Promise<string[]> {
  logPhase(9, "ASSIGNMENTS", "الواجبات والمهام")

  const assignmentIds: string[] = []
  const termDuration = termEnd.getTime() - termStart.getTime()

  // Create 1-2 assignments per class (targeting 200+ assignments)
  await processBatch(classes, 10, async (classInfo, classIndex) => {
    // Get a teacher for this class (round-robin)
    const teacher = teachers[classIndex % teachers.length]

    // Create 1-2 assignments per class
    const assignmentCount = randomNumber(1, 2)

    for (let i = 0; i < assignmentCount; i++) {
      const type = randomElement(ASSIGNMENT_TYPES)
      const templates = ASSIGNMENT_TEMPLATES[type]
      const template = randomElement(templates)

      // Calculate due date spread across the term
      const dueOffset =
        (classIndex * assignmentCount + i) / (classes.length * 2)
      const dueDate = new Date(termStart.getTime() + termDuration * dueOffset)

      // Publish date is 1-2 weeks before due date
      const publishOffset = randomNumber(7, 14) * 24 * 60 * 60 * 1000
      const publishDate = new Date(dueDate.getTime() - publishOffset)

      const title = `${template.title} - ${classInfo.name}`

      try {
        // Check if assignment already exists
        const existing = await prisma.assignment.findFirst({
          where: {
            schoolId,
            classId: classInfo.id,
            title,
          },
        })

        if (!existing) {
          const assignment = await prisma.assignment.create({
            data: {
              schoolId,
              classId: classInfo.id,
              title,
              description: template.description,
              type,
              status: publishDate <= new Date() ? "PUBLISHED" : "DRAFT",
              totalPoints: template.points,
              weight: template.weight,
              dueDate,
              publishDate: publishDate <= new Date() ? publishDate : null,
              instructions: template.description,
            },
          })
          assignmentIds.push(assignment.id)
        }
      } catch {
        // Skip if already exists
      }
    }
  })

  logSuccess("Assignments", assignmentIds.length, "across all classes")

  return assignmentIds
}

/**
 * Seed assignment submissions for students
 * Target: ~50% completion rate, mixed statuses
 */
export async function seedAssignmentSubmissions(
  prisma: PrismaClient,
  schoolId: string,
  students: StudentRef[],
  classes: ClassRef[],
  teachers: TeacherRef[]
): Promise<number> {
  let submissionCount = 0

  // Get all published assignments
  const assignments = await prisma.assignment.findMany({
    where: {
      schoolId,
      status: { in: ["PUBLISHED", "COMPLETED", "GRADED"] },
    },
    select: {
      id: true,
      classId: true,
      totalPoints: true,
      dueDate: true,
    },
  })

  if (assignments.length === 0) {
    logSuccess("Submissions", 0, "no published assignments found")
    return 0
  }

  // Group students by year level (which maps to classes)
  const studentsByLevel = new Map<string, StudentRef[]>()
  for (const student of students) {
    if (!student.yearLevelId) continue
    const existing = studentsByLevel.get(student.yearLevelId) || []
    existing.push(student)
    studentsByLevel.set(student.yearLevelId, existing)
  }

  // For each assignment, create submissions for ~50% of students in that class
  await processBatch(assignments, 5, async (assignment) => {
    const classInfo = classes.find((c) => c.id === assignment.classId)
    if (!classInfo) return

    const levelStudents = studentsByLevel.get(classInfo.yearLevelId) || []

    // 50% submission rate
    const submittingStudents = levelStudents.filter(() => Math.random() < 0.5)

    for (const student of submittingStudents.slice(0, 20)) {
      // Limit per assignment
      const now = new Date()
      const isOverdue = assignment.dueDate < now
      const isOnTime = Math.random() > 0.15 // 85% on time

      // Determine submission status
      let status: SubmissionStatus
      let submittedAt: Date | null = null
      let score: number | null = null
      let feedback: string | null = null
      let gradedAt: Date | null = null
      let gradedBy: string | null = null

      const rand = Math.random()
      if (rand < 0.4) {
        // 40% - Graded submissions
        status = "GRADED"
        const daysBeforeDue = randomNumber(0, 7)
        submittedAt = new Date(
          assignment.dueDate.getTime() - daysBeforeDue * 24 * 60 * 60 * 1000
        )

        // Calculate score based on distribution
        const totalPoints = Number(assignment.totalPoints)
        score = getRandomScore(totalPoints)
        const percentage = (score / totalPoints) * 100

        // Select feedback based on score
        let feedbackCategory: keyof typeof FEEDBACK_TEMPLATES
        if (percentage >= 85) feedbackCategory = "excellent"
        else if (percentage >= 70) feedbackCategory = "good"
        else if (percentage >= 60) feedbackCategory = "average"
        else feedbackCategory = "poor"

        feedback = randomElement(FEEDBACK_TEMPLATES[feedbackCategory])
        gradedAt = new Date(
          submittedAt.getTime() + randomNumber(1, 5) * 24 * 60 * 60 * 1000
        )
        gradedBy = teachers[randomNumber(0, teachers.length - 1)]?.id || null
      } else if (rand < 0.7) {
        // 30% - Submitted but not graded
        status = isOnTime || !isOverdue ? "SUBMITTED" : "LATE_SUBMITTED"
        const daysOffset = isOnTime ? randomNumber(0, 5) : randomNumber(1, 3)
        submittedAt = isOnTime
          ? new Date(
              assignment.dueDate.getTime() - daysOffset * 24 * 60 * 60 * 1000
            )
          : new Date(
              assignment.dueDate.getTime() + daysOffset * 24 * 60 * 60 * 1000
            )
      } else if (rand < 0.85) {
        // 15% - Draft (started but not submitted)
        status = "DRAFT"
      } else {
        // 15% - Not submitted
        status = "NOT_SUBMITTED"
      }

      try {
        await prisma.assignmentSubmission.upsert({
          where: {
            schoolId_assignmentId_studentId: {
              schoolId,
              assignmentId: assignment.id,
              studentId: student.id,
            },
          },
          update: {
            status,
            submittedAt,
            score: score !== null ? score : undefined,
            feedback,
            gradedAt,
            gradedBy,
          },
          create: {
            schoolId,
            assignmentId: assignment.id,
            studentId: student.id,
            status,
            submittedAt,
            content:
              status !== "NOT_SUBMITTED" ? "محتوى تقديم الطالب..." : null,
            score: score !== null ? score : undefined,
            feedback,
            gradedAt,
            gradedBy,
          },
        })
        submissionCount++
      } catch {
        // Skip if already exists
      }
    }
  })

  logSuccess("Submissions", submissionCount, "with grade distribution")

  return submissionCount
}
