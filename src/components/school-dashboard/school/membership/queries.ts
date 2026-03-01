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
          status: true,
          academicGradeId: true,
          academicGrade: { select: { name: true } },
        },
      },
      teacher: {
        select: {
          id: true,
          givenName: true,
          surname: true,
          employmentStatus: true,
        },
      },
      staffMember: {
        select: {
          id: true,
          givenName: true,
          surname: true,
          employmentStatus: true,
        },
      },
      guardian: {
        select: {
          id: true,
          givenName: true,
          surname: true,
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

    return {
      id: user.id,
      name,
      email: user.email,
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
