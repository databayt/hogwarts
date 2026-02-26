// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

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
      clickviewId: true,
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

  // Fetch grade siblings for toggle (same clickviewId, different grades)
  let gradeSiblings: { grade: number; slug: string }[] = []
  if (subject.clickviewId) {
    const siblings = await db.catalogSubject.findMany({
      where: { clickviewId: subject.clickviewId, status: "PUBLISHED" },
      select: { grades: true, slug: true },
      orderBy: { sortOrder: "asc" },
    })
    gradeSiblings = siblings
      .filter((s) => s.grades.length > 0)
      .map((s) => ({ grade: s.grades[0], slug: s.slug }))
      .sort((a, b) => a.grade - b.grade)
  }

  const heroImageUrl = getCatalogImageUrl(subject.bannerUrl, null, "original")
  const imageUrl = getCatalogImageUrl(
    subject.thumbnailKey,
    subject.imageKey,
    "sm"
  )

  return (
    <div className="mt-3 space-y-5">
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
        gradeSiblings={gradeSiblings}
        lang={lang}
      />
      {children}
    </div>
  )
}
