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
