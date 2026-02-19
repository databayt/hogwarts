"use server"

import { Prisma } from "@prisma/client"

import { getCatalogImageUrl } from "@/lib/catalog-image"
import { db } from "@/lib/db"

/**
 * Fetches published catalog subjects available at a school with pagination.
 * Returns { rows, count } shaped like getCoursesList for backward compatibility.
 *
 * Migration: Replaces getCoursesList from queries.ts which queries StreamCourse.
 */
export async function getAllCatalogCourses(
  schoolId: string | null,
  params: {
    page?: number
    perPage?: number
    title?: string
    category?: string
    lang?: string
  } = {}
) {
  if (!schoolId) {
    return { rows: [] as CatalogCourseType[], count: 0 }
  }

  const page = params.page ?? 1
  const perPage = params.perPage ?? 12
  const skip = (page - 1) * perPage

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

  const hasSelections = selections.length > 0
  const subjectIds = hasSelections
    ? [...new Set(selections.map((s) => s.catalogSubjectId))]
    : undefined
  const customNames = hasSelections
    ? new Map(
        selections
          .filter((s) => s.customName)
          .map((s) => [s.catalogSubjectId, s.customName!])
      )
    : new Map<string, string>()

  // Build where clause — show ALL published ClickView subjects (matching subjects page)
  const where: Prisma.CatalogSubjectWhereInput = {
    status: "PUBLISHED",
    system: "clickview",
    ...(params.title
      ? {
          name: {
            contains: params.title,
            mode: Prisma.QueryMode.insensitive,
          },
        }
      : {}),
    ...(params.category ? { department: params.category } : {}),
  }

  const [subjects, count] = await Promise.all([
    db.catalogSubject.findMany({
      where,
      orderBy: { sortOrder: "asc" },
      skip,
      take: perPage,
      select: subjectSelect,
    }),
    db.catalogSubject.count({ where }),
  ])

  const rows = subjects.map((s) => toCourseShape(s, customNames.get(s.id)))

  return { rows, count }
}

const subjectSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  imageKey: true,
  thumbnailKey: true,
  bannerUrl: true,
  color: true,
  lang: true,
  department: true,
  levels: true,
  totalChapters: true,
  totalLessons: true,
  usageCount: true,
  averageRating: true,
  createdAt: true,
  updatedAt: true,
} as const

/** Map CatalogSubject → PublicCourseType-compatible shape */
function toCourseShape(
  subject: {
    id: string
    name: string
    slug: string
    description: string | null
    imageKey: string | null
    thumbnailKey: string | null
    bannerUrl: string | null
    color: string | null
    lang: string
    department: string
    levels: string[]
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
    imageUrl: getCatalogImageUrl(subject.thumbnailKey, subject.imageKey, "sm"),
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
    _catalog: {
      color: subject.color,
      bannerUrl: subject.bannerUrl,
      imageKey: subject.imageKey,
      thumbnailKey: subject.thumbnailKey,
      totalLessons: subject.totalLessons,
      averageRating: subject.averageRating,
      levels: subject.levels,
    },
  }
}

export type CatalogCourseType = ReturnType<typeof toCourseShape>
