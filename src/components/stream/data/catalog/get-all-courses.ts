"use server"

import { getCatalogImageUrl } from "@/lib/catalog-image"
import { db } from "@/lib/db"

/**
 * Fetches all published catalog subjects available at a school (via SchoolSubjectSelection).
 * Returns data shaped like PublicCourseType for backward compatibility with existing UI.
 *
 * Migration: Replaces get-all-courses.ts which queries StreamCourse.
 */
export async function getAllCatalogCourses(
  schoolId: string | null,
  lang: string = "en"
) {
  if (!schoolId) {
    return []
  }

  // Get catalog subjects that this school has selected
  const selections = await db.schoolSubjectSelection.findMany({
    where: {
      schoolId,
      isActive: true,
    },
    select: {
      catalogSubjectId: true,
      customName: true,
    },
  })

  if (selections.length === 0) {
    // Fall back to all published catalog subjects (for schools that haven't selected yet)
    const subjects = await db.catalogSubject.findMany({
      where: {
        status: "PUBLISHED",
        lang,
      },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        imageKey: true,
        thumbnailKey: true,
        color: true,
        lang: true,
        department: true,
        totalChapters: true,
        totalLessons: true,
        usageCount: true,
        averageRating: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return subjects.map((s) => toCourseShape(s))
  }

  const subjectIds = [...new Set(selections.map((s) => s.catalogSubjectId))]
  const customNames = new Map(
    selections
      .filter((s) => s.customName)
      .map((s) => [s.catalogSubjectId, s.customName!])
  )

  const subjects = await db.catalogSubject.findMany({
    where: {
      id: { in: subjectIds },
      status: "PUBLISHED",
    },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      imageKey: true,
      thumbnailKey: true,
      color: true,
      lang: true,
      department: true,
      totalChapters: true,
      totalLessons: true,
      usageCount: true,
      averageRating: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return subjects.map((s) => toCourseShape(s, customNames.get(s.id)))
}

/** Map CatalogSubject → PublicCourseType-compatible shape */
function toCourseShape(
  subject: {
    id: string
    name: string
    slug: string
    description: string | null
    imageKey: string | null
    thumbnailKey: string | null
    color: string | null
    lang: string
    department: string
    totalChapters: number
    totalLessons: number
    usageCount: number
    averageRating: number
    createdAt: Date
    updatedAt: Date
  },
  customName?: string
) {
  return {
    id: subject.id,
    title: customName || subject.name,
    slug: subject.slug,
    description: subject.description,
    imageUrl: getCatalogImageUrl(
      subject.thumbnailKey,
      subject.imageKey,
      "original"
    ),
    price: null as number | null,
    lang: subject.lang,
    createdAt: subject.createdAt,
    updatedAt: subject.updatedAt,
    category: {
      name: subject.department,
    },
    _count: {
      chapters: subject.totalChapters,
      enrollments: subject.usageCount,
    },
    // Extra catalog fields
    _catalog: {
      color: subject.color,
      imageKey: subject.imageKey,
      thumbnailKey: subject.thumbnailKey,
      totalLessons: subject.totalLessons,
      averageRating: subject.averageRating,
    },
  }
}

export type CatalogCourseType = Awaited<
  ReturnType<typeof getAllCatalogCourses>
>[0]
