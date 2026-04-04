// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { getCatalogImageUrl } from "@/lib/catalog-image-url"
import { ensureSubjectSelections } from "@/lib/catalog-setup"
import { getDisplayText } from "@/lib/content-display"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"
import type { SupportedLanguage } from "@/components/translation/types"

import { SubjectsGrid, type SubjectItem } from "./catalog-subjects-grid"

const SELECTION_SELECT = {
  catalogSubjectId: true,
  customName: true,
  subject: {
    select: {
      id: true,
      clickviewId: true,
      name: true,
      slug: true,
      department: true,
      levels: true,
      grades: true,
      color: true,
      thumbnail: true,
      lang: true,
      totalChapters: true,
      totalLessons: true,
      averageRating: true,
      usageCount: true,
      ratingCount: true,
      status: true,
    },
  },
} as const

interface Props {
  lang: Locale
  level?: string
}

export default async function SubjectsContent({ lang, level }: Props) {
  const { schoolId } = await getTenantContext()
  let subjects: SubjectItem[] = []

  if (schoolId) {
    try {
      // Get school's active catalog selections with their catalog subjects
      let selections = await db.subjectSelection.findMany({
        where: { schoolId, isActive: true },
        select: SELECTION_SELECT,
      })

      // Auto-provision: if no selections exist, the school was likely created
      // without catalog setup completing (e.g. after() callback failed on
      // serverless, or provisioning never ran). Attempt to provision now so
      // the user sees subjects immediately instead of an empty page.
      if (selections.length === 0) {
        try {
          const { provisioned } = await ensureSubjectSelections(schoolId)
          if (provisioned) {
            // Re-fetch after provisioning
            selections = await db.subjectSelection.findMany({
              where: { schoolId, isActive: true },
              select: SELECTION_SELECT,
            })
          }
        } catch (provisionError) {
          console.error(
            "[Subjects] Auto-provision failed:",
            provisionError instanceof Error
              ? provisionError.message
              : String(provisionError)
          )
        }
      }

      const customNames = new Map(
        selections
          .filter((s) => s.customName)
          .map((s) => [s.catalogSubjectId, s.customName!])
      )

      // Extract published catalog subjects from selections (deduplicated)
      const seen = new Set<string>()
      const catalogRows = selections
        .map((s) => s.subject)
        .filter((s) => {
          if (!s || s.status !== "PUBLISHED" || seen.has(s.id)) return false
          seen.add(s.id)
          return true
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
            imageUrl: getCatalogImageUrl(rep.thumbnail, "sm"),
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
    } catch (error) {
      // Catalog tables may not exist yet (migrations pending)
      // Log unexpected errors for debugging
      const message = error instanceof Error ? error.message : String(error)
      if (
        !message.includes("does not exist") &&
        !message.includes("relation")
      ) {
        console.error("[Subjects] Unexpected error:", message)
      }
    }
  }

  return (
    <div className="space-y-6">
      <SubjectsGrid subjects={subjects} lang={lang} />
    </div>
  )
}
