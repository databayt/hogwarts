// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Exam System Permission Layer
 *
 * Centralized permission checks for all exam blocks:
 * - Role-based access control (RBAC)
 * - Resource ownership verification
 * - Fine-grained permissions
 * - Multi-tenant safety
 */

import { auth } from "@/auth"
import type { Prisma } from "@prisma/client"

import { db } from "@/lib/db"
import { getStudentScopes, getTeacherPairs } from "@/lib/teaching-scope"

import { studentExamsWhere, teacherExamsWhere } from "./audience"
import { examReachesStudents } from "./roster"

// Permission types
export type Permission =
  | "exam:create"
  | "exam:read"
  | "exam:update"
  | "exam:delete"
  | "exam:publish"
  | "question:create"
  | "question:read"
  | "question:update"
  | "question:delete"
  | "question:import"
  | "question:export"
  | "template:create"
  | "template:read"
  | "template:update"
  | "template:delete"
  | "result:create"
  | "result:read"
  | "result:update"
  | "result:delete"
  | "result:export"
  | "result:batch_generate"
  | "marking:create"
  | "marking:read"
  | "marking:update"
  | "marking:override"
  | "analytics:read"
  | "analytics:export"
  | "certificate:create"
  | "certificate:read"
  | "certificate:verify"
  | "certificate:revoke"

// Role definitions with permissions
const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  DEVELOPER: [
    // Full access to everything
    "exam:create",
    "exam:read",
    "exam:update",
    "exam:delete",
    "exam:publish",
    "question:create",
    "question:read",
    "question:update",
    "question:delete",
    "question:import",
    "question:export",
    "template:create",
    "template:read",
    "template:update",
    "template:delete",
    "result:create",
    "result:read",
    "result:update",
    "result:delete",
    "result:export",
    "result:batch_generate",
    "marking:create",
    "marking:read",
    "marking:update",
    "marking:override",
    "analytics:read",
    "analytics:export",
    "certificate:create",
    "certificate:read",
    "certificate:verify",
    "certificate:revoke",
  ],
  ADMIN: [
    // School administrator - full access within their school
    "exam:create",
    "exam:read",
    "exam:update",
    "exam:delete",
    "exam:publish",
    "question:create",
    "question:read",
    "question:update",
    "question:delete",
    "question:import",
    "question:export",
    "template:create",
    "template:read",
    "template:update",
    "template:delete",
    "result:create",
    "result:read",
    "result:update",
    "result:delete",
    "result:export",
    "result:batch_generate",
    "marking:create",
    "marking:read",
    "marking:update",
    "marking:override",
    "analytics:read",
    "analytics:export",
    "certificate:create",
    "certificate:read",
    "certificate:verify",
    "certificate:revoke",
  ],
  TEACHER: [
    // Teachers - can manage exams for their subjects/classes
    "exam:create",
    "exam:read",
    "exam:update",
    "exam:delete",
    "question:create",
    "question:read",
    "question:update",
    "question:delete",
    "question:import",
    "question:export",
    "template:create",
    "template:read",
    "template:update",
    "template:delete",
    "result:create",
    "result:read",
    "result:update",
    "result:export",
    "marking:create",
    "marking:read",
    "marking:update",
    "analytics:read",
    "certificate:create",
    "certificate:read",
  ],
  ACCOUNTANT: [
    // Accountants - read-only access to results and analytics
    "exam:read",
    "result:read",
    "result:export",
    "analytics:read",
    "analytics:export",
  ],
  STUDENT: [
    // Students - can only view their own results
    "exam:read", // Limited to published exams
    "result:read", // Limited to own results
    "question:read", // Limited to practice questions
    "certificate:read", // Limited to own certificates
  ],
  GUARDIAN: [
    // Parents - can view their children's results
    "exam:read", // Limited to their children's exams
    "result:read", // Limited to their children's results
    "certificate:read", // Limited to their children's certificates
  ],
  STAFF: [
    // General staff - limited read access
    "exam:read",
    "analytics:read",
  ],
}

// Context for permission checks
export interface PermissionContext {
  userId: string
  userRole: string
  schoolId: string
  isTeacher?: boolean
  teacherId?: string
  isStudent?: boolean
  studentId?: string
  isGuardian?: boolean
  guardianId?: string
}

/**
 * Get current user's permission context
 */
export async function getPermissionContext(): Promise<PermissionContext | null> {
  const session = await auth()
  if (!session?.user) return null

  const user = session.user
  const context: PermissionContext = {
    userId: user.id!,
    userRole: user.role || "USER",
    schoolId: user.schoolId!,
  }

  // Check if user is a teacher
  if (user.role === "TEACHER") {
    const teacher = await db.teacher.findFirst({
      where: {
        userId: user.id,
        schoolId: user.schoolId,
      },
    })
    if (teacher) {
      context.isTeacher = true
      context.teacherId = teacher.id
    }
  }

  // Check if user is a student
  if (user.role === "STUDENT") {
    const student = await db.student.findFirst({
      where: {
        userId: user.id,
        schoolId: user.schoolId,
      },
    })
    if (student) {
      context.isStudent = true
      context.studentId = student.id
    }
  }

  // Check if user is a guardian
  if (user.role === "GUARDIAN") {
    const guardian = await db.guardian.findFirst({
      where: {
        userId: user.id,
        schoolId: user.schoolId,
      },
    })
    if (guardian) {
      context.isGuardian = true
      context.guardianId = guardian.id
    }
  }

  return context
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(
  context: PermissionContext,
  permission: Permission
): boolean {
  const rolePermissions = ROLE_PERMISSIONS[context.userRole] || []
  return rolePermissions.includes(permission)
}

/** Exams a teacher may open — see `teacherExamsWhere`. */
async function teacherExamFilter(
  context: PermissionContext
): Promise<Prisma.SchoolExamWhereInput> {
  const pairs = await getTeacherPairs(context.schoolId, context.teacherId!)
  return teacherExamsWhere({
    teacherId: context.teacherId!,
    userId: context.userId,
    pairs,
  })
}

/** The teacher is assigned this subject. */
async function teacherTeachesSubject(
  context: PermissionContext,
  subjectId: string
): Promise<boolean> {
  const assigned = await db.subjectTeacher.findFirst({
    where: {
      schoolId: context.schoolId,
      teacherId: context.teacherId!,
      subjectId,
    },
    select: { id: true },
  })
  return !!assigned
}

/** The student is in a section the teacher teaches. */
async function teacherTeachesStudent(
  context: PermissionContext,
  studentId: string
): Promise<boolean> {
  const pairs = await getTeacherPairs(context.schoolId, context.teacherId!)
  const sectionIds = [...new Set(pairs.map((p) => p.sectionId))]
  if (sectionIds.length === 0) return false
  const student = await db.student.findFirst({
    where: {
      id: studentId,
      schoolId: context.schoolId,
      sectionId: { in: sectionIds },
    },
    select: { id: true },
  })
  return !!student
}

/**
 * Check if user can access an exam
 */
export async function canAccessExam(
  context: PermissionContext,
  examId: string
): Promise<boolean> {
  // Developers have full access
  if (context.userRole === "DEVELOPER") return true

  // Check exam exists in user's school
  const exam = await db.schoolExam.findFirst({
    where: {
      id: examId,
      schoolId: context.schoolId,
    },
  })

  if (!exam) return false

  // Admins can access all exams in their school
  if (context.userRole === "ADMIN") return true

  // Teachers: exams they wrote, and exams for
  // a section or grade where they teach the subject.
  if (context.isTeacher && context.teacherId) {
    const covered = await db.schoolExam.findFirst({
      where: {
        id: examId,
        schoolId: context.schoolId,
        ...(await teacherExamFilter(context)),
      },
      select: { id: true },
    })
    if (covered) return true
  }

  // Students see the published results of exams they sat.
  if (context.isStudent && context.studentId) {
    if (exam.status !== "COMPLETED") return false
    return examReachesStudents(context.schoolId, examId, [context.studentId])
  }

  // Guardians: exams their children sit.
  if (context.isGuardian && context.guardianId) {
    const children = await db.studentGuardian.findMany({
      where: { guardianId: context.guardianId, schoolId: context.schoolId },
      select: { studentId: true },
    })
    return examReachesStudents(
      context.schoolId,
      examId,
      children.map((c) => c.studentId)
    )
  }

  // Staff can view completed exams
  if (context.userRole === "STAFF") {
    return exam.status === "COMPLETED"
  }

  return false
}

/**
 * Check if user can modify an exam
 */
export async function canModifyExam(
  context: PermissionContext,
  examId: string
): Promise<boolean> {
  if (!hasPermission(context, "exam:update")) return false

  // Developers and Admins can modify any exam
  if (["DEVELOPER", "ADMIN"].includes(context.userRole)) return true

  // Teachers modify the exams they may open (see canAccessExam).
  if (context.isTeacher && context.teacherId) {
    const exam = await db.schoolExam.findFirst({
      where: {
        id: examId,
        schoolId: context.schoolId,
        ...(await teacherExamFilter(context)),
      },
      select: { id: true },
    })
    return !!exam
  }

  return false
}

/**
 * Check if user can access student results
 */
export async function canAccessStudentResult(
  context: PermissionContext,
  studentId: string,
  examId?: string
): Promise<boolean> {
  // Developers and Admins have full access
  if (["DEVELOPER", "ADMIN"].includes(context.userRole)) return true

  // Teachers: students of a section they teach.
  if (context.isTeacher && context.teacherId) {
    if (await teacherTeachesStudent(context, studentId)) return true
  }

  // Students can only access their own results
  if (context.isStudent && context.studentId === studentId) {
    return true
  }

  // Guardians can access their children's results
  if (context.isGuardian && context.guardianId) {
    const studentGuardian = await db.studentGuardian.findFirst({
      where: {
        guardianId: context.guardianId,
        studentId,
      },
    })
    return !!studentGuardian
  }

  return false
}

/**
 * Check if user can manage questions
 */
export async function canManageQuestions(
  context: PermissionContext,
  subjectId?: string
): Promise<boolean> {
  if (!hasPermission(context, "question:create")) return false

  // Developers and Admins can manage all questions
  if (["DEVELOPER", "ADMIN"].includes(context.userRole)) return true

  // Teachers can manage questions for their subjects
  if (context.isTeacher && context.teacherId && subjectId) {
    return teacherTeachesSubject(context, subjectId)
  }

  return false
}

/**
 * Check if user can access analytics
 */
export async function canAccessAnalytics(
  context: PermissionContext,
  scope: "school" | "class" | "subject" | "student",
  resourceId?: string
): Promise<boolean> {
  if (!hasPermission(context, "analytics:read")) return false

  switch (scope) {
    case "school":
      // Only Developers and Admins can see school-wide analytics
      return ["DEVELOPER", "ADMIN"].includes(context.userRole)

    case "class":
      // Teachers can see analytics for a section they teach
      if (context.isTeacher && context.teacherId && resourceId) {
        const pairs = await getTeacherPairs(context.schoolId, context.teacherId)
        return pairs.some((p) => p.sectionId === resourceId)
      }
      return ["DEVELOPER", "ADMIN"].includes(context.userRole)

    case "subject":
      // Teachers can see analytics for their subjects
      if (context.isTeacher && context.teacherId && resourceId) {
        return teacherTeachesSubject(context, resourceId)
      }
      return ["DEVELOPER", "ADMIN"].includes(context.userRole)

    case "student":
      // Students can see their own analytics
      if (context.isStudent && context.studentId === resourceId) {
        return true
      }
      // Guardians can see their children's analytics
      if (context.isGuardian && context.guardianId && resourceId) {
        const studentGuardian = await db.studentGuardian.findFirst({
          where: {
            guardianId: context.guardianId,
            studentId: resourceId,
          },
        })
        return !!studentGuardian
      }
      // Teachers can see analytics for students they teach
      if (context.isTeacher && context.teacherId && resourceId) {
        return teacherTeachesStudent(context, resourceId)
      }
      return ["DEVELOPER", "ADMIN"].includes(context.userRole)
  }

  return false
}

/**
 * Apply permission filters to queries
 */
export async function applyPermissionFilters(
  context: PermissionContext,
  resource: "exam" | "question" | "result" | "template"
): Promise<any> {
  const baseFilter: any = {
    schoolId: context.schoolId,
  }

  switch (resource) {
    case "exam":
      if (context.isTeacher && context.teacherId) {
        Object.assign(baseFilter, await teacherExamFilter(context))
      }
      if (context.isStudent) {
        baseFilter.status = "COMPLETED"
        const scopes = context.studentId
          ? await getStudentScopes(context.schoolId, [context.studentId])
          : []
        Object.assign(baseFilter, studentExamsWhere(scopes))
      }
      break

    case "question":
      if (context.isTeacher && context.teacherId) {
        baseFilter.subject = {
          subjectTeachers: {
            some: {
              teacherId: context.teacherId,
              schoolId: context.schoolId,
            },
          },
        }
      }
      break

    case "result":
      if (context.isStudent && context.studentId) {
        baseFilter.studentId = context.studentId
      }
      if (context.isGuardian && context.guardianId) {
        baseFilter.student = {
          guardians: {
            some: {
              guardianId: context.guardianId,
            },
          },
        }
      }
      break

    case "template":
      if (context.isTeacher && context.teacherId) {
        baseFilter.createdBy = context.userId
      }
      break
  }

  return baseFilter
}

/**
 * Validate permission for an action
 */
export async function validatePermission(
  permission: Permission,
  resourceId?: string
): Promise<{ allowed: boolean; reason?: string }> {
  const context = await getPermissionContext()

  if (!context) {
    return {
      allowed: false,
      reason: "Not authenticated",
    }
  }

  // Check basic permission
  if (!hasPermission(context, permission)) {
    return {
      allowed: false,
      reason: `Role ${context.userRole} does not have ${permission} permission`,
    }
  }

  // Additional resource-specific checks
  if (resourceId) {
    switch (permission) {
      case "exam:read":
      case "exam:update":
      case "exam:delete":
        const canAccess = await canAccessExam(context, resourceId)
        if (!canAccess) {
          return {
            allowed: false,
            reason: "You do not have access to this exam",
          }
        }
        break

      case "result:read":
        const canAccessResult = await canAccessStudentResult(
          context,
          resourceId
        )
        if (!canAccessResult) {
          return {
            allowed: false,
            reason: "You do not have access to this result",
          }
        }
        break
    }
  }

  return { allowed: true }
}

/**
 * Permission guard for server actions
 */
export async function withPermission<
  T extends (...args: any[]) => Promise<any>,
>(permission: Permission, action: T): Promise<T> {
  return (async (...args: Parameters<T>) => {
    const validation = await validatePermission(permission)

    if (!validation.allowed) {
      throw new Error(validation.reason || "Permission denied")
    }

    return action(...args)
  }) as T
}

/**
 * Role-based exam tab configuration
 * Returns the PageNav items each role should see
 */
export function getExamTabsForRole(
  role: string | undefined,
  lang: string,
  dictionary?: Record<string, string>
): { name: string; href: string }[] {
  const d = dictionary || {}

  const tabs = {
    overview: { name: d.overview || "Overview", href: `/${lang}/exams` },
    manage: { name: d.manage || "Manage", href: `/${lang}/exams/manage` },
    qbank: { name: d.qbank || "QBank", href: `/${lang}/exams/qbank` },
    practice: { name: d.practice || "Practice", href: `/${lang}/exams/qbank` },
    generate: {
      name: d.generate || "Generate",
      href: `/${lang}/exams/generate`,
    },
    mark: { name: d.mark || "Mark", href: `/${lang}/exams/mark` },
    results: { name: d.record || "Results", href: `/${lang}/exams/result` },
    quiz: { name: d.quiz || "Quiz", href: `/${lang}/exams/quiz` },
    mock: { name: d.mock || "Mock", href: `/${lang}/exams/mock` },
    upcoming: {
      name: d.upcoming || "Upcoming",
      href: `/${lang}/exams/upcoming`,
    },
    templates: {
      name: d.templates || "Templates",
      href: `/${lang}/exams/templates`,
    },
  }

  switch (role) {
    case "DEVELOPER":
    case "ADMIN":
      return [
        tabs.overview,
        tabs.manage,
        tabs.qbank,
        tabs.generate,
        tabs.mark,
        tabs.results,
        tabs.quiz,
        tabs.mock,
        tabs.upcoming,
        tabs.templates,
      ]
    case "TEACHER":
      return [
        tabs.overview,
        tabs.manage,
        tabs.qbank,
        tabs.generate,
        tabs.mark,
        tabs.results,
        tabs.quiz,
        tabs.mock,
        tabs.upcoming,
        tabs.templates,
      ]
    case "STUDENT":
      return [
        tabs.overview,
        tabs.practice,
        tabs.results,
        tabs.quiz,
        tabs.mock,
        tabs.upcoming,
      ]
    case "GUARDIAN":
      return [tabs.overview, tabs.results, tabs.upcoming]
    case "ACCOUNTANT":
      return [tabs.overview, tabs.results]
    case "STAFF":
      return [tabs.overview, tabs.upcoming]
    default:
      return [tabs.overview]
  }
}
