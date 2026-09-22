// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { CatalogCourseType } from "@/components/lumos/data/catalog/get-all-courses"

/** A catalog course as the phone's course cards and search rows read it. */
export function toCourseDto(c: CatalogCourseType) {
  return {
    id: c.id,
    slug: c.slug,
    title: c.title,
    image_url: c.imageUrl,
    color: c._catalog.color,
    grades: c._catalog.grades,
    chapters: c._count.chapters,
    enrollments: c._count.enrollments,
    total_lessons: c._catalog.totalLessons,
    average_rating: c._catalog.averageRating,
    // The search rows' last-resort meta, after grade and lesson count.
    levels: c._catalog.levels,
    category: c.category?.name ?? null,
  }
}
