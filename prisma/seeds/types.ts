/**
 * Seed Types
 * Shared type definitions for seed modules
 */

import type { PrismaClient } from "@prisma/client";

// Prisma client type for dependency injection
export type SeedPrisma = PrismaClient;

// School reference
export interface SchoolRef {
  id: string;
  name: string;
  domain: string;
}

// User reference
export interface UserRef {
  id: string;
  email: string;
  role: string;
}

// Teacher reference
export interface TeacherRef {
  id: string;
  userId: string;
  emailAddress: string;
}

// Student reference
export interface StudentRef {
  id: string;
  userId: string;
}

// Guardian reference
export interface GuardianRef {
  id: string;
}

// Department reference
export interface DepartmentRef {
  id: string;
  departmentName: string;
}

// Subject reference
export interface SubjectRef {
  id: string;
  subjectName: string;
}

// Year level reference
export interface YearLevelRef {
  id: string;
  levelName: string;
}

// Period reference
export interface PeriodRef {
  id: string;
}

// Classroom reference
export interface ClassroomRef {
  id: string;
}

// Class reference
export interface ClassRef {
  id: string;
  name: string;
}

// Guardian types reference
export interface GuardianTypesRef {
  gtFather: { id: string };
  gtMother: { id: string };
}

// School year reference
export interface SchoolYearRef {
  id: string;
}

// Term reference
export interface TermRef {
  id: string;
}

// Seed context passed between modules
export interface SeedContext {
  prisma: SeedPrisma;
  school: SchoolRef;
  users: UserRef[];
  teachers: TeacherRef[];
  students: StudentRef[];
  guardians: GuardianRef[];
  departments: DepartmentRef[];
  subjects: SubjectRef[];
  yearLevels: YearLevelRef[];
  periods: PeriodRef[];
  classrooms: ClassroomRef[];
  classes: ClassRef[];
  guardianTypes: GuardianTypesRef;
  schoolYear: SchoolYearRef;
  term1: TermRef;
  term2: TermRef;
}

// Partial context for early stages
export type PartialSeedContext = Partial<SeedContext> & { prisma: SeedPrisma };
