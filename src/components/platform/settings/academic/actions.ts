"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getTenantContext } from "@/lib/tenant-context"
import {
  createSchoolYearSchema,
  updateSchoolYearSchema,
  deleteSchoolYearSchema,
  createTermSchema,
  updateTermSchema,
  deleteTermSchema,
  setActiveTermSchema,
  createPeriodSchema,
  updatePeriodSchema,
  deletePeriodSchema,
  bulkCreatePeriodsSchema,
} from "./validation"
import type { ActionResult } from "./types"

// ============================================================================
// School Year Actions
// ============================================================================

export async function getSchoolYears(): Promise<ActionResult> {
  try {
    const { schoolId, role } = await getTenantContext()

    if (!schoolId) {
      return { success: false, message: "School not found" }
    }

    // Check permissions - only ADMIN or DEVELOPER can access
    if (role !== "DEVELOPER" && role !== "ADMIN") {
      return { success: false, message: "Insufficient permissions" }
    }

    const years = await db.schoolYear.findMany({
      where: { schoolId },
      include: {
        _count: {
          select: {
            terms: true,
            periods: true,
          },
        },
      },
      orderBy: { yearName: "desc" },
    })

    return {
      success: true,
      data: { years },
    }
  } catch (error) {
    console.error("Failed to fetch school years:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch school years",
    }
  }
}

export async function createSchoolYear(formData: FormData): Promise<ActionResult> {
  try {
    const { schoolId, role } = await getTenantContext()

    if (!schoolId) {
      return { success: false, message: "School not found" }
    }

    if (role !== "DEVELOPER" && role !== "ADMIN") {
      return { success: false, message: "Insufficient permissions" }
    }

    const data = {
      yearName: formData.get("yearName") as string,
      startDate: new Date(formData.get("startDate") as string),
      endDate: new Date(formData.get("endDate") as string),
    }

    const validated = createSchoolYearSchema.parse(data)

    // Check for duplicate year name
    const existing = await db.schoolYear.findFirst({
      where: { schoolId, yearName: validated.yearName },
    })

    if (existing) {
      return { success: false, message: "A school year with this name already exists" }
    }

    const year = await db.schoolYear.create({
      data: {
        schoolId,
        yearName: validated.yearName,
        startDate: validated.startDate,
        endDate: validated.endDate,
      },
    })

    revalidatePath("/settings")
    return { success: true, message: "School year created successfully", data: { year } }
  } catch (error) {
    console.error("Failed to create school year:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to create school year",
    }
  }
}

export async function updateSchoolYear(formData: FormData): Promise<ActionResult> {
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
      yearName: formData.get("yearName") as string || undefined,
      startDate: formData.get("startDate") ? new Date(formData.get("startDate") as string) : undefined,
      endDate: formData.get("endDate") ? new Date(formData.get("endDate") as string) : undefined,
    }

    const validated = updateSchoolYearSchema.parse(data)

    // Check ownership
    const existing = await db.schoolYear.findFirst({
      where: { id: validated.id, schoolId },
    })

    if (!existing) {
      return { success: false, message: "School year not found" }
    }

    // Check for duplicate name if changing name
    if (validated.yearName && validated.yearName !== existing.yearName) {
      const duplicate = await db.schoolYear.findFirst({
        where: { schoolId, yearName: validated.yearName, NOT: { id: validated.id } },
      })
      if (duplicate) {
        return { success: false, message: "A school year with this name already exists" }
      }
    }

    const year = await db.schoolYear.update({
      where: { id: validated.id },
      data: {
        ...(validated.yearName && { yearName: validated.yearName }),
        ...(validated.startDate && { startDate: validated.startDate }),
        ...(validated.endDate && { endDate: validated.endDate }),
      },
    })

    revalidatePath("/settings")
    return { success: true, message: "School year updated successfully", data: { year } }
  } catch (error) {
    console.error("Failed to update school year:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to update school year",
    }
  }
}

export async function deleteSchoolYear(formData: FormData): Promise<ActionResult> {
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

    const validated = deleteSchoolYearSchema.parse(data)

    // Check ownership and dependencies
    const existing = await db.schoolYear.findFirst({
      where: { id: validated.id, schoolId },
      include: {
        _count: {
          select: { terms: true, periods: true },
        },
      },
    })

    if (!existing) {
      return { success: false, message: "School year not found" }
    }

    if (existing._count.terms > 0 || existing._count.periods > 0) {
      return {
        success: false,
        message: "Cannot delete school year with existing terms or periods. Delete them first.",
      }
    }

    await db.schoolYear.delete({
      where: { id: validated.id },
    })

    revalidatePath("/settings")
    return { success: true, message: "School year deleted successfully" }
  } catch (error) {
    console.error("Failed to delete school year:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to delete school year",
    }
  }
}

// ============================================================================
// Term Actions
// ============================================================================

export async function getTermsForYear(yearId: string): Promise<ActionResult> {
  try {
    const { schoolId, role } = await getTenantContext()

    if (!schoolId) {
      return { success: false, message: "School not found" }
    }

    if (role !== "DEVELOPER" && role !== "ADMIN") {
      return { success: false, message: "Insufficient permissions" }
    }

    const terms = await db.term.findMany({
      where: { schoolId, yearId },
      orderBy: { termNumber: "asc" },
    })

    const activeTerm = terms.find((t) => t.isActive)

    return {
      success: true,
      data: { terms, activeTerm },
    }
  } catch (error) {
    console.error("Failed to fetch terms:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch terms",
    }
  }
}

export async function createTerm(formData: FormData): Promise<ActionResult> {
  try {
    const { schoolId, role } = await getTenantContext()

    if (!schoolId) {
      return { success: false, message: "School not found" }
    }

    if (role !== "DEVELOPER" && role !== "ADMIN") {
      return { success: false, message: "Insufficient permissions" }
    }

    const data = {
      yearId: formData.get("yearId") as string,
      termNumber: parseInt(formData.get("termNumber") as string, 10),
      startDate: new Date(formData.get("startDate") as string),
      endDate: new Date(formData.get("endDate") as string),
    }

    const validated = createTermSchema.parse(data)

    // Verify year belongs to school
    const year = await db.schoolYear.findFirst({
      where: { id: validated.yearId, schoolId },
    })

    if (!year) {
      return { success: false, message: "School year not found" }
    }

    // Check for duplicate term number
    const existing = await db.term.findFirst({
      where: { schoolId, yearId: validated.yearId, termNumber: validated.termNumber },
    })

    if (existing) {
      return { success: false, message: `Term ${validated.termNumber} already exists for this year` }
    }

    // Validate term dates are within year dates
    if (validated.startDate < year.startDate || validated.endDate > year.endDate) {
      return { success: false, message: "Term dates must be within the academic year dates" }
    }

    const term = await db.term.create({
      data: {
        schoolId,
        yearId: validated.yearId,
        termNumber: validated.termNumber,
        startDate: validated.startDate,
        endDate: validated.endDate,
        isActive: false,
      },
    })

    revalidatePath("/settings")
    return { success: true, message: "Term created successfully", data: { term } }
  } catch (error) {
    console.error("Failed to create term:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to create term",
    }
  }
}

export async function updateTerm(formData: FormData): Promise<ActionResult> {
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
      termNumber: formData.get("termNumber") ? parseInt(formData.get("termNumber") as string, 10) : undefined,
      startDate: formData.get("startDate") ? new Date(formData.get("startDate") as string) : undefined,
      endDate: formData.get("endDate") ? new Date(formData.get("endDate") as string) : undefined,
      isActive: formData.get("isActive") === "true" ? true : formData.get("isActive") === "false" ? false : undefined,
    }

    const validated = updateTermSchema.parse(data)

    // Check ownership
    const existing = await db.term.findFirst({
      where: { id: validated.id, schoolId },
      include: { schoolYear: true },
    })

    if (!existing) {
      return { success: false, message: "Term not found" }
    }

    // Check for duplicate term number if changing
    if (validated.termNumber && validated.termNumber !== existing.termNumber) {
      const duplicate = await db.term.findFirst({
        where: {
          schoolId,
          yearId: existing.yearId,
          termNumber: validated.termNumber,
          NOT: { id: validated.id },
        },
      })
      if (duplicate) {
        return { success: false, message: `Term ${validated.termNumber} already exists for this year` }
      }
    }

    const term = await db.term.update({
      where: { id: validated.id },
      data: {
        ...(validated.termNumber !== undefined && { termNumber: validated.termNumber }),
        ...(validated.startDate && { startDate: validated.startDate }),
        ...(validated.endDate && { endDate: validated.endDate }),
        ...(validated.isActive !== undefined && { isActive: validated.isActive }),
      },
    })

    revalidatePath("/settings")
    return { success: true, message: "Term updated successfully", data: { term } }
  } catch (error) {
    console.error("Failed to update term:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to update term",
    }
  }
}

export async function deleteTerm(formData: FormData): Promise<ActionResult> {
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

    const validated = deleteTermSchema.parse(data)

    // Check ownership
    const existing = await db.term.findFirst({
      where: { id: validated.id, schoolId },
    })

    if (!existing) {
      return { success: false, message: "Term not found" }
    }

    await db.term.delete({
      where: { id: validated.id },
    })

    revalidatePath("/settings")
    return { success: true, message: "Term deleted successfully" }
  } catch (error) {
    console.error("Failed to delete term:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to delete term",
    }
  }
}

export async function setActiveTerm(formData: FormData): Promise<ActionResult> {
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

    const validated = setActiveTermSchema.parse(data)

    // Check ownership
    const term = await db.term.findFirst({
      where: { id: validated.id, schoolId },
    })

    if (!term) {
      return { success: false, message: "Term not found" }
    }

    // Deactivate all other terms in the same year
    await db.term.updateMany({
      where: { schoolId, yearId: term.yearId, NOT: { id: validated.id } },
      data: { isActive: false },
    })

    // Activate this term
    await db.term.update({
      where: { id: validated.id },
      data: { isActive: true },
    })

    revalidatePath("/settings")
    return { success: true, message: "Active term set successfully" }
  } catch (error) {
    console.error("Failed to set active term:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to set active term",
    }
  }
}

// ============================================================================
// Period Actions
// ============================================================================

export async function getPeriodsForYear(yearId: string): Promise<ActionResult> {
  try {
    const { schoolId, role } = await getTenantContext()

    if (!schoolId) {
      return { success: false, message: "School not found" }
    }

    if (role !== "DEVELOPER" && role !== "ADMIN") {
      return { success: false, message: "Insufficient permissions" }
    }

    const periodsRaw = await db.period.findMany({
      where: { schoolId, yearId },
      orderBy: { startTime: "asc" },
    })

    // Convert Date to HH:MM string format
    const periods = periodsRaw.map((p) => ({
      ...p,
      startTime: p.startTime.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      endTime: p.endTime.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
    }))

    return {
      success: true,
      data: { periods },
    }
  } catch (error) {
    console.error("Failed to fetch periods:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch periods",
    }
  }
}

export async function createPeriod(formData: FormData): Promise<ActionResult> {
  try {
    const { schoolId, role } = await getTenantContext()

    if (!schoolId) {
      return { success: false, message: "School not found" }
    }

    if (role !== "DEVELOPER" && role !== "ADMIN") {
      return { success: false, message: "Insufficient permissions" }
    }

    const data = {
      yearId: formData.get("yearId") as string,
      name: formData.get("name") as string,
      startTime: formData.get("startTime") as string,
      endTime: formData.get("endTime") as string,
    }

    const validated = createPeriodSchema.parse(data)

    // Verify year belongs to school
    const year = await db.schoolYear.findFirst({
      where: { id: validated.yearId, schoolId },
    })

    if (!year) {
      return { success: false, message: "School year not found" }
    }

    // Check for duplicate period name
    const existing = await db.period.findFirst({
      where: { schoolId, yearId: validated.yearId, name: validated.name },
    })

    if (existing) {
      return { success: false, message: `Period "${validated.name}" already exists for this year` }
    }

    // Convert time strings to proper format for database
    const [startHours, startMinutes] = validated.startTime.split(":").map(Number)
    const [endHours, endMinutes] = validated.endTime.split(":").map(Number)

    const startTime = new Date()
    startTime.setHours(startHours, startMinutes, 0, 0)

    const endTime = new Date()
    endTime.setHours(endHours, endMinutes, 0, 0)

    const periodRaw = await db.period.create({
      data: {
        schoolId,
        yearId: validated.yearId,
        name: validated.name,
        startTime,
        endTime,
      },
    })

    // Convert Date to string format
    const period = {
      ...periodRaw,
      startTime: periodRaw.startTime.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      endTime: periodRaw.endTime.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
    }

    revalidatePath("/settings")
    return { success: true, message: "Period created successfully", data: { period } }
  } catch (error) {
    console.error("Failed to create period:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to create period",
    }
  }
}

export async function updatePeriod(formData: FormData): Promise<ActionResult> {
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
      name: formData.get("name") as string || undefined,
      startTime: formData.get("startTime") as string || undefined,
      endTime: formData.get("endTime") as string || undefined,
    }

    const validated = updatePeriodSchema.parse(data)

    // Check ownership
    const existing = await db.period.findFirst({
      where: { id: validated.id, schoolId },
    })

    if (!existing) {
      return { success: false, message: "Period not found" }
    }

    // Check for duplicate name if changing
    if (validated.name && validated.name !== existing.name) {
      const duplicate = await db.period.findFirst({
        where: {
          schoolId,
          yearId: existing.yearId,
          name: validated.name,
          NOT: { id: validated.id },
        },
      })
      if (duplicate) {
        return { success: false, message: `Period "${validated.name}" already exists for this year` }
      }
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {}

    if (validated.name) {
      updateData.name = validated.name
    }

    if (validated.startTime) {
      const [hours, minutes] = validated.startTime.split(":").map(Number)
      const time = new Date()
      time.setHours(hours, minutes, 0, 0)
      updateData.startTime = time
    }

    if (validated.endTime) {
      const [hours, minutes] = validated.endTime.split(":").map(Number)
      const time = new Date()
      time.setHours(hours, minutes, 0, 0)
      updateData.endTime = time
    }

    const periodRaw = await db.period.update({
      where: { id: validated.id },
      data: updateData,
    })

    // Convert Date to string format
    const period = {
      ...periodRaw,
      startTime: periodRaw.startTime.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      endTime: periodRaw.endTime.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
    }

    revalidatePath("/settings")
    return { success: true, message: "Period updated successfully", data: { period } }
  } catch (error) {
    console.error("Failed to update period:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to update period",
    }
  }
}

export async function deletePeriod(formData: FormData): Promise<ActionResult> {
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

    const validated = deletePeriodSchema.parse(data)

    // Check ownership
    const existing = await db.period.findFirst({
      where: { id: validated.id, schoolId },
    })

    if (!existing) {
      return { success: false, message: "Period not found" }
    }

    await db.period.delete({
      where: { id: validated.id },
    })

    revalidatePath("/settings")
    return { success: true, message: "Period deleted successfully" }
  } catch (error) {
    console.error("Failed to delete period:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to delete period",
    }
  }
}

export async function bulkCreatePeriods(formData: FormData): Promise<ActionResult> {
  try {
    const { schoolId, role } = await getTenantContext()

    if (!schoolId) {
      return { success: false, message: "School not found" }
    }

    if (role !== "DEVELOPER" && role !== "ADMIN") {
      return { success: false, message: "Insufficient permissions" }
    }

    const yearId = formData.get("yearId") as string
    const periodsJson = formData.get("periods") as string

    const data = {
      yearId,
      periods: JSON.parse(periodsJson),
    }

    const validated = bulkCreatePeriodsSchema.parse(data)

    // Verify year belongs to school
    const year = await db.schoolYear.findFirst({
      where: { id: validated.yearId, schoolId },
    })

    if (!year) {
      return { success: false, message: "School year not found" }
    }

    // Delete existing periods for this year
    await db.period.deleteMany({
      where: { schoolId, yearId: validated.yearId },
    })

    // Create new periods
    const periodData = validated.periods.map((p) => {
      const [startHours, startMinutes] = p.startTime.split(":").map(Number)
      const [endHours, endMinutes] = p.endTime.split(":").map(Number)

      const startTime = new Date()
      startTime.setHours(startHours, startMinutes, 0, 0)

      const endTime = new Date()
      endTime.setHours(endHours, endMinutes, 0, 0)

      return {
        schoolId,
        yearId: validated.yearId,
        name: p.name,
        startTime,
        endTime,
      }
    })

    await db.period.createMany({
      data: periodData,
    })

    revalidatePath("/settings")
    return { success: true, message: `${validated.periods.length} periods created successfully` }
  } catch (error) {
    console.error("Failed to bulk create periods:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to create periods",
    }
  }
}
