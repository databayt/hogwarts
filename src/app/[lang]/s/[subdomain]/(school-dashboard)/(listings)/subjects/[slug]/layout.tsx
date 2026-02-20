import { notFound } from "next/navigation"

import { getCatalogImageUrl } from "@/lib/catalog-image-url"
import { db } from "@/lib/db"
import type { Locale } from "@/components/internationalization/config"
import { CatalogHero } from "@/components/school-dashboard/listings/subjects/catalog-hero"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; slug: string }>
  children: React.ReactNode
}

export default async function CatalogSubjectLayout({
  params,
  children,
}: Props) {
  const { lang, slug } = await params

  const subject = await db.catalogSubject.findUnique({
    where: { slug },
    select: {
      name: true,
      slug: true,
      description: true,
      department: true,
      color: true,
      imageKey: true,
      thumbnailKey: true,
      bannerUrl: true,
      levels: true,
      grades: true,
      totalChapters: true,
      totalLessons: true,
      averageRating: true,
      usageCount: true,
      ratingCount: true,
    },
  })

  if (!subject) {
    notFound()
  }

  const heroImageUrl = getCatalogImageUrl(subject.bannerUrl, null, "original")
  const imageUrl = getCatalogImageUrl(
    subject.thumbnailKey,
    subject.imageKey,
    "sm"
  )

  return (
    <div className="space-y-5">
      <CatalogHero
        subject={{
          name: subject.name,
          slug: subject.slug,
          description: subject.description,
          department: subject.department,
          color: subject.color,
          heroImageUrl,
          imageUrl,
          levels: subject.levels,
          grades: subject.grades,
          totalChapters: subject.totalChapters,
          totalLessons: subject.totalLessons,
          averageRating: subject.averageRating,
          usageCount: subject.usageCount,
          ratingCount: subject.ratingCount,
        }}
        lang={lang}
      />
      {children}
    </div>
  )
}
