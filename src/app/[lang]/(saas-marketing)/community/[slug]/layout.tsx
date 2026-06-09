// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { notFound } from "next/navigation"

import { getCatalogImageUrl } from "@/components/catalog/image-url"
import type { Locale } from "@/components/internationalization/config"
import {
  getCommunitySubjectBySlug,
  getCommunitySubjectGradeSiblings,
} from "@/components/saas-marketing/community/queries"
import { CatalogHero } from "@/components/school-dashboard/listings/subjects/catalog-hero"

// Mirror of `school-dashboard/(listings)/subjects/[slug]/layout.tsx` for the
// public /community surface. Renders the subject hero banner + grade-sibling
// pills above the slug page. No auth, no schoolId — relies on the Subject
// row being PUBLISHED.
export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ lang: Locale; slug: string }>
  children: React.ReactNode
}

export default async function CommunitySubjectLayout({
  params,
  children,
}: Props) {
  const { lang, slug } = await params

  const subject = await getCommunitySubjectBySlug(slug)
  if (!subject) notFound()

  const gradeSiblings = await getCommunitySubjectGradeSiblings(
    subject.subjectGroupId
  )

  const heroImageUrl = getCatalogImageUrl(subject.banner, "original")
  const imageUrl = getCatalogImageUrl(subject.thumbnail, "sm")

  return (
    <div className="container mx-auto mt-3 max-w-6xl space-y-5 px-4 pb-16 lg:px-0">
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
