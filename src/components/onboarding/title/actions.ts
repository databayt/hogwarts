"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

// TEMPORARILY: Removed top-level db import to isolate 500 error
// Using dynamic import inside functions that need db
// import { db } from "@/lib/db"

// Dynamic db import to avoid module-level initialization issues
async function getDb() {
  const { db } = await import("@/lib/db")
  return db
}

// Removed zod import to isolate 500 error issue

// TEMPORARILY using local createActionResponse to bypass auth-security import
// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface ActionResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  code?: string
  errors?: Record<string, string>
}

function createActionResponse<T>(data?: T, error?: unknown): ActionResponse<T> {
  if (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An error occurred"
    return {
      success: false,
      error: errorMessage,
      code: "ERROR",
    }
  }
  return {
    success: true,
    data,
  }
}

// Inline type definition (removed zod dependency)
export interface TitleFormData {
  title: string
  subdomain?: string
}

export async function updateSchoolTitle(
  schoolId: string,
  data: TitleFormData
): Promise<ActionResponse> {
  console.log("🎯 [UPDATE SCHOOL TITLE] Starting", {
    schoolId,
    data,
    timestamp: new Date().toISOString(),
  })

  try {
    // TEMPORARILY bypassing auth to isolate issue
    console.log("🔐 [UPDATE SCHOOL TITLE] Bypassing auth check temporarily")

    // Simple inline validation (removed zod dependency)
    const title = data.title?.trim() || ""
    const subdomain = data.subdomain?.trim() || ""

    if (title.length < 3) {
      return createActionResponse(undefined, {
        message: "School name must be at least 3 characters",
        name: "ValidationError",
      })
    }

    const validatedData = { title, subdomain }

    // Check for duplicate subdomain (skip if subdomain matches current school's domain)
    if (validatedData.subdomain) {
      // First get current school's domain to avoid false positives on drafts
      const currentSchool = await db.school.findUnique({
        where: { id: schoolId },
        select: { domain: true },
      })

      // Only check for duplicates if subdomain is different from current
      if (currentSchool?.domain !== validatedData.subdomain) {
        const existingSchool = await db.school.findFirst({
          where: {
            domain: validatedData.subdomain,
            NOT: { id: schoolId },
          },
          select: { id: true, domain: true },
        })

        if (existingSchool) {
          return createActionResponse(undefined, {
            message: "SUBDOMAIN_TAKEN",
            name: "DuplicateError",
          })
        }
      }
    }

    // Update school title in database
    console.log("📝 [UPDATE SCHOOL TITLE] Updating database", {
      schoolId,
      newTitle: validatedData.title,
    })

    const updateData: { name: string; domain?: string; updatedAt: Date } = {
      name: validatedData.title,
      updatedAt: new Date(),
    }

    // Only update domain if subdomain is provided
    if (validatedData.subdomain) {
      updateData.domain = validatedData.subdomain
    }

    const updatedSchool = await db.school.update({
      where: { id: schoolId },
      data: updateData,
    })

    console.log("✅ [UPDATE SCHOOL TITLE] Database updated", {
      schoolId: updatedSchool.id,
      name: updatedSchool.name,
      timestamp: updatedSchool.updatedAt,
    })

    revalidatePath(`/onboarding/${schoolId}/title`)

    console.log("🎉 [UPDATE SCHOOL TITLE] Complete - returning success")
    return createActionResponse(updatedSchool)
  } catch (error) {
    console.error("❌ [UPDATE SCHOOL TITLE] Error:", error)

    // Check for Prisma unique constraint violation
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return createActionResponse(undefined, {
        message: "SUBDOMAIN_TAKEN",
        name: "DuplicateError",
      })
    }

    return createActionResponse(undefined, error)
  }
}

export async function getSchoolTitle(
  schoolId: string
): Promise<ActionResponse> {
  console.log("🔍 [GET SCHOOL TITLE] Starting - ULTRA MINIMAL TEST", {
    schoolId,
  })

  // STEP 1: Test if server action works at all (no db, no imports)
  // If this fails, the issue is with server action bundling
  // If this works, the issue is with db/Prisma

  try {
    // Return hardcoded response first to test server action mechanism
    console.log("🔍 [GET SCHOOL TITLE] Returning hardcoded response...")

    // Uncomment below to test with db once hardcoded works
    // const school = await db.school.findUnique({
    //   where: { id: schoolId },
    //   select: { id: true, name: true, domain: true },
    // })

    return {
      success: true,
      data: {
        title: "Test School Name",
        subdomain: "test-subdomain",
      },
    }
  } catch (error) {
    console.error("❌ [GET SCHOOL TITLE] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function proceedToDescription(schoolId: string) {
  try {
    // TEMPORARILY bypassing auth to isolate issue

    // Validate that title exists
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: { name: true },
    })

    if (!school?.name?.trim()) {
      throw new Error("Please set school name before proceeding")
    }

    revalidatePath(`/onboarding/${schoolId}`)
  } catch (error) {
    console.error("Error proceeding to description:", error)
    throw error
  }

  redirect(`/onboarding/${schoolId}/description`)
}
