/**
 * Hall Pass Server Actions
 *
 * Server actions for managing digital hall passes.
 */
"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import type { HallPassDestination } from "@prisma/client"

import { db } from "@/lib/db"

import type { CreateHallPassInput, ReturnHallPassInput } from "./validation"

interface ActionResult {
  success: boolean
  error?: string
  data?: unknown
}

/**
 * Create a new hall pass
 */
export async function createHallPass(
  input: CreateHallPassInput
): Promise<ActionResult> {
  const session = await auth()
  const schoolId = session?.user?.schoolId
  const userId = session?.user?.id

  if (!schoolId || !userId) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const {
      studentId,
      classId,
      destination,
      destinationNote,
      expectedDuration,
      notes,
    } = input

    // Check for active passes for this student
    const existingPass = await db.hallPass.findFirst({
      where: {
        schoolId,
        studentId,
        status: "ACTIVE",
      },
    })

    if (existingPass) {
      return {
        success: false,
        error: "Student already has an active hall pass",
      }
    }

    // Check for conflict (optional - students who shouldn't be out together)
    const conflictingPasses = await db.hallPass.findMany({
      where: {
        schoolId,
        status: "ACTIVE",
        destination: destination as HallPassDestination,
      },
      select: { id: true, studentId: true },
    })

    // Calculate expected return time
    const now = new Date()
    const expectedReturn = new Date(
      now.getTime() + expectedDuration * 60 * 1000
    )

    // Create the hall pass
    const hallPass = await db.hallPass.create({
      data: {
        schoolId,
        studentId,
        classId,
        destination: destination as HallPassDestination,
        destinationNote,
        issuedBy: userId,
        expectedDuration,
        expectedReturn,
        notes,
        conflictWith:
          conflictingPasses.length > 0 ? conflictingPasses[0].id : null,
      },
      include: {
        student: {
          select: { givenName: true, surname: true },
        },
        class: {
          select: { name: true },
        },
      },
    })

    revalidatePath("/attendance/hall-passes")

    return {
      success: true,
      data: {
        id: hallPass.id,
        studentName: `${hallPass.student.givenName} ${hallPass.student.surname}`,
        className: hallPass.class.name,
        destination: hallPass.destination,
        expectedReturn: hallPass.expectedReturn,
        hasConflict: !!hallPass.conflictWith,
      },
    }
  } catch (error) {
    console.error("Error creating hall pass:", error)
    return { success: false, error: "Failed to create hall pass" }
  }
}

/**
 * Return a hall pass (student has returned)
 */
export async function returnHallPass(
  input: ReturnHallPassInput
): Promise<ActionResult> {
  const session = await auth()
  const schoolId = session?.user?.schoolId

  if (!schoolId) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const { passId, notes } = input

    const hallPass = await db.hallPass.findFirst({
      where: {
        id: passId,
        schoolId,
        status: "ACTIVE",
      },
    })

    if (!hallPass) {
      return { success: false, error: "Hall pass not found or not active" }
    }

    const now = new Date()
    const isExpired = now > hallPass.expectedReturn

    await db.hallPass.update({
      where: { id: passId },
      data: {
        returnedAt: now,
        status: isExpired ? "EXPIRED" : "RETURNED",
        notes: notes
          ? `${hallPass.notes || ""}\nReturn note: ${notes}`.trim()
          : hallPass.notes,
      },
    })

    revalidatePath("/attendance/hall-passes")

    return {
      success: true,
      data: {
        returnedAt: now,
        wasLate: isExpired,
        duration: Math.round(
          (now.getTime() - hallPass.issuedAt.getTime()) / 60000
        ),
      },
    }
  } catch (error) {
    console.error("Error returning hall pass:", error)
    return { success: false, error: "Failed to return hall pass" }
  }
}

/**
 * Cancel a hall pass
 */
export async function cancelHallPass(passId: string): Promise<ActionResult> {
  const session = await auth()
  const schoolId = session?.user?.schoolId

  if (!schoolId) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const hallPass = await db.hallPass.findFirst({
      where: {
        id: passId,
        schoolId,
        status: "ACTIVE",
      },
    })

    if (!hallPass) {
      return { success: false, error: "Hall pass not found or not active" }
    }

    await db.hallPass.update({
      where: { id: passId },
      data: { status: "CANCELLED" },
    })

    revalidatePath("/attendance/hall-passes")

    return { success: true }
  } catch (error) {
    console.error("Error cancelling hall pass:", error)
    return { success: false, error: "Failed to cancel hall pass" }
  }
}

/**
 * Get all active hall passes for a school
 */
export async function getActiveHallPasses(): Promise<ActionResult> {
  const session = await auth()
  const schoolId = session?.user?.schoolId

  if (!schoolId) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const now = new Date()

    // Update expired passes
    await db.hallPass.updateMany({
      where: {
        schoolId,
        status: "ACTIVE",
        expectedReturn: { lt: now },
      },
      data: { status: "EXPIRED" },
    })

    const passes = await db.hallPass.findMany({
      where: {
        schoolId,
        status: "ACTIVE",
      },
      include: {
        student: {
          select: {
            id: true,
            givenName: true,
            surname: true,
            profilePhotoUrl: true,
          },
        },
        class: {
          select: { id: true, name: true },
        },
      },
      orderBy: { issuedAt: "desc" },
    })

    return {
      success: true,
      data: passes.map((pass) => ({
        id: pass.id,
        student: {
          id: pass.student.id,
          name: `${pass.student.givenName} ${pass.student.surname}`,
          photoUrl: pass.student.profilePhotoUrl,
        },
        class: pass.class,
        destination: pass.destination,
        destinationNote: pass.destinationNote,
        issuedAt: pass.issuedAt,
        expectedReturn: pass.expectedReturn,
        expectedDuration: pass.expectedDuration,
        minutesRemaining: Math.max(
          0,
          Math.round((pass.expectedReturn.getTime() - now.getTime()) / 60000)
        ),
        hasConflict: !!pass.conflictWith,
      })),
    }
  } catch (error) {
    console.error("Error getting active hall passes:", error)
    return { success: false, error: "Failed to get hall passes" }
  }
}

/**
 * Get hall pass history for a student
 */
export async function getStudentHallPassHistory(
  studentId: string,
  limit = 10
): Promise<ActionResult> {
  const session = await auth()
  const schoolId = session?.user?.schoolId

  if (!schoolId) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const passes = await db.hallPass.findMany({
      where: {
        schoolId,
        studentId,
      },
      include: {
        class: { select: { name: true } },
      },
      orderBy: { issuedAt: "desc" },
      take: limit,
    })

    return {
      success: true,
      data: passes.map((pass) => ({
        id: pass.id,
        className: pass.class.name,
        destination: pass.destination,
        issuedAt: pass.issuedAt,
        returnedAt: pass.returnedAt,
        status: pass.status,
        duration: pass.returnedAt
          ? Math.round(
              (pass.returnedAt.getTime() - pass.issuedAt.getTime()) / 60000
            )
          : null,
        wasLate: pass.status === "EXPIRED",
      })),
    }
  } catch (error) {
    console.error("Error getting student hall pass history:", error)
    return { success: false, error: "Failed to get hall pass history" }
  }
}

/**
 * Get hall pass statistics for a class or school
 */
export async function getHallPassStats(
  classId?: string
): Promise<ActionResult> {
  const session = await auth()
  const schoolId = session?.user?.schoolId

  if (!schoolId) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const where = {
      schoolId,
      ...(classId ? { classId } : {}),
      issuedAt: { gte: today, lt: tomorrow },
    }

    const [total, active, expired, returned] = await Promise.all([
      db.hallPass.count({ where }),
      db.hallPass.count({ where: { ...where, status: "ACTIVE" } }),
      db.hallPass.count({ where: { ...where, status: "EXPIRED" } }),
      db.hallPass.count({ where: { ...where, status: "RETURNED" } }),
    ])

    // Get destination breakdown
    const byDestination = await db.hallPass.groupBy({
      by: ["destination"],
      where,
      _count: true,
    })

    return {
      success: true,
      data: {
        today: {
          total,
          active,
          expired,
          returned,
          cancelled: total - active - expired - returned,
        },
        byDestination: byDestination.map((d) => ({
          destination: d.destination,
          count: d._count,
        })),
      },
    }
  } catch (error) {
    console.error("Error getting hall pass stats:", error)
    return { success: false, error: "Failed to get hall pass stats" }
  }
}
