/**
 * Exam Notifications Module
 *
 * Exports for exam-related notifications:
 * - Notification actions
 * - Notification types
 * - Template configuration
 */

// Server actions
export {
  sendExamNotification,
  notifyExamScheduled,
  notifyExamReminder,
  notifyResultsPublished,
  notifyRetakeAvailable,
  notifyAllResultsPublished,
} from "./actions"

// Types
export type {
  ExamNotificationType,
  ExamNotificationData,
  ExamScheduledData,
  ExamReminderData,
  ExamStartedData,
  ExamCompletedData,
  ResultsPublishedData,
  RetakeAvailableData,
  GradeUpdatedData,
  RecipientType,
  ExamNotificationPreferences,
  NotificationTemplate,
} from "./types"

// Constants
export {
  DEFAULT_EXAM_NOTIFICATION_PREFERENCES,
  EXAM_NOTIFICATION_TEMPLATES,
} from "./types"
