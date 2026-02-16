/**
 * Seed System Types
 * Shared TypeScript interfaces for the seed system
 */

import type { PrismaClient } from "@prisma/client"

// ============================================================================
// Core References (lightweight ID containers for dependency passing)
// ============================================================================

export interface SchoolRef {
  id: string
  name: string
  domain: string
  schoolLevel?: string | null
}

export interface UserRef {
  id: string
  email: string
  role: string
}

export interface TeacherRef {
  id: string
  userId: string
  emailAddress: string
  givenName: string
  surname: string
}

export interface StudentRef {
  id: string
  userId: string
  grNumber: string
  givenName: string
  surname: string
  yearLevelId?: string
}

export interface GuardianRef {
  id: string
  givenName: string
  surname: string
}

// ============================================================================
// Academic References
// ============================================================================

export interface DepartmentRef {
  id: string
  departmentName: string
  lang: string
}

export interface SubjectRef {
  id: string
  subjectName: string
  lang: string
  departmentId: string
}

export interface CatalogSubjectRef {
  id: string
  name: string
  slug: string
}

export interface YearLevelRef {
  id: string
  levelName: string
  lang: string
  levelOrder: number
}

export interface ClassroomRef {
  id: string
  name: string
  capacity: number
}

export interface ClassRef {
  id: string
  name: string
  lang: string
  subjectId: string
  yearLevelId: string
}

export interface PeriodRef {
  id: string
  name: string
  startTime: string
  endTime: string
}

// ============================================================================
// Temporal References
// ============================================================================

export interface SchoolYearRef {
  id: string
  yearName: string
  startDate: Date
  endDate: Date
}

export interface TermRef {
  id: string
  termNumber: number
  startDate: Date
  endDate: Date
}

// ============================================================================
// Seed Context (passed between phases)
// ============================================================================

export interface SeedContext {
  prisma: PrismaClient
  schoolId: string
  school: SchoolRef
  users: UserRef[]
  teachers: TeacherRef[]
  students: StudentRef[]
  guardians: GuardianRef[]
  departments: DepartmentRef[]
  subjects: SubjectRef[]
  yearLevels: YearLevelRef[]
  periods: PeriodRef[]
  classrooms: ClassroomRef[]
  classes: ClassRef[]
  schoolYear: SchoolYearRef
  terms: TermRef[]
}

// Partial context for progressive building
export type PartialSeedContext = Partial<SeedContext> & {
  prisma: PrismaClient
  schoolId: string
}

// ============================================================================
// Seed Data Types
// ============================================================================

export interface YearLevelData {
  name: string // Arabic primary (e.g. "الروضة الأولى")
  lang?: string
  order: number
  section: "KG" | "Primary" | "Intermediate" | "Secondary"
  ageRange: [number, number]
  studentsPerLevel: number
}

export interface DepartmentData {
  name: string // Arabic primary (e.g. "اللغات")
  description: string // Arabic primary
  lang?: string
}

export interface SubjectData {
  name: string // Arabic primary (e.g. "اللغة العربية")
  department: string // Arabic department name (e.g. "اللغات")
  levels: string[]
  description: string // Arabic primary
  lang?: string
  imageKey?: string
  color?: string
}

export interface TopicData {
  subjectName: string
  name: string
  slug: string
  description?: string
  sequenceOrder: number
  parentName?: string
  imageKey?: string
  color?: string
  lang?: string
}

export interface TeacherData {
  givenName: string
  surname: string
  gender: "M" | "F"
  department: string // Arabic department name (e.g. "اللغات")
  specialty?: string
}

export interface ClassroomData {
  name: string
  capacity: number
  type: string
  building?: string
  floor?: number
}

export interface BookData {
  title: string // Arabic primary
  author: string // Arabic primary
  lang?: string
  isbn: string
  category: string
  copies: number
}

export interface AnnouncementData {
  title: string // Arabic primary
  body: string // Arabic primary
  lang?: string
  scope: "school" | "class" | "department"
  priority: "low" | "normal" | "high" | "urgent"
}

export interface EventData {
  title: string // Arabic primary
  description: string // Arabic primary
  lang?: string
  type: "academic" | "sports" | "cultural" | "religious" | "other"
  startDate: Date
  endDate: Date
}

// ============================================================================
// Utility Types
// ============================================================================

export type SeedFunction<T = void> = (
  prisma: PrismaClient,
  schoolId: string,
  context?: PartialSeedContext
) => Promise<T>

export interface SeedResult {
  entity: string
  count: number
  duration: number
}

export interface SeedStats {
  [key: string]: number
}
