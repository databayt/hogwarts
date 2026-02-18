import { getCatalogImageUrl } from "@/lib/catalog-image-url"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"

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
          name: true,
          slug: true,
          department: true,
          levels: true,
          color: true,
          imageKey: true,
          thumbnailKey: true,
          totalChapters: true,
          totalLessons: true,
          averageRating: true,
          usageCount: true,
          ratingCount: true,
        },
      })

      subjects = catalogRows.map((s) => ({
        id: s.id,
        slug: s.slug,
        name: customNames.get(s.id) ?? s.name,
        department: s.department,
        levels: s.levels,
        color: s.color,
        imageUrl: getCatalogImageUrl(s.thumbnailKey, s.imageKey, "sm"),
        totalChapters: s.totalChapters,
        totalLessons: s.totalLessons,
        averageRating: s.averageRating,
        usageCount: s.usageCount,
        ratingCount: s.ratingCount,
      }))

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
