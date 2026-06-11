"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { Prisma } from "@prisma/client"

import { db } from "@/lib/db"
import { getCatalogImageUrl } from "@/components/catalog/image-url"
import { ensureSubjectSelections } from "@/components/catalog/setup"
import { localize } from "@/components/translation/localize"
import { getLabels } from "@/components/translation/person"
import type { Lang } from "@/components/translation/types"

/**
 * Fetches published catalog subjects available at a school with pagination.
 * Scoped to the school's SubjectSelection (same hierarchy as the subjects page).
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
    grade?: number
    lang?: string
  } = {}
) {
  if (!schoolId) {
    return { rows: [] as CatalogCourseType[], count: 0 }
  }

  const page = params.page ?? 1
  const perPage = params.perPage ?? 12
  const skip = (page - 1) * perPage
  const displayLang = (params.lang || "en") as Lang

  // Get catalog subjects that this school has selected
  let selections = await db.subjectSelection.findMany({
    where: {
      schoolId,
      isActive: true,
    },
    select: {
      catalogSubjectId: true,
      customName: true,
    },
  })

  // Auto-provision if no selections exist (mirrors subjects page behavior)
  if (selections.length === 0) {
    try {
      const { provisioned } = await ensureSubjectSelections(schoolId)
      if (provisioned) {
        selections = await db.subjectSelection.findMany({
          where: { schoolId, isActive: true },
          select: { catalogSubjectId: true, customName: true },
        })
      }
    } catch {
      // Fall through with empty selections
    }
  }

  const subjectIds = [...new Set(selections.map((s) => s.catalogSubjectId))]
  const customNames = new Map(
    selections
      .filter((s) => s.customName)
      .map((s) => [s.catalogSubjectId, s.customName!])
  )

  if (subjectIds.length === 0) {
    return { rows: [] as CatalogCourseType[], count: 0 }
  }

  // Build where clause — scoped to school's selected subjects
  const where: Prisma.SubjectWhereInput = {
    id: { in: subjectIds },
    status: "PUBLISHED",
    ...(params.title
      ? {
          name: {
            contains: params.title,
            mode: Prisma.QueryMode.insensitive,
          },
        }
      : {}),
    ...(params.category ? { department: params.category } : {}),
    ...(params.grade ? { grades: { has: params.grade } } : {}),
  }

  const [subjects, count] = await Promise.all([
    db.subject.findMany({
      where,
      orderBy: { sortOrder: "asc" },
      skip,
      take: perPage,
      select: subjectSelect,
    }),
    db.subject.count({ where }),
  ])

  // Batched translation: Subject name/description via localize (one
  // findMany for the page); custom names + departments via getLabels.
  const [localized, labels] = await Promise.all([
    localize("Subject", subjects, { schoolId, lang: displayLang }),
    getLabels(
      [
        ...subjects
          .filter((s) => customNames.has(s.id))
          .map((s) => customNames.get(s.id)),
        ...subjects.map((s) => s.department),
      ],
      displayLang,
      schoolId
    ),
  ])

  const rows = localized.map((s) => {
    const customName = customNames.get(s.id)
    return toCourseShape(s, {
      title: customName ? (labels.get(customName) ?? customName) : s.name,
      description: s.description ?? "",
      departmentName: s.department
        ? (labels.get(s.department) ?? s.department)
        : s.department,
    })
  })

  return { rows, count }
}

const subjectSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  thumbnail: true,
  banner: true,
  color: true,
  lang: true,
  department: true,
  levels: true,
  grades: true,
  totalChapters: true,
  totalLessons: true,
  usageCount: true,
  averageRating: true,
  createdAt: true,
  updatedAt: true,
} as const

/** Map Subject → PublicCourseType-compatible shape (values pre-translated) */
function toCourseShape(
  subject: {
    id: string
    name: string
    slug: string
    description: string | null
    thumbnail: string | null
    banner: string | null
    color: string | null
    lang: string
    department: string
    levels: string[]
    grades: number[]
    totalChapters: number
    totalLessons: number
    usageCount: number
    averageRating: number
    createdAt: Date
    updatedAt: Date
  },
  translated: { title: string; description: string; departmentName: string }
) {
  const { title, description, departmentName } = translated

  return {
    id: subject.id,
    title,
    slug: subject.slug,
    description,
    imageUrl: getCatalogImageUrl(subject.thumbnail, "sm"),
    price: null as number | null,
    lang: subject.lang,
    createdAt: subject.createdAt,
    updatedAt: subject.updatedAt,
    category: {
      name: departmentName,
    },
    _count: {
      chapters: subject.totalChapters,
      enrollments: subject.usageCount,
    },
    _catalog: {
      color: subject.color,
      banner: subject.banner,
      thumbnail: subject.thumbnail,
      totalLessons: subject.totalLessons,
      averageRating: subject.averageRating,
      levels: subject.levels,
      grades: subject.grades,
    },
  }
}

export type CatalogCourseType = Awaited<ReturnType<typeof toCourseShape>>
