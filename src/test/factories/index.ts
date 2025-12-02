/**
 * Test Data Factories
 *
 * Factory functions for creating test data.
 * Provides consistent test data with sensible defaults and easy customization.
 *
 * @example
 * ```ts
 * import { createMockSchool, createMockUser } from '@/test/factories'
 *
 * const school = createMockSchool({ name: 'Custom School' })
 * const admin = createMockUser({ role: 'ADMIN', schoolId: school.id })
 * ```
 */

import type {
  School,
  User,
  Teacher,
  Student,
  Class,
  Attendance,
  Timetable,
  Announcement,
  Exam,
  Subject,
} from '@prisma/client'

/**
 * Generate unique ID with prefix
 */
let idCounter = 0
function generateId(prefix: string): string {
  idCounter++
  return `${prefix}${idCounter}`
}

/**
 * Reset ID counter (useful in beforeEach)
 */
export function resetIdCounter() {
  idCounter = 0
}

/**
 * Mock School Factory
 *
 * Creates a mock school object with sensible defaults.
 */
export function createMockSchool(overrides?: Partial<School>): School {
  const id = overrides?.id ?? generateId('s')
  return {
    id,
    name: overrides?.name ?? `Test School ${id}`,
    domain: overrides?.domain ?? `school${id}`,
    email: overrides?.email ?? `admin@school${id}.com`,
    phoneNumber: overrides?.phoneNumber ?? '+1234567890',
    address: overrides?.address ?? '123 Test St',
    logoUrl: overrides?.logoUrl ?? null,
    website: overrides?.website ?? null,
    isActive: overrides?.isActive ?? true,
    planType: overrides?.planType ?? 'basic',
    maxStudents: overrides?.maxStudents ?? 500,
    maxTeachers: overrides?.maxTeachers ?? 50,
    createdAt: overrides?.createdAt ?? new Date('2024-01-01'),
    updatedAt: overrides?.updatedAt ?? new Date('2024-01-01'),
    timezone: overrides?.timezone ?? 'UTC',
  }
}

/**
 * Mock User Factory
 *
 * Creates a mock user object with sensible defaults.
 */
export function createMockUser(overrides?: Partial<User>): User {
  const id = overrides?.id ?? generateId('u')
  const role = overrides?.role ?? 'ADMIN'
  const schoolId = overrides?.schoolId ?? 's1'

  return {
    id,
    username: overrides?.username ?? `testuser${id}`,
    email: overrides?.email ?? `user${id}@test.com`,
    emailVerified: overrides?.emailVerified ?? new Date(),
    image: overrides?.image ?? null,
    password: overrides?.password ?? null,
    role,
    schoolId,
    isTwoFactorEnabled: overrides?.isTwoFactorEnabled ?? false,
    createdAt: overrides?.createdAt ?? new Date('2024-01-01'),
    updatedAt: overrides?.updatedAt ?? new Date('2024-01-01'),
    stripeSubscriptionId: overrides?.stripeSubscriptionId ?? null,
    stripeCustomerId: overrides?.stripeCustomerId ?? null,
    stripePriceId: overrides?.stripePriceId ?? null,
    stripeCurrentPeriodEnd: overrides?.stripeCurrentPeriodEnd ?? null,
  }
}

/**
 * Mock Teacher Factory
 */
export function createMockTeacher(overrides?: Partial<Teacher>): Teacher {
  const id = overrides?.id ?? generateId('t')
  const schoolId = overrides?.schoolId ?? 's1'

  return {
    id,
    userId: overrides?.userId ?? `u${id}`,
    schoolId,
    employeeId: overrides?.employeeId ?? `EMP${id}`,
    givenName: overrides?.givenName ?? 'John',
    surname: overrides?.surname ?? 'Doe',
    gender: overrides?.gender ?? 'male',
    emailAddress: overrides?.emailAddress ?? `teacher${id}@test.com`,
    birthDate: overrides?.birthDate ?? new Date('1985-01-01'),
    joiningDate: overrides?.joiningDate ?? new Date('2020-01-01'),
    employmentStatus: overrides?.employmentStatus ?? 'ACTIVE',
    employmentType: overrides?.employmentType ?? 'FULL_TIME',
    contractStartDate: overrides?.contractStartDate ?? null,
    contractEndDate: overrides?.contractEndDate ?? null,
    profilePhotoUrl: overrides?.profilePhotoUrl ?? null,
    createdAt: overrides?.createdAt ?? new Date('2024-01-01'),
    updatedAt: overrides?.updatedAt ?? new Date('2024-01-01'),
  }
}

/**
 * Mock Student Factory
 */
export function createMockStudent(overrides?: Partial<Student>): Student {
  const id = overrides?.id ?? generateId('st')
  const schoolId = overrides?.schoolId ?? 's1'

  return {
    id,
    userId: overrides?.userId ?? `u${id}`,
    schoolId,
    grNumber: overrides?.grNumber ?? null,
    studentId: overrides?.studentId ?? `STU${id}`,
    givenName: overrides?.givenName ?? 'Jane',
    middleName: overrides?.middleName ?? null,
    surname: overrides?.surname ?? 'Smith',
    dateOfBirth: overrides?.dateOfBirth ?? new Date('2010-01-01'),
    gender: overrides?.gender ?? 'female',
    bloodGroup: overrides?.bloodGroup ?? null,
    nationality: overrides?.nationality ?? 'Saudi Arabia',
    passportNumber: overrides?.passportNumber ?? null,
    visaStatus: overrides?.visaStatus ?? null,
    visaExpiryDate: overrides?.visaExpiryDate ?? null,
    email: overrides?.email ?? null,
    mobileNumber: overrides?.mobileNumber ?? null,
    alternatePhone: overrides?.alternatePhone ?? null,
    currentAddress: overrides?.currentAddress ?? '456 Student Ave',
    permanentAddress: overrides?.permanentAddress ?? null,
    city: overrides?.city ?? null,
    state: overrides?.state ?? null,
    postalCode: overrides?.postalCode ?? null,
    country: overrides?.country ?? 'Saudi Arabia',
    emergencyContactName: overrides?.emergencyContactName ?? null,
    emergencyContactPhone: overrides?.emergencyContactPhone ?? null,
    emergencyContactRelation: overrides?.emergencyContactRelation ?? null,
    status: overrides?.status ?? 'ACTIVE',
    enrollmentDate: overrides?.enrollmentDate ?? new Date('2024-01-01'),
    admissionNumber: overrides?.admissionNumber ?? null,
    admissionDate: overrides?.admissionDate ?? null,
    graduationDate: overrides?.graduationDate ?? null,
    category: overrides?.category ?? null,
    studentType: overrides?.studentType ?? 'REGULAR',
    profilePhotoUrl: overrides?.profilePhotoUrl ?? null,
    idCardNumber: overrides?.idCardNumber ?? null,
    idCardIssuedDate: overrides?.idCardIssuedDate ?? null,
    idCardBarcode: overrides?.idCardBarcode ?? null,
    medicalConditions: overrides?.medicalConditions ?? null,
    allergies: overrides?.allergies ?? null,
    medicationRequired: overrides?.medicationRequired ?? null,
    doctorName: overrides?.doctorName ?? null,
    doctorContact: overrides?.doctorContact ?? null,
    insuranceProvider: overrides?.insuranceProvider ?? null,
    insuranceNumber: overrides?.insuranceNumber ?? null,
    previousSchoolName: overrides?.previousSchoolName ?? null,
    previousSchoolAddress: overrides?.previousSchoolAddress ?? null,
    previousGrade: overrides?.previousGrade ?? null,
    transferCertificateNo: overrides?.transferCertificateNo ?? null,
    transferDate: overrides?.transferDate ?? null,
    previousAcademicRecord: overrides?.previousAcademicRecord ?? null,
    createdAt: overrides?.createdAt ?? new Date('2024-01-01'),
    updatedAt: overrides?.updatedAt ?? new Date('2024-01-01'),
  }
}

/**
 * Mock Class Factory
 */
export function createMockClass(overrides?: Partial<Class>): Class {
  const id = overrides?.id ?? generateId('c')
  const schoolId = overrides?.schoolId ?? 's1'

  return {
    id,
    schoolId,
    subjectId: overrides?.subjectId ?? `sub${id}`,
    teacherId: overrides?.teacherId ?? 't1',
    termId: overrides?.termId ?? 'term1',
    startPeriodId: overrides?.startPeriodId ?? 'period1',
    endPeriodId: overrides?.endPeriodId ?? 'period2',
    classroomId: overrides?.classroomId ?? 'classroom1',
    name: overrides?.name ?? `Class ${id}`,
    courseCode: overrides?.courseCode ?? null,
    credits: overrides?.credits ?? null,
    evaluationType: overrides?.evaluationType ?? 'NORMAL',
    minCapacity: overrides?.minCapacity ?? 10,
    maxCapacity: overrides?.maxCapacity ?? 50,
    duration: overrides?.duration ?? null,
    prerequisiteId: overrides?.prerequisiteId ?? null,
    createdAt: overrides?.createdAt ?? new Date('2024-01-01'),
    updatedAt: overrides?.updatedAt ?? new Date('2024-01-01'),
  }
}

/**
 * Mock Subject Factory
 */
export function createMockSubject(overrides?: Partial<Subject>): Subject {
  const id = overrides?.id ?? generateId('sub')
  const schoolId = overrides?.schoolId ?? 's1'

  return {
    id,
    schoolId,
    departmentId: overrides?.departmentId ?? 'dept1',
    subjectName: overrides?.subjectName ?? `Subject ${id}`,
    createdAt: overrides?.createdAt ?? new Date('2024-01-01'),
    updatedAt: overrides?.updatedAt ?? new Date('2024-01-01'),
  }
}

/**
 * Mock Attendance Factory
 */
export function createMockAttendance(overrides?: Partial<Attendance>): Attendance {
  const id = overrides?.id ?? generateId('a')
  const schoolId = overrides?.schoolId ?? 's1'

  return {
    id,
    schoolId,
    studentId: overrides?.studentId ?? 'st1',
    classId: overrides?.classId ?? 'c1',
    date: overrides?.date ?? new Date('2024-01-01'),
    status: overrides?.status ?? 'PRESENT',
    notes: overrides?.notes ?? null,
    markedBy: overrides?.markedBy ?? 'u1',
    markedAt: overrides?.markedAt ?? new Date('2024-01-01'),
    method: overrides?.method ?? 'MANUAL',
    deviceId: overrides?.deviceId ?? null,
    checkInTime: overrides?.checkInTime ?? null,
    checkOutTime: overrides?.checkOutTime ?? null,
    location: overrides?.location ?? null,
    confidence: overrides?.confidence ?? null,
    createdAt: overrides?.createdAt ?? new Date('2024-01-01'),
    updatedAt: overrides?.updatedAt ?? new Date('2024-01-01'),
  }
}

/**
 * Mock Timetable Factory
 */
export function createMockTimetable(overrides?: Partial<Timetable>): Timetable {
  const id = overrides?.id ?? generateId('tt')
  const schoolId = overrides?.schoolId ?? 's1'

  return {
    id,
    schoolId,
    termId: overrides?.termId ?? 'term1',
    dayOfWeek: overrides?.dayOfWeek ?? 1,
    periodId: overrides?.periodId ?? 'period1',
    classId: overrides?.classId ?? 'c1',
    teacherId: overrides?.teacherId ?? 't1',
    classroomId: overrides?.classroomId ?? 'classroom1',
    weekOffset: overrides?.weekOffset ?? 0,
    createdAt: overrides?.createdAt ?? new Date('2024-01-01'),
    updatedAt: overrides?.updatedAt ?? new Date('2024-01-01'),
  }
}

/**
 * Mock Announcement Factory
 */
export function createMockAnnouncement(overrides?: Partial<Announcement>): Announcement {
  const id = overrides?.id ?? generateId('an')
  const schoolId = overrides?.schoolId ?? 's1'

  return {
    id,
    schoolId,
    titleEn: overrides?.titleEn ?? `Announcement ${id}`,
    titleAr: overrides?.titleAr ?? null,
    bodyEn: overrides?.bodyEn ?? 'Test announcement content',
    bodyAr: overrides?.bodyAr ?? null,
    scope: overrides?.scope ?? 'school',
    priority: overrides?.priority ?? 'normal',
    createdBy: overrides?.createdBy ?? 'u1',
    classId: overrides?.classId ?? null,
    role: overrides?.role ?? null,
    published: overrides?.published ?? true,
    publishedAt: overrides?.publishedAt ?? new Date('2024-01-01'),
    scheduledFor: overrides?.scheduledFor ?? null,
    expiresAt: overrides?.expiresAt ?? null,
    pinned: overrides?.pinned ?? false,
    featured: overrides?.featured ?? false,
    createdAt: overrides?.createdAt ?? new Date('2024-01-01'),
    updatedAt: overrides?.updatedAt ?? new Date('2024-01-01'),
  }
}

/**
 * Mock Exam Factory
 */
export function createMockExam(overrides?: Partial<Exam>): Exam {
  const id = overrides?.id ?? generateId('e')
  const schoolId = overrides?.schoolId ?? 's1'

  return {
    id,
    schoolId,
    title: overrides?.title ?? `Exam ${id}`,
    description: overrides?.description ?? null,
    classId: overrides?.classId ?? 'c1',
    subjectId: overrides?.subjectId ?? 'sub1',
    examDate: overrides?.examDate ?? new Date('2024-06-01'),
    startTime: overrides?.startTime ?? '09:00',
    endTime: overrides?.endTime ?? '11:00',
    duration: overrides?.duration ?? 120,
    totalMarks: overrides?.totalMarks ?? 100,
    passingMarks: overrides?.passingMarks ?? 50,
    examType: overrides?.examType ?? 'MIDTERM',
    instructions: overrides?.instructions ?? null,
    status: overrides?.status ?? 'PLANNED',
    createdAt: overrides?.createdAt ?? new Date('2024-01-01'),
    updatedAt: overrides?.updatedAt ?? new Date('2024-01-01'),
  }
}

/**
 * Batch Factory Function
 *
 * Creates multiple instances of a factory.
 *
 * @example
 * ```ts
 * const schools = createBatch(createMockSchool, 5)
 * const students = createBatch(createMockStudent, 10, { schoolId: 's1' })
 * ```
 */
export function createBatch<T>(
  factory: (overrides?: any) => T,
  count: number,
  overrides?: any
): T[] {
  return Array.from({ length: count }, () => factory(overrides))
}

/**
 * Create Related Entities
 *
 * Helper to create a school with related users, teachers, and students.
 *
 * @example
 * ```ts
 * const { school, admin, teachers, students } = createSchoolWithEntities({
 *   teacherCount: 5,
 *   studentCount: 20
 * })
 * ```
 */
export function createSchoolWithEntities(options?: {
  schoolOverrides?: Partial<School>
  teacherCount?: number
  studentCount?: number
}) {
  const school = createMockSchool(options?.schoolOverrides)
  const admin = createMockUser({ schoolId: school.id, role: 'ADMIN' })
  const teachers = createBatch(
    createMockTeacher,
    options?.teacherCount ?? 3,
    { schoolId: school.id }
  )
  const students = createBatch(
    createMockStudent,
    options?.studentCount ?? 10,
    { schoolId: school.id }
  )

  return { school, admin, teachers, students }
}
