import { db } from "@/lib/db"

import type {
  MembershipRequestRow,
  MembershipStats,
  UnifiedMember,
} from "./types"

export async function getUnifiedMembers(
  schoolId: string
): Promise<UnifiedMember[]> {
  const users = await db.user.findMany({
    where: { schoolId },
    include: {
      student: {
        select: {
          id: true,
          givenName: true,
          surname: true,
          email: true,
          status: true,
          academicGradeId: true,
          academicGrade: { select: { name: true } },
          section: { select: { name: true } },
          _count: { select: { studentClasses: true } },
        },
      },
      teacher: {
        select: {
          id: true,
          givenName: true,
          surname: true,
          emailAddress: true,
          employmentStatus: true,
          teacherDepartments: {
            where: { isPrimary: true },
            select: { department: { select: { departmentName: true } } },
            take: 1,
          },
          _count: { select: { classes: true } },
        },
      },
      staffMember: {
        select: {
          id: true,
          givenName: true,
          surname: true,
          emailAddress: true,
          employmentStatus: true,
          position: true,
        },
      },
      guardian: {
        select: {
          id: true,
          givenName: true,
          surname: true,
          emailAddress: true,
          _count: { select: { studentGuardians: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return users.map((user) => {
    // Name resolution: role-specific > username > email
    let name = user.username || user.email || "Unknown"
    if (user.student) {
      name =
        [user.student.givenName, user.student.surname]
          .filter(Boolean)
          .join(" ") || name
    } else if (user.teacher) {
      name =
        [user.teacher.givenName, user.teacher.surname]
          .filter(Boolean)
          .join(" ") || name
    } else if (user.staffMember) {
      name =
        [user.staffMember.givenName, user.staffMember.surname]
          .filter(Boolean)
          .join(" ") || name
    } else if (user.guardian) {
      name =
        [user.guardian.givenName, user.guardian.surname]
          .filter(Boolean)
          .join(" ") || name
    }

    // Role-specific status
    let roleSpecificStatus: string | null = null
    if (user.student) roleSpecificStatus = user.student.status
    else if (user.teacher) roleSpecificStatus = user.teacher.employmentStatus
    else if (user.staffMember)
      roleSpecificStatus = user.staffMember.employmentStatus

    // Member status
    let memberStatus: "active" | "suspended" | "inactive" = "active"
    if (user.isSuspended) memberStatus = "suspended"
    else if (!user.emailVerified) memberStatus = "inactive"

    // Resolve personal email from profile models (prefer over login email)
    let personalEmail = user.email
    if (user.student?.email) personalEmail = user.student.email
    else if (user.teacher?.emailAddress)
      personalEmail = user.teacher.emailAddress
    else if (user.staffMember?.emailAddress)
      personalEmail = user.staffMember.emailAddress
    else if (user.guardian?.emailAddress)
      personalEmail = user.guardian.emailAddress

    // Build contextual info
    let contextInfo: string | null = null
    if (user.student) {
      const parts: string[] = []
      if (user.student.section?.name) parts.push(user.student.section.name)
      else if (user.student.academicGrade?.name)
        parts.push(user.student.academicGrade.name)
      if (user.student._count.studentClasses > 0)
        parts.push(`${user.student._count.studentClasses} classes`)
      contextInfo = parts.length > 0 ? parts.join(" · ") : null
    } else if (user.teacher) {
      const parts: string[] = []
      if (user.teacher._count.classes > 0)
        parts.push(`${user.teacher._count.classes} classes`)
      const primaryDept = user.teacher.teacherDepartments[0]
      if (primaryDept) parts.push(primaryDept.department.departmentName)
      contextInfo = parts.length > 0 ? parts.join(" · ") : null
    } else if (user.staffMember) {
      contextInfo = user.staffMember.position || null
    } else if (user.guardian) {
      if (user.guardian._count.studentGuardians > 0)
        contextInfo = `${user.guardian._count.studentGuardians} children`
    }

    return {
      id: user.id,
      name,
      email: personalEmail,
      role: user.role,
      memberStatus,
      roleSpecificStatus,
      joinedAt: user.createdAt,
      emailVerified: !!user.emailVerified,
      image: user.image,
      studentId: user.student?.id ?? null,
      teacherId: user.teacher?.id ?? null,
      staffMemberId: user.staffMember?.id ?? null,
      guardianId: user.guardian?.id ?? null,
      gradeName: user.student?.academicGrade?.name ?? null,
      academicGradeId: user.student?.academicGradeId ?? null,
      contextInfo,
    }
  })
}

export async function getMembershipStats(
  schoolId: string
): Promise<MembershipStats> {
  const [total, suspended, pendingRequests, users] = await Promise.all([
    db.user.count({ where: { schoolId } }),
    db.user.count({ where: { schoolId, isSuspended: true } }),
    db.membershipRequest.count({
      where: { schoolId, status: "PENDING" },
    }),
    db.user.findMany({
      where: { schoolId },
      select: { role: true, isSuspended: true },
    }),
  ])

  const active = users.filter((u) => !u.isSuspended).length
  const roleDistribution: Record<string, number> = {}
  for (const user of users) {
    roleDistribution[user.role] = (roleDistribution[user.role] || 0) + 1
  }

  return {
    total,
    active,
    suspended,
    pending: pendingRequests,
    roleDistribution,
  }
}

export async function getPendingRequests(
  schoolId: string
): Promise<MembershipRequestRow[]> {
  const requests = await db.membershipRequest.findMany({
    where: { schoolId, status: "PENDING" },
    orderBy: { createdAt: "desc" },
  })

  return requests.map((r) => ({
    id: r.id,
    email: r.email,
    name: r.name,
    requestedRole: r.requestedRole,
    status: r.status,
    joinMethod: r.joinMethod,
    createdAt: r.createdAt,
  }))
}

export async function getAcademicGrades(schoolId: string) {
  return db.academicGrade.findMany({
    where: { schoolId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })
}
