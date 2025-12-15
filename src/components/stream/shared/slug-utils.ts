import slugify from "slugify"

import { db } from "@/lib/db"

/**
 * Generate a URL-friendly slug from a string
 *
 * @param text - Text to convert to slug
 * @returns URL-friendly slug
 *
 * @example
 * generateSlug("Introduction to Python Programming") // "introduction-to-python-programming"
 * generateSlug("العربية: دورة البرمجة") // "lrbyt-dwrt-lbrmjt"
 */
export function generateSlug(text: string): string {
  return slugify(text, {
    lower: true,
    strict: true,
    trim: true,
  })
}

/**
 * Generate a unique slug for a course
 * Checks database and appends number if slug already exists
 *
 * @param title - Course title
 * @param schoolId - School ID for multi-tenant scoping
 * @param excludeId - Course ID to exclude from check (for updates)
 * @returns Unique slug
 *
 * @example
 * await generateUniqueCourseSlug("Python Programming", "school123") // "python-programming"
 * await generateUniqueCourseSlug("Python Programming", "school123") // "python-programming-2"
 */
export async function generateUniqueCourseSlug(
  title: string,
  schoolId: string,
  excludeId?: string
): Promise<string> {
  const baseSlug = generateSlug(title)
  let slug = baseSlug
  let counter = 1

  while (true) {
    const existing = await db.streamCourse.findFirst({
      where: {
        slug,
        schoolId,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
    })

    if (!existing) {
      return slug
    }

    counter++
    slug = `${baseSlug}-${counter}`
  }
}

/**
 * Validate slug format
 *
 * @param slug - Slug to validate
 * @returns true if valid, false otherwise
 */
export function isValidSlug(slug: string): boolean {
  // Must be lowercase alphanumeric with hyphens only
  // Must start and end with alphanumeric
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  return slugRegex.test(slug)
}

/**
 * Client-side slug preview generator
 * Converts title to slug in real-time without database check
 *
 * @param title - Course title
 * @returns Slug preview
 */
export function generateSlugPreview(title: string): string {
  return generateSlug(title)
}
