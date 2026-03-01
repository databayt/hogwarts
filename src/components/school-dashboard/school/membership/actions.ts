"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { z } from "zod"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { assertMembershipPermission, getAuthContext } from "./authorization"
import {
  activateMemberSchema,
  approveMemberRequestSchema,
  assignGradeSchema,
  bulkSuspendSchema,
  changeRoleSchema,
  inviteMemberSchema,
  rejectMemberRequestSchema,
  removeMemberSchema,
  suspendMemberSchema,
} from "./validation"

// --- Change Role ---
export async function changeRole(
  input: z.infer<typeof changeRoleSchema>
): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)

    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    try {
      assertMembershipPermission(authContext, "change_role", schoolId)
    } catch {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    const parsed = changeRoleSchema.parse(input)

    // Verify target user belongs to this school
    const targetUser = await db.user.findFirst({
      where: { id: parsed.userId, schoolId },
      include: {
        student: true,
        teacher: true,
        staffMember: true,
        guardian: true,
      },
    })
    if (!targetUser) return actionError(ACTION_ERRORS.NOT_FOUND)

    // Cannot change own role
    if (
      targetUser.id === authContext.userId &&
      authContext.role !== "DEVELOPER"
    ) {
      return { success: false, error: "Cannot change your own role" }
    }

    await db.$transaction(async (tx) => {
      // Update user role
      await tx.user.update({
        where: { id: parsed.userId },
        data: { role: parsed.newRole },
      })

      // Create role-specific profile if missing
      if (parsed.newRole === "STUDENT" && !targetUser.student) {
        if (!parsed.dateOfBirth || !parsed.gender) {
          throw new Error(
            "Date of birth and gender are required for student role"
          )
        }
        await tx.student.create({
          data: {
            schoolId,
            userId: parsed.userId,
            givenName:
              targetUser.username ||
              targetUser.email?.split("@")[0] ||
              "Member",
            surname: "",
            dateOfBirth: new Date(parsed.dateOfBirth),
            gender: parsed.gender,
            status: "ACTIVE",
          },
        })
      }

      if (parsed.newRole === "TEACHER" && !targetUser.teacher) {
        await tx.teacher.create({
          data: {
            schoolId,
            userId: parsed.userId,
            givenName:
              targetUser.username ||
              targetUser.email?.split("@")[0] ||
              "Member",
            surname: "",
            emailAddress: targetUser.email || "",
          },
        })
      }

      if (parsed.newRole === "STAFF" && !targetUser.staffMember) {
        await tx.staffMember.create({
          data: {
            schoolId,
            userId: parsed.userId,
            givenName:
              targetUser.username ||
              targetUser.email?.split("@")[0] ||
              "Member",
            surname: "",
            emailAddress: targetUser.email || "",
          },
        })
      }

      if (parsed.newRole === "GUARDIAN" && !targetUser.guardian) {
        await tx.guardian.create({
          data: {
            schoolId,
            userId: parsed.userId,
            givenName:
              targetUser.username ||
              targetUser.email?.split("@")[0] ||
              "Member",
            surname: "",
          },
        })
      }
    })

    revalidatePath("/school/membership")
    return { success: true, data: { id: parsed.userId } }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: "Validation failed" }
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to change role",
    }
  }
}

// --- Assign Grade ---
export async function assignGrade(
  input: z.infer<typeof assignGradeSchema>
): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)

    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    try {
      assertMembershipPermission(authContext, "assign_grade", schoolId)
    } catch {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    const parsed = assignGradeSchema.parse(input)

    // Get user's student record
    const user = await db.user.findFirst({
      where: { id: parsed.userId, schoolId },
      include: { student: true },
    })
    if (!user?.student) {
      return { success: false, error: "User is not a student" }
    }

    // Verify grade belongs to this school
    const grade = await db.academicGrade.findFirst({
      where: { id: parsed.academicGradeId, schoolId },
    })
    if (!grade) return actionError(ACTION_ERRORS.NOT_FOUND)

    await db.student.update({
      where: { id: user.student.id },
      data: { academicGradeId: parsed.academicGradeId },
    })

    revalidatePath("/school/membership")
    return { success: true, data: { id: parsed.userId } }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to assign grade",
    }
  }
}

// --- Suspend Member ---
export async function suspendMember(
  input: z.infer<typeof suspendMemberSchema>
): Promise<ActionResponse<void>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)

    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    try {
      assertMembershipPermission(authContext, "suspend", schoolId)
    } catch {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    const parsed = suspendMemberSchema.parse(input)

    // Cannot suspend yourself
    if (parsed.userId === authContext.userId) {
      return { success: false, error: "Cannot suspend yourself" }
    }

    const targetUser = await db.user.findFirst({
      where: { id: parsed.userId, schoolId },
      include: { student: true, teacher: true, staffMember: true },
    })
    if (!targetUser) return actionError(ACTION_ERRORS.NOT_FOUND)

    await db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: parsed.userId },
        data: { isSuspended: true },
      })

      // Update role-specific status
      if (targetUser.student) {
        await tx.student.update({
          where: { id: targetUser.student.id },
          data: { status: "SUSPENDED" },
        })
      }
      if (targetUser.teacher) {
        await tx.teacher.update({
          where: { id: targetUser.teacher.id },
          data: { employmentStatus: "suspended" },
        })
      }
      if (targetUser.staffMember) {
        await tx.staffMember.update({
          where: { id: targetUser.staffMember.id },
          data: { employmentStatus: "suspended" },
        })
      }
    })

    revalidatePath("/school/membership")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to suspend member",
    }
  }
}

// --- Activate Member ---
export async function activateMember(
  input: z.infer<typeof activateMemberSchema>
): Promise<ActionResponse<void>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)

    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    try {
      assertMembershipPermission(authContext, "activate", schoolId)
    } catch {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    const parsed = activateMemberSchema.parse(input)

    const targetUser = await db.user.findFirst({
      where: { id: parsed.userId, schoolId },
      include: { student: true, teacher: true, staffMember: true },
    })
    if (!targetUser) return actionError(ACTION_ERRORS.NOT_FOUND)

    await db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: parsed.userId },
        data: { isSuspended: false },
      })

      // Restore role-specific status
      if (targetUser.student) {
        await tx.student.update({
          where: { id: targetUser.student.id },
          data: { status: "ACTIVE" },
        })
      }
      if (targetUser.teacher) {
        await tx.teacher.update({
          where: { id: targetUser.teacher.id },
          data: { employmentStatus: "active" },
        })
      }
      if (targetUser.staffMember) {
        await tx.staffMember.update({
          where: { id: targetUser.staffMember.id },
          data: { employmentStatus: "active" },
        })
      }
    })

    revalidatePath("/school/membership")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to activate member",
    }
  }
}

// --- Remove Member ---
export async function removeMember(
  input: z.infer<typeof removeMemberSchema>
): Promise<ActionResponse<void>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)

    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    try {
      assertMembershipPermission(authContext, "remove", schoolId)
    } catch {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    const parsed = removeMemberSchema.parse(input)

    // Cannot remove yourself
    if (parsed.userId === authContext.userId) {
      return { success: false, error: "Cannot remove yourself" }
    }

    const targetUser = await db.user.findFirst({
      where: { id: parsed.userId, schoolId },
      include: { student: true, teacher: true, staffMember: true },
    })
    if (!targetUser) return actionError(ACTION_ERRORS.NOT_FOUND)

    // Cascade safety: check for critical dependencies
    const deps: string[] = []

    if (targetUser.student) {
      const [classCount, attendanceCount] = await Promise.all([
        db.studentClass.count({
          where: { studentId: targetUser.student.id, schoolId },
        }),
        db.attendance.count({
          where: { studentId: targetUser.student.id, schoolId },
        }),
      ])
      if (classCount > 0) deps.push(`enrolled in ${classCount} class(es)`)
      if (attendanceCount > 0)
        deps.push(`has ${attendanceCount} attendance record(s)`)
    }

    if (targetUser.teacher) {
      const [classCount, timetableCount] = await Promise.all([
        db.class.count({
          where: { teacherId: targetUser.teacher.id, schoolId },
        }),
        db.timetable.count({
          where: { teacherId: targetUser.teacher.id, schoolId },
        }),
      ])
      if (classCount > 0) deps.push(`teaches ${classCount} class(es)`)
      if (timetableCount > 0)
        deps.push(`has ${timetableCount} timetable slot(s)`)
    }

    if (deps.length > 0) {
      return {
        success: false,
        error: `Cannot remove: member ${deps.join(", ")}. Reassign first.`,
      }
    }

    // Soft removal: unlink from school, reset to USER role
    await db.user.update({
      where: { id: parsed.userId },
      data: {
        schoolId: null,
        role: "USER",
        isSuspended: false,
        updatedAt: new Date(),
      },
    })

    revalidatePath("/school/membership")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to remove member",
    }
  }
}

// --- Approve Membership Request ---
export async function approveMemberRequest(
  input: z.infer<typeof approveMemberRequestSchema>
): Promise<ActionResponse<void>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)

    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    try {
      assertMembershipPermission(authContext, "approve", schoolId)
    } catch {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    const parsed = approveMemberRequestSchema.parse(input)

    const request = await db.membershipRequest.findFirst({
      where: { id: parsed.requestId, schoolId, status: "PENDING" },
    })
    if (!request) return actionError(ACTION_ERRORS.NOT_FOUND)

    await db.$transaction(async (tx) => {
      // Update request status
      await tx.membershipRequest.update({
        where: { id: parsed.requestId },
        data: {
          status: "APPROVED",
          reviewedById: authContext.userId,
          reviewedAt: new Date(),
        },
      })

      // If linked to user, set their schoolId and role
      if (request.userId) {
        await tx.user.update({
          where: { id: request.userId },
          data: {
            schoolId,
            role: request.requestedRole,
            updatedAt: new Date(),
          },
        })
      }
    })

    revalidatePath("/school/membership")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to approve request",
    }
  }
}

// --- Reject Membership Request ---
export async function rejectMemberRequest(
  input: z.infer<typeof rejectMemberRequestSchema>
): Promise<ActionResponse<void>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)

    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    try {
      assertMembershipPermission(authContext, "reject", schoolId)
    } catch {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    const parsed = rejectMemberRequestSchema.parse(input)

    const request = await db.membershipRequest.findFirst({
      where: { id: parsed.requestId, schoolId, status: "PENDING" },
    })
    if (!request) return actionError(ACTION_ERRORS.NOT_FOUND)

    await db.membershipRequest.update({
      where: { id: parsed.requestId },
      data: {
        status: "REJECTED",
        rejectionReason: parsed.reason,
        reviewedById: authContext.userId,
        reviewedAt: new Date(),
      },
    })

    revalidatePath("/school/membership")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to reject request",
    }
  }
}

// --- Invite Member ---
export async function inviteMember(
  input: z.infer<typeof inviteMemberSchema>
): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)

    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    try {
      assertMembershipPermission(authContext, "invite", schoolId)
    } catch {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    const parsed = inviteMemberSchema.parse(input)

    // Check if there's already a pending request
    const existing = await db.membershipRequest.findUnique({
      where: { schoolId_email: { schoolId, email: parsed.email } },
    })
    if (existing) {
      return {
        success: false,
        error: "An invitation already exists for this email",
      }
    }

    // Find user by email if they exist
    const existingUser = await db.user.findFirst({
      where: { email: parsed.email },
    })

    const request = await db.membershipRequest.create({
      data: {
        schoolId,
        email: parsed.email,
        name: parsed.name,
        requestedRole: parsed.role,
        userId: existingUser?.id,
        joinMethod: "INVITATION",
        status: "PENDING",
      },
    })

    revalidatePath("/school/membership")
    return { success: true, data: { id: request.id } }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: "Invalid email or role" }
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to invite member",
    }
  }
}

// --- Bulk Suspend ---
export async function bulkSuspend(
  input: z.infer<typeof bulkSuspendSchema>
): Promise<ActionResponse<{ count: number }>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)

    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    try {
      assertMembershipPermission(authContext, "bulk_action", schoolId)
    } catch {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    const parsed = bulkSuspendSchema.parse(input)

    // Filter out own userId
    const targetIds = parsed.userIds.filter((id) => id !== authContext.userId)

    const result = await db.user.updateMany({
      where: { id: { in: targetIds }, schoolId },
      data: { isSuspended: true },
    })

    revalidatePath("/school/membership")
    return { success: true, data: { count: result.count } }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to bulk suspend",
    }
  }
}

// --- Export Members CSV ---
export async function exportMembersCSV(): Promise<ActionResponse<string>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)

    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    try {
      assertMembershipPermission(authContext, "export", schoolId)
    } catch {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    const users = await db.user.findMany({
      where: { schoolId },
      select: {
        username: true,
        email: true,
        role: true,
        isSuspended: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    })

    const header = "Name,Email,Role,Status,Joined"
    const rows = users.map((u) => {
      const name = u.username || ""
      const status = u.isSuspended ? "Suspended" : "Active"
      return `"${name}","${u.email || ""}","${u.role}","${status}","${u.createdAt.toISOString()}"`
    })

    return { success: true, data: [header, ...rows].join("\n") }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to export",
    }
  }
}
