/**
 * Profile types — contribution graph + role enum.
 *
 * The rich view model (identity, stats, badges, organizations, pinned,
 * activity, role detail) lives in `queries.ts` as `ProfileViewData`. The
 * permission/detail types live in `detail/types.ts`. This file holds only the
 * contribution-graph shapes shared by `actions.ts` and `graph.tsx`.
 */

export type ProfileRole = "student" | "teacher" | "staff" | "parent"

// Activity types contributing to the heatmap, grouped by role.
export type ActivityType =
  // Student
  | "attendance"
  | "assignment_submitted"
  | "exam_completed"
  | "library_visit"
  | "club_activity"
  // Teacher
  | "class_taught"
  | "grade_published"
  | "attendance_taken"
  | "lesson_created"
  // Parent
  | "portal_login"
  | "payment_made"
  | "message_sent"
  | "event_rsvp"
  // Staff
  | "task_completed"
  | "report_generated"
  | "expense_processed"
  | "meeting_attended"

export interface ActivityBreakdown {
  type: ActivityType
  count: number
  label: string
}

export interface ContributionDataPoint {
  date: string
  count: number
  level: 0 | 1 | 2 | 3 | 4
  activities: ActivityBreakdown[]
}

export interface ContributionSummary {
  activeDays: number
  longestStreak: number
  currentStreak: number
  averagePerDay: number
  peakDay: { date: string; count: number } | null
}

export interface ContributionGraphData {
  contributions: ContributionDataPoint[]
  totalActivities: number
  year: number
  role: ProfileRole
  summary: ContributionSummary
}

export interface GetContributionDataParams {
  userId?: string
  year?: number
}

export type GetContributionDataResult =
  | { success: true; data: ContributionGraphData }
  | { success: false; error: string }

/**
 * Heatmap-tooltip labels per activity type. These are short, English-source
 * strings cached/translated on demand by the translation layer when rendered
 * in another locale (the activity feed itself is dictionary-driven).
 */
export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  // Student
  attendance: "Attended class",
  assignment_submitted: "Submitted assignment",
  exam_completed: "Completed exam",
  library_visit: "Library visit",
  club_activity: "Club activity",
  // Teacher
  class_taught: "Taught class",
  grade_published: "Published grade",
  attendance_taken: "Marked attendance",
  lesson_created: "Created lesson",
  // Parent
  portal_login: "Portal login",
  payment_made: "Made payment",
  message_sent: "Sent message",
  event_rsvp: "Event RSVP",
  // Staff
  task_completed: "Completed task",
  report_generated: "Generated report",
  expense_processed: "Processed expense",
  meeting_attended: "Attended meeting",
}
