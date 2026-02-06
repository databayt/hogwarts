"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { db } from "@/lib/db"

import { assertStaffPermission, getAuthContext } from "./authorization"
import { staffCreateSchema, staffUpdateSchema } from "./validation"

export type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

/**
 * Create a new staff member
 */
export async function createStaff(
  data: FormData
): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)

    if (!authContext) {
      return { success: false, error: "Not authenticated" }
    }

    const schoolId = authContext.schoolId
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    try {
      assertStaffPermission(authContext, "create")
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unauthorized",
      }
    }

    const formData = Object.fromEntries(data)
    const validated = staffCreateSchema.parse(formData)

    const staff = await db.staffMember.create({
      data: {
        ...validated,
        schoolId,
      },
    })

    revalidatePath("/staff")

    return { success: true, data: { id: staff.id } }
  } catch (error) {
    console.error("[createStaff] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create staff",
    }
  }
}

/**
 * Update a staff member
 */
export async function updateStaff(
  id: string,
  data: FormData
): Promise<ActionResponse<void>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)

    if (!authContext) {
      return { success: false, error: "Not authenticated" }
    }

    const schoolId = authContext.schoolId
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    // Get existing staff member
    const existingStaff = await db.staffMember.findFirst({
      where: { id, schoolId },
      select: { id: true, schoolId: true, userId: true },
    })

    if (!existingStaff) {
      return { success: false, error: "Staff member not found" }
    }

    try {
      assertStaffPermission(authContext, "update", existingStaff)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unauthorized",
      }
    }

    const formData = Object.fromEntries(data)
    const validated = staffUpdateSchema.parse(formData)

    await db.staffMember.updateMany({
      where: { id, schoolId },
      data: validated,
    })

    revalidatePath("/staff")
    revalidatePath(`/staff/${id}`)

    return { success: true, data: undefined }
  } catch (error) {
    console.error("[updateStaff] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update staff",
    }
  }
}

/**
 * Delete a staff member
 */
export async function deleteStaff(id: string): Promise<ActionResponse<void>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)

    if (!authContext) {
      return { success: false, error: "Not authenticated" }
    }

    const schoolId = authContext.schoolId
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    // Get existing staff member
    const existingStaff = await db.staffMember.findFirst({
      where: { id, schoolId },
      select: { id: true, schoolId: true, userId: true },
    })

    if (!existingStaff) {
      return { success: false, error: "Staff member not found" }
    }

    try {
      assertStaffPermission(authContext, "delete", existingStaff)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unauthorized",
      }
    }

    await db.staffMember.deleteMany({
      where: { id, schoolId },
    })

    revalidatePath("/staff")

    return { success: true, data: undefined }
  } catch (error) {
    console.error("[deleteStaff] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete staff",
    }
  }
}

/**
 * Bulk delete staff members
 */
export async function bulkDeleteStaff(
  ids: string[]
): Promise<ActionResponse<{ count: number }>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)

    if (!authContext) {
      return { success: false, error: "Not authenticated" }
    }

    try {
      assertStaffPermission(authContext, "bulk_action")
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unauthorized",
      }
    }

    const schoolId = authContext.schoolId
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    // Verify ownership
    const staffMembers = await db.staffMember.findMany({
      where: {
        id: { in: ids },
        schoolId,
      },
      select: { id: true },
    })

    const validIds = staffMembers.map((s) => s.id)

    await db.staffMember.deleteMany({
      where: {
        id: { in: validIds },
        schoolId,
      },
    })

    revalidatePath("/staff")

    return { success: true, data: { count: validIds.length } }
  } catch (error) {
    console.error("[bulkDeleteStaff] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to bulk delete staff",
    }
  }
}

/**
 * Get staff for export
 */
export async function getStaffForExport(): Promise<ActionResponse<any[]>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)

    if (!authContext) {
      return { success: false, error: "Not authenticated" }
    }

    try {
      assertStaffPermission(authContext, "export")
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unauthorized",
      }
    }

    const schoolId = authContext.schoolId
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const staff = await db.staffMember.findMany({
      where: { schoolId },
      select: {
        id: true,
        employeeId: true,
        givenName: true,
        surname: true,
        emailAddress: true,
        position: true,
        employmentStatus: true,
        employmentType: true,
        phoneNumber: true,
        joiningDate: true,
        department: {
          select: {
            departmentName: true,
          },
        },
      },
      orderBy: [{ surname: "asc" }, { givenName: "asc" }],
    })

    const exportData = staff.map((s) => ({
      "Employee ID": s.employeeId || "",
      "First Name": s.givenName,
      "Last Name": s.surname,
      Email: s.emailAddress,
      Position: s.position || "",
      Department: s.department?.departmentName || "",
      "Employment Status": s.employmentStatus,
      "Employment Type": s.employmentType,
      Phone: s.phoneNumber || "",
      "Joining Date": s.joiningDate?.toISOString().split("T")[0] || "",
    }))

    return { success: true, data: exportData }
  } catch (error) {
    console.error("[getStaffForExport] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to export staff",
    }
  }
}
