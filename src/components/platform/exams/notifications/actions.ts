/**
 * Exam Notification Server Actions
 *
 * Server actions for sending exam-related notifications:
 * - Exam scheduled notifications
 * - Exam reminders
 * - Results published notifications
 * - Parent notifications
 */

"use server"

import { auth } from "@/auth"

import { db } from "@/lib/db"

import type {
  ExamNotificationData,
  ExamNotificationType,
  RecipientType,
} from "./types"

/**
 * Send exam notification to relevant recipients
 */
export async function sendExamNotification(
  data: ExamNotificationData,
  recipients?: { userId: string; type: RecipientType }[]
) {
  const session = await auth()
  const schoolId = session?.user?.schoolId

  if (!schoolId) {
    throw new Error("Unauthorized")
  }

  // Get exam details if not provided
  const exam = await db.exam.findUnique({
    where: { id: data.examId },
    include: {
      class: {
        include: {
          studentClasses: {
            include: {
              student: {
                include: {
                  user: true,
                  studentGuardians: {
                    include: {
                      guardian: {
                        include: {
                          user: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      subject: true,
    },
  })

  if (!exam || exam.schoolId !== schoolId) {
    throw new Error("Exam not found")
  }

  // Determine recipients if not provided
  const targetRecipients = recipients ?? getDefaultRecipients(data.type, exam)

  // Create notifications
  const notifications = await Promise.all(
    targetRecipients.map(async (recipient) => {
      const { title, body } = formatNotification(data, recipient.type)

      return db.notification.create({
        data: {
          schoolId,
          userId: recipient.userId,
          title,
          body,
          type: "grade_posted", // Using existing notification type for exam results
          metadata: {
            notificationType: data.type,
            examId: data.examId,
          },
        },
      })
    })
  )

  return { success: true, count: notifications.length }
}

/**
 * Send exam scheduled notification to all students and parents
 */
export async function notifyExamScheduled(examId: string) {
  const session = await auth()
  const schoolId = session?.user?.schoolId

  if (!schoolId) {
    throw new Error("Unauthorized")
  }

  const exam = await db.exam.findUnique({
    where: { id: examId },
    include: {
      subject: true,
      class: true,
    },
  })

  if (!exam || exam.schoolId !== schoolId) {
    throw new Error("Exam not found")
  }

  const data: ExamNotificationData = {
    type: "EXAM_SCHEDULED",
    examId,
    examTitle: exam.title,
    subjectName: exam.subject.subjectName,
    className: exam.class.name,
    examDate: exam.examDate,
    duration: exam.duration,
    totalMarks: exam.totalMarks,
    instructions: exam.instructions ?? undefined,
  }

  return sendExamNotification(data)
}

/**
 * Send exam reminder notification
 */
export async function notifyExamReminder(examId: string, hoursUntil: number) {
  const session = await auth()
  const schoolId = session?.user?.schoolId

  if (!schoolId) {
    throw new Error("Unauthorized")
  }

  const exam = await db.exam.findUnique({
    where: { id: examId },
    include: {
      subject: true,
      class: true,
    },
  })

  if (!exam || exam.schoolId !== schoolId) {
    throw new Error("Exam not found")
  }

  const data: ExamNotificationData = {
    type: "EXAM_REMINDER",
    examId,
    examTitle: exam.title,
    subjectName: exam.subject.subjectName,
    className: exam.class.name,
    examDate: exam.examDate,
    hoursUntil,
  }

  return sendExamNotification(data)
}

/**
 * Send results published notification to student and parents
 */
export async function notifyResultsPublished(
  examId: string,
  studentId: string
) {
  const session = await auth()
  const schoolId = session?.user?.schoolId

  if (!schoolId) {
    throw new Error("Unauthorized")
  }

  // Get exam result
  const result = await db.examResult.findFirst({
    where: {
      schoolId,
      examId,
      studentId,
    },
    include: {
      exam: {
        include: {
          subject: true,
          class: true,
        },
      },
      student: {
        include: {
          user: true,
          studentGuardians: {
            include: {
              guardian: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
      },
    },
  })

  if (!result) {
    throw new Error("Result not found")
  }

  // Calculate class average
  const classResults = await db.examResult.aggregate({
    where: {
      schoolId,
      examId,
    },
    _avg: {
      percentage: true,
    },
  })

  const percentage =
    typeof result.percentage === "number"
      ? result.percentage
      : ((
          result.percentage as { toNumber?: () => number } | null
        )?.toNumber?.() ?? 0)
  const passingMarks = result.exam.passingMarks
  const totalMarks = result.exam.totalMarks

  const data: ExamNotificationData = {
    type: "RESULTS_PUBLISHED",
    examId,
    examTitle: result.exam.title,
    subjectName: result.exam.subject.subjectName,
    className: result.exam.class.name,
    percentage,
    grade: result.grade ?? "N/A",
    classAverage:
      typeof classResults._avg.percentage === "number"
        ? classResults._avg.percentage
        : ((
            classResults._avg.percentage as { toNumber?: () => number } | null
          )?.toNumber?.() ?? 0),
    passed: (percentage / 100) * totalMarks >= passingMarks,
  }

  // Get recipients (student + parents)
  const recipients: { userId: string; type: RecipientType }[] = []

  if (result.student.user?.id) {
    recipients.push({
      userId: result.student.user.id,
      type: "STUDENT",
    })
  }

  for (const sg of result.student.studentGuardians) {
    if (sg.guardian.user?.id) {
      recipients.push({
        userId: sg.guardian.user.id,
        type: "PARENT",
      })
    }
  }

  return sendExamNotification(data, recipients)
}

/**
 * Send retake available notification
 */
export async function notifyRetakeAvailable(
  examId: string,
  studentId: string,
  attemptNumber: number
) {
  const session = await auth()
  const schoolId = session?.user?.schoolId

  if (!schoolId) {
    throw new Error("Unauthorized")
  }

  const exam = await db.exam.findUnique({
    where: { id: examId },
    include: {
      subject: true,
      class: true,
    },
  })

  if (!exam || exam.schoolId !== schoolId) {
    throw new Error("Exam not found")
  }

  // Get previous score
  const previousResult = await db.examResult.findFirst({
    where: {
      schoolId,
      examId,
      studentId,
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  const data: ExamNotificationData = {
    type: "RETAKE_AVAILABLE",
    examId,
    examTitle: exam.title,
    subjectName: exam.subject.subjectName,
    className: exam.class.name,
    attemptNumber,
    maxAttempts: exam.maxAttempts,
    previousScore: previousResult
      ? typeof previousResult.percentage === "number"
        ? previousResult.percentage
        : ((
            previousResult.percentage as unknown as {
              toNumber?: () => number
            } | null
          )?.toNumber?.() ?? 0)
      : 0,
  }

  return sendExamNotification(data)
}

/**
 * Bulk notify all students when results are published
 */
export async function notifyAllResultsPublished(examId: string) {
  const session = await auth()
  const schoolId = session?.user?.schoolId

  if (!schoolId) {
    throw new Error("Unauthorized")
  }

  // Get all results for this exam
  const results = await db.examResult.findMany({
    where: {
      schoolId,
      examId,
    },
    select: {
      studentId: true,
    },
  })

  // Notify each student
  const notifications = await Promise.all(
    results.map((r) => notifyResultsPublished(examId, r.studentId))
  )

  const totalCount = notifications.reduce((sum, n) => sum + n.count, 0)

  return { success: true, count: totalCount }
}

// Helper functions

function getDefaultRecipients(
  type: ExamNotificationType,
  exam: {
    class: {
      studentClasses: Array<{
        student: {
          user: { id: string } | null
          studentGuardians: Array<{
            guardian: {
              user: { id: string } | null
            }
          }>
        }
      }>
    }
  }
): { userId: string; type: RecipientType }[] {
  const recipients: { userId: string; type: RecipientType }[] = []

  for (const sc of exam.class.studentClasses) {
    // Add student
    if (sc.student.user?.id) {
      recipients.push({
        userId: sc.student.user.id,
        type: "STUDENT",
      })
    }

    // Add parents for certain notification types
    if (
      ["EXAM_SCHEDULED", "RESULTS_PUBLISHED", "RETAKE_AVAILABLE"].includes(type)
    ) {
      for (const sg of sc.student.studentGuardians) {
        if (sg.guardian.user?.id) {
          recipients.push({
            userId: sg.guardian.user.id,
            type: "PARENT",
          })
        }
      }
    }
  }

  return recipients
}

function formatNotification(
  data: ExamNotificationData,
  _recipientType: RecipientType
): { title: string; body: string } {
  switch (data.type) {
    case "EXAM_SCHEDULED":
      return {
        title: `New Exam: ${data.examTitle}`,
        body: `${data.subjectName} exam scheduled for ${data.examDate.toLocaleDateString()}. Duration: ${data.duration} minutes.`,
      }
    case "EXAM_REMINDER":
      return {
        title: `Exam Reminder: ${data.examTitle}`,
        body: `Your ${data.subjectName} exam starts in ${data.hoursUntil} hours.`,
      }
    case "EXAM_STARTED":
      return {
        title: `Exam Started: ${data.examTitle}`,
        body: `The ${data.subjectName} exam has started and will end at ${data.endTime.toLocaleTimeString()}.`,
      }
    case "EXAM_COMPLETED":
      return {
        title: `Exam Completed: ${data.examTitle}`,
        body: `Completed ${data.subjectName} exam. Answered ${data.questionsAnswered}/${data.totalQuestions} questions.`,
      }
    case "RESULTS_PUBLISHED":
      return {
        title: `Results: ${data.examTitle}`,
        body: `Score: ${data.percentage.toFixed(1)}% (${data.grade}). ${data.passed ? "Passed!" : "Did not pass."}`,
      }
    case "RETAKE_AVAILABLE":
      return {
        title: `Retake Available: ${data.examTitle}`,
        body: `You can retake the ${data.subjectName} exam. Previous: ${data.previousScore}%. Attempt ${data.attemptNumber}/${data.maxAttempts}.`,
      }
    case "GRADE_UPDATED":
      return {
        title: `Grade Updated: ${data.examTitle}`,
        body: `Your ${data.subjectName} grade changed from ${data.previousGrade} to ${data.newGrade}.`,
      }
    default:
      return {
        title: "Exam Notification",
        body: "You have a new exam notification.",
      }
  }
}
