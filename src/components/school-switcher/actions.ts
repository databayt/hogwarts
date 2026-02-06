"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { switchUserSchool } from "@/lib/school-access"

/**
 * List schools the current user can switch to.
 * - DEVELOPER: all active schools
 * - Others: only their current school (single-school users can't switch)
 */
export async function getAvailableSchools() {
  const session = await auth()
  if (!session?.user?.id) return { schools: [], currentSchoolId: null }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, schoolId: true },
  })

  if (!user) return { schools: [], currentSchoolId: null }

  // DEVELOPERs can access all active schools
  if (user.role === "DEVELOPER") {
    const schools = await db.school.findMany({
      where: { isActive: true },
      select: { id: true, name: true, domain: true },
      orderBy: { name: "asc" },
      take: 50, // Cap for performance
    })
    return { schools, currentSchoolId: user.schoolId }
  }

  // Regular users: return their current school only
  if (user.schoolId) {
    const school = await db.school.findUnique({
      where: { id: user.schoolId },
      select: { id: true, name: true, domain: true },
    })
    return {
      schools: school ? [school] : [],
      currentSchoolId: user.schoolId,
    }
  }

  return { schools: [], currentSchoolId: null }
}

/**
 * Switch the current user to a different school.
 * Requires DEVELOPER role or existing access.
 */
export async function switchSchool(schoolId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" }
  }

  const result = await switchUserSchool(session.user.id, schoolId)

  if (result.success) {
    // Look up school domain for redirect
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: { domain: true },
    })

    revalidatePath("/")
    return { success: true, domain: school?.domain }
  }

  return result
}
