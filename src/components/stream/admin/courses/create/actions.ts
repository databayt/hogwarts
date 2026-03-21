"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import slugify from "slugify"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import {
  assertStreamPermission,
  getAuthContext,
} from "@/components/stream/authorization"

import type { CreateCourseData } from "../../../types"

export async function createCourseAction(
  subdomain: string,
  formData: FormData
) {
  const session = await auth()
  const { schoolId } = await getTenantContext()

  // Check authentication and authorization
  const authCtx = getAuthContext(session)
  if (!authCtx) throw new Error("Unauthorized")
  authCtx.schoolId = schoolId
  assertStreamPermission(authCtx, "create")

  // Check school context
  if (!schoolId) {
    throw new Error("School context required")
  }

  try {
    // Parse form data
    const title = formData.get("title") as string
    const description = formData.get("description") as string | null
    const categoryId = formData.get("categoryId") as string | null
    const imageUrl = formData.get("imageUrl") as string | null
    const price = formData.get("price")
      ? parseFloat(formData.get("price") as string)
      : null

    // Validate required fields
    if (!title || title.trim().length === 0) {
      throw new Error("Course title is required")
    }

    // Generate slug with random suffix to prevent race conditions
    const baseSlug = slugify(title, { lower: true, strict: true })
    const randomSuffix = Math.random().toString(36).slice(2, 6)

    // Try base slug first, fall back to suffixed slug on conflict
    let slug = baseSlug
    const existing = await db.streamCourse.findFirst({
      where: { slug, schoolId },
      select: { id: true },
    })
    if (existing) {
      slug = `${baseSlug}-${randomSuffix}`
    }

    // Create course in database FIRST (before Stripe) to avoid orphaned products
    const course = await db.streamCourse.create({
      data: {
        title,
        slug,
        description,
        imageUrl,
        categoryId,
        price,
        userId: authCtx.userId,
        schoolId,
        isPublished: false, // Courses start as draft
      },
    })

    // Note: Stripe product/price is created lazily on first paid enrollment
    // (see enrollment/actions.ts) to avoid orphaned Stripe objects

    // Revalidate paths
    revalidatePath(`/[lang]/s/[subdomain]/stream/admin/courses`)

    // Redirect to edit page
    return {
      success: true,
      courseId: course.id,
      slug: course.slug,
    }
  } catch (error) {
    console.error("Failed to create course:", error)
    throw error instanceof Error ? error : new Error("Failed to create course")
  }
}

export async function createCategoryAction(subdomain: string, name: string) {
  const session = await auth()
  const { schoolId } = await getTenantContext()

  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "DEVELOPER") {
    throw new Error("Only administrators can create categories")
  }

  if (!schoolId) {
    throw new Error("School context required")
  }

  try {
    // Check if category already exists
    const existing = await db.streamCategory.findFirst({
      where: {
        name,
        schoolId,
      },
    })

    if (existing) {
      throw new Error("Category already exists")
    }

    const category = await db.streamCategory.create({
      data: {
        name,
        schoolId,
      },
    })

    revalidatePath(`/[lang]/s/[subdomain]/stream/admin/courses/create`)

    return {
      success: true,
      category,
    }
  } catch (error) {
    console.error("Failed to create category:", error)
    throw error instanceof Error
      ? error
      : new Error("Failed to create category")
  }
}
