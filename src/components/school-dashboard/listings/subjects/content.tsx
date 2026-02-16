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

      // Fetch catalog subjects — selections or fallback to all published
      const catalogRows =
        uniqueIds.length > 0
          ? await db.catalogSubject.findMany({
              where: { id: { in: uniqueIds }, status: "PUBLISHED" },
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
              },
            })
          : await db.catalogSubject.findMany({
              where: { status: "PUBLISHED" },
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
              },
            })

      subjects = catalogRows.map((s) => ({
        id: s.id,
        slug: s.slug,
        name: customNames.get(s.id) ?? s.name,
        department: s.department,
        levels: s.levels,
        color: s.color,
        imageUrl: getCatalogImageUrl(s.thumbnailKey, s.imageKey, "original"),
        totalChapters: s.totalChapters,
        totalLessons: s.totalLessons,
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
