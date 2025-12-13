"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getTenantContext } from "@/lib/tenant-context"
import {
  createDepartmentSchema,
  updateDepartmentSchema,
  deleteDepartmentSchema,
} from "./validation"
import type { ActionResult } from "./types"

// ============================================================================
// Get Departments
// ============================================================================

export async function getDepartments(): Promise<ActionResult> {
  try {
    const { schoolId, role } = await getTenantContext()

    if (!schoolId) {
      return { success: false, message: "School not found" }
    }

    // Check permissions - ADMIN or DEVELOPER can access
    if (role !== "DEVELOPER" && role !== "ADMIN") {
      return { success: false, message: "Insufficient permissions" }
    }

    const departments = await db.department.findMany({
      where: { schoolId },
      include: {
        subjects: {
          select: {
            id: true,
            subjectName: true,
            subjectNameAr: true,
          },
        },
        teacherDepartments: {
          include: {
            teacher: {
              select: {
                id: true,
                givenName: true,
                surname: true,
                emailAddress: true,
                profilePhotoUrl: true,
              },
            },
          },
        },
        _count: {
          select: {
            subjects: true,
            teacherDepartments: true,
          },
        },
      },
      orderBy: { departmentName: "asc" },
    })

    // Transform to match expected interface
    const transformedDepartments = departments.map((dept) => ({
      id: dept.id,
      schoolId: dept.schoolId,
      departmentName: dept.departmentName,
      departmentNameAr: dept.departmentNameAr,
      createdAt: dept.createdAt,
      updatedAt: dept.updatedAt,
      subjects: dept.subjects.map((s) => ({
        id: s.id,
        subjectName: s.subjectName,
        subjectNameAr: s.subjectNameAr,
      })),
      teachers: dept.teacherDepartments.map((td) => ({
        id: td.teacher.id,
        givenName: td.teacher.givenName,
        surname: td.teacher.surname,
        emailAddress: td.teacher.emailAddress,
        profilePhotoUrl: td.teacher.profilePhotoUrl,
        isPrimary: td.isPrimary,
      })),
      _count: dept._count,
    }))

    return {
      success: true,
      data: { departments: transformedDepartments },
    }
  } catch (error) {
    console.error("Failed to fetch departments:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch departments",
    }
  }
}

// ============================================================================
// Create Department
// ============================================================================

export async function createDepartment(formData: FormData): Promise<ActionResult> {
  try {
    const { schoolId, role } = await getTenantContext()

    if (!schoolId) {
      return { success: false, message: "School not found" }
    }

    if (role !== "DEVELOPER" && role !== "ADMIN") {
      return { success: false, message: "Insufficient permissions" }
    }

    const data = {
      departmentName: formData.get("departmentName") as string,
      departmentNameAr: (formData.get("departmentNameAr") as string) || undefined,
    }

    const validated = createDepartmentSchema.parse(data)

    // Check for duplicate department name
    const existing = await db.department.findFirst({
      where: { schoolId, departmentName: validated.departmentName },
    })

    if (existing) {
      return { success: false, message: "A department with this name already exists" }
    }

    const department = await db.department.create({
      data: {
        schoolId,
        departmentName: validated.departmentName,
        departmentNameAr: validated.departmentNameAr,
      },
    })

    revalidatePath("/teachers/departments")
    return {
      success: true,
      message: "Department created successfully",
      data: { department },
    }
  } catch (error) {
    console.error("Failed to create department:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to create department",
    }
  }
}

// ============================================================================
// Update Department
// ============================================================================

export async function updateDepartment(formData: FormData): Promise<ActionResult> {
  try {
    const { schoolId, role } = await getTenantContext()

    if (!schoolId) {
      return { success: false, message: "School not found" }
    }

    if (role !== "DEVELOPER" && role !== "ADMIN") {
      return { success: false, message: "Insufficient permissions" }
    }

    const data = {
      id: formData.get("id") as string,
      departmentName: (formData.get("departmentName") as string) || undefined,
      departmentNameAr: formData.get("departmentNameAr") as string | null,
    }

    const validated = updateDepartmentSchema.parse(data)

    // Check ownership
    const existing = await db.department.findFirst({
      where: { id: validated.id, schoolId },
    })

    if (!existing) {
      return { success: false, message: "Department not found" }
    }

    // Check for duplicate name if changing name
    if (validated.departmentName && validated.departmentName !== existing.departmentName) {
      const duplicate = await db.department.findFirst({
        where: {
          schoolId,
          departmentName: validated.departmentName,
          NOT: { id: validated.id },
        },
      })
      if (duplicate) {
        return { success: false, message: "A department with this name already exists" }
      }
    }

    const department = await db.department.update({
      where: { id: validated.id },
      data: {
        ...(validated.departmentName && { departmentName: validated.departmentName }),
        ...(validated.departmentNameAr !== undefined && {
          departmentNameAr: validated.departmentNameAr || null,
        }),
      },
    })

    revalidatePath("/teachers/departments")
    return {
      success: true,
      message: "Department updated successfully",
      data: { department },
    }
  } catch (error) {
    console.error("Failed to update department:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to update department",
    }
  }
}

// ============================================================================
// Delete Department
// ============================================================================

export async function deleteDepartment(formData: FormData): Promise<ActionResult> {
  try {
    const { schoolId, role } = await getTenantContext()

    if (!schoolId) {
      return { success: false, message: "School not found" }
    }

    if (role !== "DEVELOPER" && role !== "ADMIN") {
      return { success: false, message: "Insufficient permissions" }
    }

    const data = {
      id: formData.get("id") as string,
    }

    const validated = deleteDepartmentSchema.parse(data)

    // Check ownership and dependencies
    const existing = await db.department.findFirst({
      where: { id: validated.id, schoolId },
      include: {
        _count: {
          select: {
            subjects: true,
            teacherDepartments: true,
          },
        },
      },
    })

    if (!existing) {
      return { success: false, message: "Department not found" }
    }

    // Check for dependencies
    if (existing._count.subjects > 0) {
      return {
        success: false,
        message: `Cannot delete department with ${existing._count.subjects} assigned subject(s). Please reassign subjects first.`,
      }
    }

    if (existing._count.teacherDepartments > 0) {
      return {
        success: false,
        message: `Cannot delete department with ${existing._count.teacherDepartments} assigned teacher(s). Please reassign teachers first.`,
      }
    }

    await db.department.delete({
      where: { id: validated.id },
    })

    revalidatePath("/teachers/departments")
    return { success: true, message: "Department deleted successfully" }
  } catch (error) {
    console.error("Failed to delete department:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to delete department",
    }
  }
}
