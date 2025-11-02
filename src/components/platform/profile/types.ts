/**
 * Unified Profile System Types
 * Comprehensive type definitions for all user profile types in the platform
 */

import type {
  User,
  Student,
  Teacher,
  Guardian,
  School,
  Department,
  TeacherQualification,
  TeacherExperience,
  TeacherSubjectExpertise,
  StudentGuardian,
  StudentClass,
  StudentYearLevel,
  Achievement,
  DisciplinaryRecord,
  HealthRecord,
  Attendance,
  Assignment,
  AssignmentSubmission,
  Payment,
  Subject,
  Class,
  YearLevel,
  StudentDocument
} from '@prisma/client'

// ============================================================================
// Core Profile Types
// ============================================================================

/**
 * Base profile interface shared across all user types
 */
export interface BaseProfile {
  id: string
  type: UserProfileType
  userId: string
  schoolId: string

  // Basic Information
  displayName: string
  email: string
  avatar?: string | null
  coverImage?: string | null
  bio?: string | null

  // Contact Information
  phone?: string | null
  alternatePhone?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
  postalCode?: string | null

  // Social Links
  socialLinks?: SocialLinks

  // Metadata
  joinedAt: Date
  lastActive?: Date
  isOnline?: boolean
  visibility: ProfileVisibility
  completionPercentage: number

  // Settings
  settings: ProfileSettings

  // Activity & Stats
  activityStats: ActivityStats
  recentActivity: ActivityItem[]

  // Custom Fields
  customFields?: Record<string, any>
}

/**
 * User profile type enumeration
 */
export enum UserProfileType {
  STUDENT = 'STUDENT',
  TEACHER = 'TEACHER',
  PARENT = 'PARENT',
  STAFF = 'STAFF',
  ADMIN = 'ADMIN'
}

/**
 * Profile visibility settings
 */
export enum ProfileVisibility {
  PUBLIC = 'PUBLIC',       // Anyone can view
  SCHOOL = 'SCHOOL',       // Only school members can view
  CONNECTIONS = 'CONNECTIONS', // Only connections can view
  PRIVATE = 'PRIVATE'      // Only the user can view
}

/**
 * Social media links
 */
export interface SocialLinks {
  website?: string | null
  linkedin?: string | null
  twitter?: string | null
  facebook?: string | null
  instagram?: string | null
  github?: string | null
  youtube?: string | null
  [key: string]: string | null | undefined
}

/**
 * Profile settings and preferences
 */
export interface ProfileSettings {
  theme?: 'light' | 'dark' | 'system'
  language: 'ar' | 'en'
  emailNotifications: boolean
  pushNotifications: boolean
  showEmail: boolean
  showPhone: boolean
  showLocation: boolean
  allowMessages: boolean
  allowConnectionRequests: boolean
}

/**
 * Activity statistics
 */
export interface ActivityStats {
  totalViews: number
  totalConnections: number
  totalPosts: number
  totalAchievements: number
  contributionStreak: number
  lastContribution: Date | null
}

/**
 * Individual activity item
 */
export interface ActivityItem {
  id: string
  type: ActivityType
  title: string
  description?: string
  timestamp: Date
  icon?: string
  link?: string
  metadata?: Record<string, any>
}

/**
 * Types of activities
 */
export enum ActivityType {
  // Academic
  ASSIGNMENT_SUBMITTED = 'ASSIGNMENT_SUBMITTED',
  GRADE_RECEIVED = 'GRADE_RECEIVED',
  COURSE_ENROLLED = 'COURSE_ENROLLED',
  COURSE_COMPLETED = 'COURSE_COMPLETED',

  // Achievement
  ACHIEVEMENT_EARNED = 'ACHIEVEMENT_EARNED',
  CERTIFICATE_EARNED = 'CERTIFICATE_EARNED',
  BADGE_EARNED = 'BADGE_EARNED',

  // Social
  PROFILE_UPDATED = 'PROFILE_UPDATED',
  CONNECTION_MADE = 'CONNECTION_MADE',
  POST_CREATED = 'POST_CREATED',
  COMMENT_MADE = 'COMMENT_MADE',

  // Administrative
  FEE_PAID = 'FEE_PAID',
  DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
  ATTENDANCE_MARKED = 'ATTENDANCE_MARKED',

  // Other
  CUSTOM = 'CUSTOM'
}

// ============================================================================
// Student Profile
// ============================================================================

export interface StudentProfile extends BaseProfile {
  type: UserProfileType.STUDENT

  // Student-specific data
  student: Student & {
    yearLevels?: (StudentYearLevel & {
      yearLevel: YearLevel
    })[]
    classes?: (StudentClass & {
      class: Class & {
        subject: Subject
        teacher?: Teacher | null
      }
    })[]
    guardians?: (StudentGuardian & {
      guardian: Guardian
    })[]
    achievements?: Achievement[]
    disciplinaryRecords?: DisciplinaryRecord[]
    healthRecords?: HealthRecord[]
    attendance?: Attendance[]
    assignments?: (AssignmentSubmission & {
      assignment: Assignment
    })[]
    feesPayments?: Payment[]
    documents?: StudentDocument[]
  }

  // Academic Information
  academicInfo: {
    grNumber?: string | null
    admissionNumber?: string | null
    rollNumber?: string | null
    currentYearLevel?: string
    currentSection?: string
    house?: string | null
    studentType: 'REGULAR' | 'TRANSFER' | 'INTERNATIONAL' | 'EXCHANGE'
    enrollmentDate: Date
    expectedGraduation?: Date | null
    gpa?: number | null
    rank?: number | null
    totalCredits?: number | null
  }

  // Performance Metrics
  performance: {
    attendanceRate: number
    assignmentCompletionRate: number
    averageGrade: number | null
    subjectPerformance: SubjectPerformance[]
    strengthAreas: string[]
    improvementAreas: string[]
  }

  // Skills & Interests
  skillsAndInterests: {
    skills: Skill[]
    interests: string[]
    hobbies: string[]
    extracurriculars: string[]
    languages: Language[]
    certifications: Certification[]
  }

  // GitHub-style contribution graph data
  contributionData: ContributionData
}

/**
 * Subject performance metrics
 */
export interface SubjectPerformance {
  subjectId: string
  subjectName: string
  currentGrade: number | null
  trend: 'up' | 'down' | 'stable'
  attendance: number
  assignmentsCompleted: number
  assignmentsTotal: number
}

/**
 * Skill with proficiency level
 */
export interface Skill {
  name: string
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  verified: boolean
  endorsements: number
}

/**
 * Language proficiency
 */
export interface Language {
  name: string
  proficiency: 'native' | 'fluent' | 'professional' | 'conversational' | 'basic'
}

/**
 * Certification details
 */
export interface Certification {
  name: string
  issuer: string
  issueDate: Date
  expiryDate?: Date | null
  credentialId?: string | null
  url?: string | null
}

// ============================================================================
// Teacher Profile
// ============================================================================

export interface TeacherProfile extends BaseProfile {
  type: UserProfileType.TEACHER

  // Teacher-specific data
  teacher: Teacher & {
    departments?: Department[]
    qualifications?: TeacherQualification[]
    experience?: TeacherExperience[]
    subjectExpertise?: TeacherSubjectExpertise[]
    classes?: (Class & {
      subject: Subject
      students?: StudentClass[]
    })[]
  }

  // Professional Information
  professionalInfo: {
    employeeId: string
    designation?: string | null
    employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'VISITING'
    employmentStatus: 'ACTIVE' | 'ON_LEAVE' | 'RESIGNED' | 'RETIRED'
    joiningDate: Date
    totalExperience: number // in years
    specializations: string[]
    researchInterests?: string[]
    publications?: Publication[]
  }

  // Teaching Metrics
  teachingMetrics: {
    totalStudentsTaught: number
    totalClassesAssigned: number
    averageStudentRating?: number | null
    feedbackCount: number
    passRate?: number | null
    attendanceRate?: number | null
  }

  // Schedule
  schedule: {
    weeklyHours: number
    currentClasses: ClassSchedule[]
    officeHours?: OfficeHour[]
    availability: AvailabilityStatus
  }

  // GitHub-style contribution graph data
  contributionData: ContributionData
}

/**
 * Publication details
 */
export interface Publication {
  title: string
  type: 'journal' | 'conference' | 'book' | 'chapter' | 'other'
  publisher?: string
  year: number
  doi?: string
  url?: string
}

/**
 * Class schedule item
 */
export interface ClassSchedule {
  classId: string
  className: string
  subject: string
  dayOfWeek: number
  startTime: string
  endTime: string
  room?: string
}

/**
 * Office hour slot
 */
export interface OfficeHour {
  dayOfWeek: number
  startTime: string
  endTime: string
  location?: string
  isOnline?: boolean
}

/**
 * Availability status
 */
export type AvailabilityStatus = 'available' | 'busy' | 'in_class' | 'on_leave' | 'offline'

// ============================================================================
// Parent Profile
// ============================================================================

export interface ParentProfile extends BaseProfile {
  type: UserProfileType.PARENT

  // Parent-specific data
  guardian: Guardian & {
    children?: (StudentGuardian & {
      student: Student & {
        yearLevels?: StudentYearLevel[]
        attendance?: Attendance[]
        achievements?: Achievement[]
      }
    })[]
  }

  // Top-level aliases for easier access (with flattened student properties for easier access in components)
  children?: (StudentGuardian & {
    student: Student & {
      yearLevels?: StudentYearLevel[]
      attendance?: Attendance[]
      achievements?: Achievement[]
    }
    // Flattened student properties for direct access (temporary for mock data compatibility)
    givenName?: string
    surname?: string
    profilePhotoUrl?: string | null
    grade?: string
    section?: string
    birthDate?: Date
    enrollmentStatus?: string
    academicStatus?: string
    currentGPA?: number
    attendanceRate?: number
    upcomingAssignments?: number
    recentGrades?: any[]
  })[]

  // Family Information
  familyInfo: {
    relationship: 'father' | 'mother' | 'guardian' | 'other'
    occupation?: string | null
    employer?: string | null
    workPhone?: string | null
    emergencyContact: boolean
    primaryContact: boolean
  }

  // Parenting Information
  parentingInfo?: {
    relationship: string
    occupation?: string | null
    employer?: string | null
    medicalInfo?: Record<string, any> // Temporary for mock data
  }

  // Engagement Metrics
  engagement: {
    meetingsAttended: number
    eventsParticipated: number
    volunteerHours: number
    messagesExchanged: number
    lastInteraction?: Date | null
  }

  // Engagement Metrics alias
  engagementMetrics?: {
    meetingsAttended: number
    eventsParticipated: number
    volunteerHours: number
    messagesExchanged: number
    messagesSent?: number // Temporary for mock data
    eventsAttended?: number // Alias for eventsParticipated
    parentTeacherMeetings?: number // Alias for meetingsAttended
    schoolActivitiesParticipation?: number // Temporary for mock data
  }

  // Financial Summary
  financialSummary?: {
    totalDue: number
    totalPaid: number
    balance: number
    pendingAmount?: number // Alias for balance
    nextPaymentDate?: Date | null // Temporary for mock data
    totalFeesDue?: number // Alias for totalDue
  }

  // Contribution Data
  contributionData?: Array<{
    month: string
    amount: number
  }>

  // Children Overview
  childrenOverview: ChildOverview[]
}

/**
 * Child overview for parent dashboard
 */
export interface ChildOverview {
  studentId: string
  name: string
  grade: string
  section: string
  attendanceRate: number
  academicPerformance: 'excellent' | 'good' | 'average' | 'needs_improvement'
  upcomingEvents: number
  pendingFees?: number | null
  recentActivity: ActivityItem[]
}

// ============================================================================
// Staff Profile
// ============================================================================

export interface StaffProfile extends BaseProfile {
  type: UserProfileType.STAFF

  // Staff Information
  staffInfo: {
    employeeId: string
    department: string
    designation: string
    role: string
    joiningDate: Date
    employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT'
    employmentStatus: 'ACTIVE' | 'ON_LEAVE' | 'RESIGNED'
    reportingTo?: string | null
    responsibilities: string[]
  }

  // Work Metrics
  workMetrics: {
    tasksCompleted: number
    tasksInProgress: number
    projectsHandled: number
    efficiency?: number | null
  }

  // Schedule
  schedule: {
    workingHours: string
    currentShift?: string
    availability: AvailabilityStatus
  }
}

// ============================================================================
// GitHub-Style Contribution Data
// ============================================================================

/**
 * Contribution data for activity heatmap
 */
export interface ContributionData {
  totalContributions: number
  currentStreak: number
  longestStreak: number
  contributions: DailyContribution[]
  monthlyStats: MonthlyStats[]
}

/**
 * Daily contribution entry
 */
export interface DailyContribution {
  date: string // YYYY-MM-DD
  count: number
  level: 0 | 1 | 2 | 3 | 4 // GitHub-style intensity levels
  details?: {
    assignments?: number
    attendance?: number
    activities?: number
    achievements?: number
  }
}

/**
 * Monthly statistics
 */
export interface MonthlyStats {
  month: string // YYYY-MM
  totalContributions: number
  averagePerDay: number
  mostActiveDay?: string
  categories: {
    academic: number
    extracurricular: number
    social: number
    other: number
  }
}

// ============================================================================
// Profile Components Configuration
// ============================================================================

/**
 * Tab configuration for profile views
 */
export interface ProfileTab {
  id: string
  label: string
  icon?: string
  component: string
  permissions?: string[]
  visible?: boolean
}

/**
 * Profile section configuration
 */
export interface ProfileSection {
  id: string
  title: string
  description?: string
  component: string
  order: number
  collapsible?: boolean
  defaultExpanded?: boolean
}

/**
 * Profile theme configuration
 */
export interface ProfileTheme {
  primaryColor?: string
  accentColor?: string
  backgroundImage?: string
  backgroundPattern?: string
  cardStyle?: 'flat' | 'elevated' | 'bordered'
  layout?: 'classic' | 'modern' | 'compact'
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Profile API response wrapper
 */
export interface ProfileResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  metadata?: {
    timestamp: Date
    version: string
    [key: string]: any
  }
}

/**
 * Profile update request
 */
export interface ProfileUpdateRequest {
  displayName?: string
  bio?: string
  avatar?: string
  coverImage?: string
  socialLinks?: Partial<SocialLinks>
  settings?: Partial<ProfileSettings>
  customFields?: Record<string, any>
}

/**
 * Profile search/filter parameters
 */
export interface ProfileSearchParams {
  query?: string
  type?: UserProfileType
  department?: string
  grade?: string
  skills?: string[]
  sortBy?: 'name' | 'joinedAt' | 'lastActive' | 'popularity'
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Extract profile type from user role
 */
export type ProfileTypeFromRole<R extends string> =
  R extends 'STUDENT' ? StudentProfile :
  R extends 'TEACHER' ? TeacherProfile :
  R extends 'GUARDIAN' ? ParentProfile :
  R extends 'STAFF' | 'ACCOUNTANT' ? StaffProfile :
  BaseProfile

/**
 * Profile permissions
 */
export interface ProfilePermissions {
  canView: boolean
  canEdit: boolean
  canDelete: boolean
  canMessage: boolean
  canConnect: boolean
  canEndorse: boolean
  canReport: boolean
}

/**
 * Profile connection status
 */
export type ConnectionStatus = 'connected' | 'pending' | 'requested' | 'blocked' | 'none'

/**
 * Profile notification preferences
 */
export interface NotificationPreferences {
  profileViews: boolean
  connectionRequests: boolean
  messages: boolean
  endorsements: boolean
  achievements: boolean
  academicUpdates: boolean
  announcements: boolean
}