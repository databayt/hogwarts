"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { db } from "@/lib/db"

import { assertStaffPermission, getAuthContext } from "./authorization"
import { staffCreateSchema, staffUpdateSchema } from "./validation"

/**
 * Create a new staff member
 */
export async function createStaff(data: FormData) {
  const session = await auth()
  const authContext = getAuthContext(session)

  if (!authContext) {
    throw new Error("Unauthorized: No session")
  }

  assertStaffPermission(authContext, "create")

  const schoolId = authContext.schoolId
  if (!schoolId) {
    throw new Error("Unauthorized: No school context")
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

  return { success: true, staff }
}

/**
 * Update a staff member
 */
export async function updateStaff(id: string, data: FormData) {
  const session = await auth()
  const authContext = getAuthContext(session)

  if (!authContext) {
    throw new Error("Unauthorized: No session")
  }

  const schoolId = authContext.schoolId
  if (!schoolId) {
    throw new Error("Unauthorized: No school context")
  }

  // Get existing staff member
  const existingStaff = await db.staffMember.findFirst({
    where: { id, schoolId },
    select: { id: true, schoolId: true, userId: true },
  })

  if (!existingStaff) {
    throw new Error("Staff member not found")
  }

  assertStaffPermission(authContext, "update", existingStaff)

  const formData = Object.fromEntries(data)
  const validated = staffUpdateSchema.parse(formData)

  const staff = await db.staffMember.update({
    where: { id },
    data: validated,
  })

  revalidatePath("/staff")
  revalidatePath(`/staff/${id}`)

  return { success: true, staff }
}

/**
 * Delete a staff member
 */
export async function deleteStaff(id: string) {
  const session = await auth()
  const authContext = getAuthContext(session)

  if (!authContext) {
    throw new Error("Unauthorized: No session")
  }

  const schoolId = authContext.schoolId
  if (!schoolId) {
    throw new Error("Unauthorized: No school context")
  }

  // Get existing staff member
  const existingStaff = await db.staffMember.findFirst({
    where: { id, schoolId },
    select: { id: true, schoolId: true, userId: true },
  })

  if (!existingStaff) {
    throw new Error("Staff member not found")
  }

  assertStaffPermission(authContext, "delete", existingStaff)

  await db.staffMember.delete({
    where: { id },
  })

  revalidatePath("/staff")

  return { success: true }
}

/**
 * Bulk delete staff members
 */
export async function bulkDeleteStaff(ids: string[]) {
  const session = await auth()
  const authContext = getAuthContext(session)

  if (!authContext) {
    throw new Error("Unauthorized: No session")
  }

  assertStaffPermission(authContext, "bulk_action")

  const schoolId = authContext.schoolId
  if (!schoolId) {
    throw new Error("Unauthorized: No school context")
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
    },
  })

  revalidatePath("/staff")

  return { success: true, deleted: validIds.length }
}

/**
 * Get staff for export
 */
export async function getStaffForExport() {
  const session = await auth()
  const authContext = getAuthContext(session)

  if (!authContext) {
    throw new Error("Unauthorized: No session")
  }

  assertStaffPermission(authContext, "export")

  const schoolId = authContext.schoolId
  if (!schoolId) {
    throw new Error("Unauthorized: No school context")
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

  return staff.map((s) => ({
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
}
