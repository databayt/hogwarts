"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { z } from "zod"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { dispatchNotification } from "@/lib/dispatch-notification"
import { sendEmail } from "@/lib/email"
import {
  calculateExpiryDate,
  generateInvitationToken,
  isInvitationExpired,
  MAX_RESEND_COUNT,
} from "@/lib/invitation-utils"
import { getTenantContext } from "@/lib/tenant-context"

import { assertMembershipPermission, getAuthContext } from "./authorization"
import {
  activateMemberSchema,
  approveMemberRequestSchema,
  assignGradeSchema,
  bulkActivateSchema,
  bulkSuspendSchema,
  changeRoleSchema,
  forcePasswordResetSchema,
  inviteMemberSchema,
  rejectMemberRequestSchema,
  removeMemberSchema,
  resendInvitationSchema,
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

    // Notify user of role change (fire-and-forget)
    dispatchNotification({
      schoolId,
      userId: parsed.userId,
      type: "system_alert",
      title: "Role Changed",
      body: `Your role has been changed to ${parsed.newRole}.`,
      actorId: authContext.userId,
    }).catch(console.error)

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

    // Notify suspended user (fire-and-forget)
    dispatchNotification({
      schoolId,
      userId: parsed.userId,
      type: "system_alert",
      title: "Account Suspended",
      body: "Your account has been suspended. Contact your school administrator for details.",
      priority: "high",
      actorId: authContext.userId,
    }).catch(console.error)

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

    // Notify activated user (fire-and-forget)
    dispatchNotification({
      schoolId,
      userId: parsed.userId,
      type: "system_alert",
      title: "Account Activated",
      body: "Your account has been activated. You can now access the platform.",
      actorId: authContext.userId,
    }).catch(console.error)

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

    // Notify BEFORE removal (fire-and-forget) since they lose schoolId after
    dispatchNotification({
      schoolId,
      userId: parsed.userId,
      type: "system_alert",
      title: "Removed from School",
      body: "You have been removed from this school.",
      priority: "high",
      actorId: authContext.userId,
    }).catch(console.error)

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

    // Notify approved user (fire-and-forget)
    if (request.userId) {
      dispatchNotification({
        schoolId,
        userId: request.userId,
        type: "account_created",
        title: "Membership Approved",
        body: "Your membership request has been approved. Welcome!",
        actorId: authContext.userId,
      }).catch(console.error)
    }

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

    // Notify rejected user if linked (fire-and-forget)
    if (request.userId) {
      dispatchNotification({
        schoolId,
        userId: request.userId,
        type: "system_alert",
        title: "Membership Request Rejected",
        body: parsed.reason
          ? `Your membership request was rejected: ${parsed.reason}`
          : "Your membership request was rejected.",
        actorId: authContext.userId,
      }).catch(console.error)
    }

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

    const [request, school] = await Promise.all([
      db.membershipRequest.create({
        data: {
          schoolId,
          email: parsed.email,
          name: parsed.name,
          requestedRole: parsed.role,
          userId: existingUser?.id,
          joinMethod: "INVITATION",
          status: "PENDING",
          invitationToken: generateInvitationToken(),
          expiresAt: calculateExpiryDate(),
        },
      }),
      db.school.findUnique({
        where: { id: schoolId },
        select: { name: true, domain: true },
      }),
    ])

    // Send invitation email (fire-and-forget)
    const schoolName = school?.name || "School Portal"
    const subdomain = school?.domain || ""
    sendEmail({
      to: parsed.email,
      subject: `Invitation to join ${schoolName}`,
      template: "invitation",
      data: {
        schoolName,
        role: parsed.role,
        portalUrl: subdomain
          ? `https://${subdomain}.databayt.org`
          : "https://ed.databayt.org",
      },
    }).catch(console.error)

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

// --- Resend Invitation ---
export async function resendInvitation(
  input: z.infer<typeof resendInvitationSchema>
): Promise<ActionResponse<void>> {
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

    const parsed = resendInvitationSchema.parse(input)

    const request = await db.membershipRequest.findFirst({
      where: {
        id: parsed.requestId,
        schoolId,
        status: "PENDING",
        joinMethod: "INVITATION",
      },
    })
    if (!request) return actionError(ACTION_ERRORS.NOT_FOUND)

    // Check if invitation has been resent too many times
    if (request.resentCount >= MAX_RESEND_COUNT) {
      return {
        success: false,
        error: `Maximum resend limit (${MAX_RESEND_COUNT}) reached`,
      }
    }

    // Check if already expired — still allow resend (it resets the expiry)
    const wasExpired = isInvitationExpired(request.expiresAt)

    // Generate a new token and reset expiry
    const newToken = generateInvitationToken()
    const newExpiresAt = calculateExpiryDate()

    await db.membershipRequest.update({
      where: { id: parsed.requestId },
      data: {
        invitationToken: newToken,
        expiresAt: newExpiresAt,
        lastResentAt: new Date(),
        resentCount: { increment: 1 },
      },
    })

    // Fetch school info for the email
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: { name: true, domain: true },
    })

    const schoolName = school?.name || "School Portal"
    const subdomain = school?.domain || ""

    // Re-send invitation email (fire-and-forget)
    sendEmail({
      to: request.email,
      subject: wasExpired
        ? `Your invitation to ${schoolName} has been renewed`
        : `Reminder: Invitation to join ${schoolName}`,
      template: "invitation",
      data: {
        schoolName,
        role: request.requestedRole,
        portalUrl: subdomain
          ? `https://${subdomain}.databayt.org`
          : "https://ed.databayt.org",
      },
    }).catch(console.error)

    revalidatePath("/school/membership")
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: "Validation failed" }
    }
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to resend invitation",
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

    const users = await db.user.findMany({
      where: { id: { in: targetIds }, schoolId },
      include: { student: true, teacher: true, staffMember: true },
    })

    let count = 0
    for (const user of users) {
      await db.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: user.id },
          data: { isSuspended: true },
        })
        if (user.student) {
          await tx.student.update({
            where: { id: user.student.id },
            data: { status: "SUSPENDED" },
          })
        }
        if (user.teacher) {
          await tx.teacher.update({
            where: { id: user.teacher.id },
            data: { employmentStatus: "suspended" },
          })
        }
        if (user.staffMember) {
          await tx.staffMember.update({
            where: { id: user.staffMember.id },
            data: { employmentStatus: "suspended" },
          })
        }
      })
      count++
    }

    revalidatePath("/school/membership")
    return { success: true, data: { count } }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to bulk suspend",
    }
  }
}

// --- Bulk Activate ---
export async function bulkActivate(
  input: z.infer<typeof bulkActivateSchema>
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

    const parsed = bulkActivateSchema.parse(input)

    const users = await db.user.findMany({
      where: { id: { in: parsed.userIds }, schoolId },
      include: { student: true, teacher: true, staffMember: true },
    })

    let count = 0
    for (const user of users) {
      await db.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: user.id },
          data: { isSuspended: false },
        })
        if (user.student) {
          await tx.student.update({
            where: { id: user.student.id },
            data: { status: "ACTIVE" },
          })
        }
        if (user.teacher) {
          await tx.teacher.update({
            where: { id: user.teacher.id },
            data: { employmentStatus: "active" },
          })
        }
        if (user.staffMember) {
          await tx.staffMember.update({
            where: { id: user.staffMember.id },
            data: { employmentStatus: "active" },
          })
        }
      })
      count++
    }

    revalidatePath("/school/membership")
    return { success: true, data: { count } }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to bulk activate",
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
        student: { select: { givenName: true, surname: true } },
        teacher: { select: { givenName: true, surname: true } },
        staffMember: { select: { givenName: true, surname: true } },
        guardian: { select: { givenName: true, surname: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    const header = "Name,Email,Role,Status,Joined"
    const rows = users.map((u) => {
      const profile = u.student || u.teacher || u.staffMember || u.guardian
      const name = profile
        ? [profile.givenName, profile.surname].filter(Boolean).join(" ") ||
          u.username ||
          ""
        : u.username || ""
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

// --- Force Password Reset ---
export async function forcePasswordReset(
  input: z.infer<typeof forcePasswordResetSchema>
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

    const parsed = forcePasswordResetSchema.parse(input)

    // Cannot force-reset own password via admin action
    if (parsed.userId === authContext.userId) {
      return { success: false, error: "Cannot force-reset your own password" }
    }

    const targetUser = await db.user.findFirst({
      where: { id: parsed.userId, schoolId },
      select: { id: true, email: true, username: true },
    })
    if (!targetUser) return actionError(ACTION_ERRORS.NOT_FOUND)

    await db.user.update({
      where: { id: parsed.userId },
      data: { mustChangePassword: true },
    })

    // Notify user via in-app notification (fire-and-forget)
    dispatchNotification({
      schoolId,
      userId: parsed.userId,
      type: "system_alert",
      title: "Password Reset Required",
      body: "Your administrator has required you to change your password on next login.",
      priority: "high",
      actorId: authContext.userId,
    }).catch(console.error)

    // Send email notification (fire-and-forget)
    if (targetUser.email) {
      sendEmail({
        to: targetUser.email,
        subject: "Password Reset Required",
        template: "force-password-reset",
        data: {
          message:
            "Your school administrator has required you to change your password. You will be prompted to set a new password on your next login.",
        },
      }).catch(console.error)
    }

    revalidatePath("/school/membership")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to force password reset",
    }
  }
}
