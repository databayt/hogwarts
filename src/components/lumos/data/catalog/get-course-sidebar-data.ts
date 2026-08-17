"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { notFound } from "next/navigation"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { getCatalogImageUrl } from "@/components/catalog/image-url"

/**
 * Fetches catalog subject structure for sidebar navigation.
 *
 * The tenant is resolved HERE, never accepted from the caller. This module
 * carries `"use server"`, which compiles every export into a POST endpoint —
 * so a `schoolId` parameter is attacker-controlled and would let anyone read
 * the structure as any school sees it (which hides differ). Same hole that was
 * closed in `get-all-courses.ts` on 2026-07-17; this was the last fetcher in
 * `data/catalog` still carrying it.
 */
export async function getCatalogCourseSidebarData(slug: string) {
  const { schoolId } = await getTenantContext()

  const subject = await db.subject.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
    },
    include: {
      chapters: {
        where: {
          status: "PUBLISHED",
          ...(schoolId
            ? {
                NOT: {
                  overrides: { some: { schoolId, isHidden: true } },
                },
              }
            : {}),
        },
        // Narrow select — mapChapter only reads id/name/sequenceOrder/
        // thumbnail/color, so we skip the Chapter row's @db.Text description
        // and ~10 other unused columns over the wire.
        select: {
          id: true,
          name: true,
          sequenceOrder: true,
          thumbnail: true,
          color: true,
          lessons: {
            where: {
              status: "PUBLISHED",
              ...(schoolId
                ? {
                    NOT: {
                      overrides: { some: { schoolId, isHidden: true } },
                    },
                  }
                : {}),
            },
            orderBy: { sequenceOrder: "asc" },
            select: {
              id: true,
              name: true,
              sequenceOrder: true,
              durationMinutes: true,
              status: true,
              thumbnail: true,
            },
          },
        },
        orderBy: { sequenceOrder: "asc" },
      },
    },
  })

  if (!subject) {
    notFound()
  }

  const mapChapter = (chapter: (typeof subject.chapters)[number]) => ({
    id: chapter.id,
    title: chapter.name,
    position: chapter.sequenceOrder,
    isPublished: true,
    imageUrl: getCatalogImageUrl(chapter.thumbnail, "sm"),
    color: chapter.color,
    lessons: chapter.lessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.name,
      position: lesson.sequenceOrder,
      isPublished: true,
      isFree: true,
      duration: lesson.durationMinutes,
      videoUrl: null as string | null,
      imageUrl: getCatalogImageUrl(lesson.thumbnail, "md"),
    })),
  })

  // Map once (was mapped twice for a `chapters`/`chapter` alias pair; the
  // only consumer reads `.chapter`, so we drop the dead `chapters` key).
  const mappedChapters = subject.chapters.map(mapChapter)

  // Map to Lumos-compatible shape
  return {
    course: {
      id: subject.id,
      title: subject.name,
      slug: subject.slug,
      description: subject.description,
      imageUrl: getCatalogImageUrl(
        subject.banner ?? subject.thumbnail,
        "original"
      ),
      isPublished: true,
      schoolId: null as string | null,
      chapter: mappedChapters,
    },
  }
}
