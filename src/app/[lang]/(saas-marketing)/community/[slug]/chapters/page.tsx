// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { notFound } from "next/navigation"

import { getCatalogImageUrl } from "@/components/catalog/image-url"
import type { Locale } from "@/components/internationalization/config"
import { getCommunitySubjectBySlug } from "@/components/saas-marketing/community/queries"
import { ChaptersContent } from "@/components/school-dashboard/listings/subjects/catalog-chapters"

// Public mirror of `school-dashboard/(listings)/subjects/[slug]/chapters`.
// No schoolId / no translation pipeline — the catalog row renders in its
// source language. The hero banner + grade pills come from the shared
// [slug]/layout.tsx that wraps this route.
export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ lang: Locale; slug: string }>
}

export default async function CommunityChaptersPage({ params }: Props) {
  const { lang, slug } = await params

  const subject = await getCommunitySubjectBySlug(slug)
  if (!subject) notFound()

  const heroImageUrl = getCatalogImageUrl(subject.banner, "original")
  const imageUrl = getCatalogImageUrl(subject.thumbnail, "sm")

  const chapters = subject.chapters.map((ch) => ({
    id: ch.id,
    name: ch.name,
    slug: ch.slug,
    description: ch.description,
    totalLessons: ch.totalLessons,
    imageUrl: getCatalogImageUrl(ch.thumbnail, "sm"),
    lessons: ch.lessons.map((l) => ({
      id: l.id,
      name: l.name,
      slug: l.slug,
      description: l.description,
      durationMinutes: l.durationMinutes,
      videoCount: l.videoCount,
      resourceCount: l.resourceCount,
      imageUrl: getCatalogImageUrl(l.thumbnail, "md"),
    })),
  }))

  return (
    <ChaptersContent
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
      chapters={chapters}
      lang={lang}
    />
  )
}
