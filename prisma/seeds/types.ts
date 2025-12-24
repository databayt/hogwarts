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
  departmentNameAr: string
}

export interface SubjectRef {
  id: string
  subjectName: string
  subjectNameAr: string
  departmentId: string
}

export interface YearLevelRef {
  id: string
  levelName: string
  levelNameAr: string
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
  nameAr: string
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
// Bilingual Data Types
// ============================================================================

export interface BilingualText {
  ar: string
  en: string
}

export interface BilingualName {
  givenNameAr: string
  givenNameEn: string
  surnameAr: string
  surnameEn: string
}

export interface BilingualContent {
  titleAr: string
  titleEn: string
  bodyAr?: string
  bodyEn?: string
}

// ============================================================================
// Seed Data Types
// ============================================================================

export interface YearLevelData {
  nameEn: string
  nameAr: string
  order: number
  section: "KG" | "Primary" | "Intermediate" | "Secondary"
  ageRange: [number, number]
  studentsPerLevel: number
}

export interface DepartmentData {
  nameEn: string
  nameAr: string
  descriptionEn: string
  descriptionAr: string
}

export interface SubjectData {
  nameEn: string
  nameAr: string
  departmentEn: string
  levels: string[]
  descriptionEn: string
  descriptionAr: string
}

export interface TeacherData {
  givenNameAr: string
  givenNameEn: string
  surnameAr: string
  surnameEn: string
  gender: "M" | "F"
  departmentEn: string
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
  titleEn: string
  titleAr: string
  authorEn: string
  authorAr: string
  isbn: string
  category: string
  copies: number
}

export interface AnnouncementData {
  titleEn: string
  titleAr: string
  bodyEn: string
  bodyAr: string
  scope: "school" | "class" | "department"
  priority: "low" | "normal" | "high" | "urgent"
}

export interface EventData {
  titleEn: string
  titleAr: string
  descriptionEn: string
  descriptionAr: string
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
