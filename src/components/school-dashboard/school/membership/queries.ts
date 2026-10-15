import { db } from "@/lib/db"
import { displayName } from "@/lib/name-utils"
import { schoolNameDisplay } from "@/lib/school-name-format"

import type { MembershipRequestRow, UnifiedMember } from "./types"

export async function getUnifiedMembers(
  schoolId: string
): Promise<UnifiedMember[]> {
  const users = await db.user.findMany({
    where: { schoolId },
    include: {
      student: {
        select: {
          id: true,
          firstName: true,
          middleName: true,
          lastName: true,
          email: true,
          mobileNumber: true,
          alternatePhone: true,
          status: true,
          academicGradeId: true,
          academicGrade: { select: { name: true } },
          section: { select: { name: true } },
        },
      },
      teacher: {
        select: {
          id: true,
          firstName: true,
          middleName: true,
          lastName: true,
          emailAddress: true,
          phoneNumbers: {
            orderBy: { isPrimary: "desc" },
            take: 1,
            select: { phoneNumber: true },
          },
          employmentStatus: true,
          teacherDepartments: {
            where: { isPrimary: true },
            select: { department: { select: { departmentName: true } } },
            take: 1,
          },
          // A class taught is a section·subject assignment now
          _count: { select: { subjectTeachers: true } },
        },
      },
      staffMember: {
        select: {
          id: true,
          firstName: true,
          middleName: true,
          lastName: true,
          emailAddress: true,
          phoneNumber: true,
          alternatePhone: true,
          employmentStatus: true,
          position: true,
        },
      },
      guardian: {
        select: {
          id: true,
          firstName: true,
          middleName: true,
          lastName: true,
          emailAddress: true,
          phoneNumbers: {
            orderBy: { isPrimary: "desc" },
            take: 1,
            select: { phoneNumber: true },
          },
          _count: { select: { studentGuardians: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })
  const nameDisplay = await schoolNameDisplay(schoolId)

  return users.map((user) => {
    // Name resolution: role-specific > username > email
    let name = user.username || user.email || "Unknown"
    if (user.student) {
      name = displayName(user.student, nameDisplay) || name
    } else if (user.teacher) {
      name = displayName(user.teacher, nameDisplay) || name
    } else if (user.staffMember) {
      name = displayName(user.staffMember, nameDisplay) || name
    } else if (user.guardian) {
      name = displayName(user.guardian, nameDisplay) || name
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

    // The profile's phone — role models keep it, the login User does not
    const phone =
      user.student?.mobileNumber ||
      user.student?.alternatePhone ||
      user.teacher?.phoneNumbers[0]?.phoneNumber ||
      user.staffMember?.phoneNumber ||
      user.staffMember?.alternatePhone ||
      user.guardian?.phoneNumbers[0]?.phoneNumber ||
      null

    // Build contextual info
    let contextInfo: string | null = null
    if (user.student) {
      // The grade has its own column — details carry the section only.
      contextInfo = user.student.section?.name ?? null
    } else if (user.teacher) {
      const parts: string[] = []
      const primaryDept = user.teacher.teacherDepartments[0]
      if (primaryDept) parts.push(primaryDept.department.departmentName)
      contextInfo = parts.length > 0 ? parts.join(" · ") : null
    } else if (user.staffMember) {
      contextInfo = user.staffMember.position || null
    } else if (user.guardian) {
    }

    return {
      id: user.id,
      name,
      username: user.username,
      email: personalEmail,
      phone,
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
      classCount: user.teacher?._count.subjectTeachers ?? 0,
      childCount: user.guardian?._count.studentGuardians ?? 0,
    }
  })
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
    expiresAt: r.expiresAt,
    lastResentAt: r.lastResentAt,
    resentCount: r.resentCount,
  }))
}

export async function getAcademicGrades(schoolId: string) {
  return db.academicGrade.findMany({
    where: { schoolId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })
}
