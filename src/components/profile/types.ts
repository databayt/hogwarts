// Profile Types - GitHub-inspired profile system
import type React from "react"

export type ProfileRole = "student" | "teacher" | "staff" | "parent"

// Base profile data shared across all roles
export interface BaseProfileData {
  id: string
  givenName: string
  middleName?: string
  surname: string
  profilePhotoUrl?: string | null
  createdAt: Date | string
  updatedAt: Date | string
}

// Student-specific profile data
export interface StudentProfileData extends BaseProfileData {
  studentId?: string
  grNumber?: string
  dateOfBirth: Date | string
  gender: string
  email?: string
  mobileNumber?: string
  enrollmentDate: Date | string
  status: string
  nationality?: string
  currentAddress?: string
  city?: string
  bloodGroup?: string
  medicalConditions?: string
}

// Teacher-specific profile data
export interface TeacherProfileData extends BaseProfileData {
  employeeId?: string
  emailAddress: string
  gender?: string
  birthDate?: Date | string
  joiningDate?: Date | string
  employmentStatus: string
  employmentType: string
}

// Parent/Guardian profile data
export interface ParentProfileData extends BaseProfileData {
  emailAddress?: string
  phoneNumbers?: {
    phoneNumber: string
    phoneType: string
    isPrimary: boolean
  }[]
}

// Staff profile data
export interface StaffProfileData extends BaseProfileData {
  emailAddress?: string
  department?: string
  position?: string
  joiningDate?: Date | string
}

// Unified profile data type
export type ProfileData =
  | StudentProfileData
  | TeacherProfileData
  | ParentProfileData
  | StaffProfileData

// Stat items for the sidebar
export interface ProfileStat {
  label: string
  value: number | string
  icon?: React.ReactNode
}

// Achievement badge
export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  earnedAt?: Date | string
  level?: "bronze" | "silver" | "gold" | "platinum"
}

// Pinned item (like GitHub's pinned repos)
export interface PinnedItem {
  id: string
  title: string
  description?: string
  category: string
  categoryColor: string
  stats: { label: string; value: number | string }[]
  link?: string
  isPrivate?: boolean
}

// Activity data point for contribution graph
export interface ActivityDataPoint {
  date: Date
  level: 0 | 1 | 2 | 3 | 4
  count: number
  activities?: string[]
}

// Activity item for the timeline
export interface ActivityItem {
  id: string
  type:
    | "assignment"
    | "attendance"
    | "grade"
    | "event"
    | "achievement"
    | "message"
    | "enrollment"
    | "class"
  title: string
  description?: string
  timestamp: Date | string
  icon?: string
  link?: string
  metadata?: Record<string, unknown>
}

// Tab configuration
export interface ProfileTab {
  id: string
  label: string
  count?: number
  icon?: React.ReactNode
}

// Organization/Group membership
export interface Organization {
  id: string
  name: string
  avatarUrl?: string
  role?: string
}

// Profile header info based on role
export interface RoleInfo {
  title: string
  subtitle: string
  description: string
  icon: string
  imageSrc: string
  tabs: ProfileTab[]
  stats: ProfileStat[]
  achievements: Achievement[]
  organizations: Organization[]
}

// Activity summary for overview chart
export interface ActivitySummary {
  label: string
  value: number
  percentage: number
  color: string
}

// Color tokens for the contribution graph
export const CONTRIBUTION_COLORS = {
  empty: "bg-muted/50",
  level1: "bg-emerald-900/50",
  level2: "bg-emerald-700/70",
  level3: "bg-emerald-500/80",
  level4: "bg-emerald-400",
} as const

// Month labels for contribution graph
export const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]

// Weekday labels for contribution graph
export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

// ============================================================================
// Contribution Graph Types (Real Data)
// ============================================================================

// Activity types for different roles
export type ActivityType =
  // Student activities
  | "attendance"
  | "assignment_submitted"
  | "exam_completed"
  | "library_visit"
  | "club_activity"
  // Teacher activities
  | "class_taught"
  | "grade_published"
  | "attendance_taken"
  | "lesson_created"
  // Parent activities
  | "portal_login"
  | "payment_made"
  | "message_sent"
  | "event_rsvp"
  // Staff activities
  | "task_completed"
  | "report_generated"
  | "expense_processed"
  | "meeting_attended"

// Breakdown of activity types for a given day
export interface ActivityBreakdown {
  type: ActivityType
  count: number
  label: string
}

// Enhanced contribution data point with activity breakdown
export interface ContributionDataPoint {
  date: string // ISO date string "YYYY-MM-DD"
  count: number // Total activities for the day
  level: 0 | 1 | 2 | 3 | 4 // Intensity level
  activities: ActivityBreakdown[] // Detailed breakdown
}

// Summary statistics for the contribution graph
export interface ContributionSummary {
  activeDays: number
  longestStreak: number
  currentStreak: number
  averagePerDay: number
  peakDay: { date: string; count: number } | null
}

// Full contribution graph data
export interface ContributionGraphData {
  contributions: ContributionDataPoint[]
  totalActivities: number
  year: number
  role: ProfileRole
  summary: ContributionSummary
}

// Parameters for fetching contribution data
export interface GetContributionDataParams {
  userId?: string // Optional - defaults to current user
  year?: number // Optional - defaults to current year
}

// Result type for contribution data fetching
export type GetContributionDataResult =
  | { success: true; data: ContributionGraphData }
  | { success: false; error: string }

// Activity labels for display
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
