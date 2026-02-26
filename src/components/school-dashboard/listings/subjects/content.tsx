// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { getCatalogImageUrl } from "@/lib/catalog-image-url"
import { getDisplayText } from "@/lib/content-display"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"
import type { SupportedLanguage } from "@/components/translation/types"

import {
  CatalogSubjectsGrid,
  type CatalogSubjectItem,
} from "./catalog-subjects-grid"

interface Props {
  lang: Locale
  level?: string
}

export default async function SubjectsContent({ lang, level }: Props) {
  const { schoolId } = await getTenantContext()
  let subjects: CatalogSubjectItem[] = []

  if (schoolId) {
    try {
      // Get school's active catalog selections (deduplicated)
      const selections = await db.schoolSubjectSelection.findMany({
        where: { schoolId, isActive: true },
        select: { catalogSubjectId: true, customName: true },
      })

      const uniqueIds = [...new Set(selections.map((s) => s.catalogSubjectId))]
      const customNames = new Map(
        selections
          .filter((s) => s.customName)
          .map((s) => [s.catalogSubjectId, s.customName!])
      )

      // Fetch ALL published catalog subjects (selections provide custom names only)
      const catalogRows = await db.catalogSubject.findMany({
        where: { status: "PUBLISHED", system: "clickview" },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          clickviewId: true,
          name: true,
          slug: true,
          department: true,
          levels: true,
          grades: true,
          color: true,
          imageKey: true,
          thumbnailKey: true,
          lang: true,
          totalChapters: true,
          totalLessons: true,
          averageRating: true,
          usageCount: true,
          ratingCount: true,
        },
      })

      // Group by clickviewId → ~62 groups (one per original inventory entry)
      const groupMap = new Map<string, typeof catalogRows>()
      for (const s of catalogRows) {
        const key = s.clickviewId ?? s.id
        if (!groupMap.has(key)) groupMap.set(key, [])
        groupMap.get(key)!.push(s)
      }

      // For each group, pick the first (lowest grade) as the representative
      subjects = await Promise.all(
        Array.from(groupMap.values()).map(async (group) => {
          const sorted = group.sort(
            (a, b) => (a.grades[0] ?? 0) - (b.grades[0] ?? 0)
          )
          const rep = sorted[0]
          return {
            id: rep.id,
            slug: rep.slug,
            name: await getDisplayText(
              customNames.get(rep.id) ?? rep.name,
              (rep.lang || "ar") as SupportedLanguage,
              lang,
              schoolId!
            ),
            department: rep.department
              ? await getDisplayText(
                  rep.department,
                  (rep.lang || "ar") as SupportedLanguage,
                  lang,
                  schoolId!
                )
              : "",
            level: rep.levels[0] ?? "ELEMENTARY",
            levels: rep.levels,
            grades: sorted.flatMap((s) => s.grades).sort((a, b) => a - b),
            color: rep.color,
            imageUrl: getCatalogImageUrl(rep.thumbnailKey, rep.imageKey, "sm"),
            totalChapters: rep.totalChapters,
            totalLessons: rep.totalLessons,
            averageRating: rep.averageRating,
            usageCount: rep.usageCount,
            ratingCount: rep.ratingCount,
          }
        })
      )

      if (level) {
        subjects = subjects.filter((s) => s.levels.includes(level))
      }
    } catch {
      // Catalog tables may not exist yet (migrations pending)
    }
  }

  return (
    <div className="space-y-6">
      <CatalogSubjectsGrid subjects={subjects} lang={lang} />
    </div>
  )
}
