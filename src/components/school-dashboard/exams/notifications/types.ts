/**
 * Exam Notification Types
 *
 * Type definitions for exam-related notifications:
 * - Exam scheduled
 * - Exam reminder
 * - Exam completed
 * - Results published
 * - Retake available
 */

// Notification event types for exams
export type ExamNotificationType =
  | "EXAM_SCHEDULED"
  | "EXAM_REMINDER"
  | "EXAM_STARTED"
  | "EXAM_COMPLETED"
  | "RESULTS_PUBLISHED"
  | "RETAKE_AVAILABLE"
  | "GRADE_UPDATED"

// Base notification data
interface BaseNotificationData {
  examId: string
  examTitle: string
  subjectName: string
  className: string
}

// Scheduled exam notification
export interface ExamScheduledData extends BaseNotificationData {
  type: "EXAM_SCHEDULED"
  examDate: Date
  duration: number
  totalMarks: number
  instructions?: string
}

// Exam reminder notification
export interface ExamReminderData extends BaseNotificationData {
  type: "EXAM_REMINDER"
  examDate: Date
  hoursUntil: number
  location?: string
}

// Exam started notification
export interface ExamStartedData extends BaseNotificationData {
  type: "EXAM_STARTED"
  startTime: Date
  endTime: Date
  duration: number
}

// Exam completed notification
export interface ExamCompletedData extends BaseNotificationData {
  type: "EXAM_COMPLETED"
  submittedAt: Date
  questionsAnswered: number
  totalQuestions: number
}

// Results published notification
export interface ResultsPublishedData extends BaseNotificationData {
  type: "RESULTS_PUBLISHED"
  percentage: number
  grade: string
  rank?: number
  classAverage?: number
  passed: boolean
}

// Retake available notification
export interface RetakeAvailableData extends BaseNotificationData {
  type: "RETAKE_AVAILABLE"
  attemptNumber: number
  maxAttempts: number
  previousScore: number
  deadline?: Date
}

// Grade updated notification
export interface GradeUpdatedData extends BaseNotificationData {
  type: "GRADE_UPDATED"
  previousGrade: string
  newGrade: string
  reason?: string
}

// Union type for all notification data
export type ExamNotificationData =
  | ExamScheduledData
  | ExamReminderData
  | ExamStartedData
  | ExamCompletedData
  | ResultsPublishedData
  | RetakeAvailableData
  | GradeUpdatedData

// Notification recipient types
export type RecipientType = "STUDENT" | "PARENT" | "TEACHER" | "ADMIN"

// Notification preferences
export interface ExamNotificationPreferences {
  examScheduled: boolean
  examReminder: boolean
  examReminder24h: boolean
  examReminder1h: boolean
  resultsPublished: boolean
  retakeAvailable: boolean
  gradeUpdates: boolean
  emailEnabled: boolean
  pushEnabled: boolean
  smsEnabled: boolean
}

// Default preferences
export const DEFAULT_EXAM_NOTIFICATION_PREFERENCES: ExamNotificationPreferences =
  {
    examScheduled: true,
    examReminder: true,
    examReminder24h: true,
    examReminder1h: true,
    resultsPublished: true,
    retakeAvailable: true,
    gradeUpdates: true,
    emailEnabled: true,
    pushEnabled: true,
    smsEnabled: false,
  }

// Notification template configuration
export interface NotificationTemplate {
  type: ExamNotificationType
  titleTemplate: string
  bodyTemplate: string
  channels: ("email" | "push" | "sms" | "in_app")[]
  recipientTypes: RecipientType[]
}

// Default notification templates
export const EXAM_NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  {
    type: "EXAM_SCHEDULED",
    titleTemplate: "New Exam Scheduled: {{examTitle}}",
    bodyTemplate:
      "{{subjectName}} exam scheduled for {{examDate}}. Duration: {{duration}} minutes.",
    channels: ["email", "push", "in_app"],
    recipientTypes: ["STUDENT", "PARENT"],
  },
  {
    type: "EXAM_REMINDER",
    titleTemplate: "Exam Reminder: {{examTitle}}",
    bodyTemplate:
      "Your {{subjectName}} exam starts in {{hoursUntil}} hours. Please prepare accordingly.",
    channels: ["push", "in_app"],
    recipientTypes: ["STUDENT", "PARENT"],
  },
  {
    type: "EXAM_STARTED",
    titleTemplate: "Exam In Progress: {{examTitle}}",
    bodyTemplate:
      "{{studentName}} has started the {{subjectName}} exam. It will end at {{endTime}}.",
    channels: ["push", "in_app"],
    recipientTypes: ["PARENT"],
  },
  {
    type: "EXAM_COMPLETED",
    titleTemplate: "Exam Submitted: {{examTitle}}",
    bodyTemplate:
      "{{studentName}} has completed the {{subjectName}} exam. Answered {{questionsAnswered}}/{{totalQuestions}} questions.",
    channels: ["push", "in_app"],
    recipientTypes: ["PARENT"],
  },
  {
    type: "RESULTS_PUBLISHED",
    titleTemplate: "Exam Results: {{examTitle}}",
    bodyTemplate:
      "{{studentName}} scored {{percentage}}% ({{grade}}) in {{subjectName}}. Class average: {{classAverage}}%.",
    channels: ["email", "push", "in_app"],
    recipientTypes: ["STUDENT", "PARENT"],
  },
  {
    type: "RETAKE_AVAILABLE",
    titleTemplate: "Retake Available: {{examTitle}}",
    bodyTemplate:
      "You can retake the {{subjectName}} exam. Previous score: {{previousScore}}%. Attempt {{attemptNumber}} of {{maxAttempts}}.",
    channels: ["email", "push", "in_app"],
    recipientTypes: ["STUDENT", "PARENT"],
  },
  {
    type: "GRADE_UPDATED",
    titleTemplate: "Grade Updated: {{examTitle}}",
    bodyTemplate:
      "Your grade for {{subjectName}} has been updated from {{previousGrade}} to {{newGrade}}.",
    channels: ["push", "in_app"],
    recipientTypes: ["STUDENT", "PARENT"],
  },
]
