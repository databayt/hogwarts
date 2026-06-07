// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { notFound } from "next/navigation"

import { getCloudFrontUrl } from "@/lib/cloudfront-url"
import { getCatalogImageUrl } from "@/components/catalog/image-url"
import type { Locale } from "@/components/internationalization/config"
import {
  getCommunitySubjectBySlug,
  getCommunitySubjectResources,
} from "@/components/saas-marketing/community/queries"
import { CatalogContentSections } from "@/components/school-dashboard/listings/subjects/catalog-content-sections"
import { CatalogDetailContent } from "@/components/school-dashboard/listings/subjects/catalog-detail"

// Public mirror of `school-dashboard/(listings)/subjects/[slug]/page.tsx`.
// Reuses the same client components (CatalogDetailContent + CatalogContentSections)
// — they take plain data props and consume the dictionary via DictionaryProvider
// (already wired by the (saas-marketing) layout). No schoolId is required; we
// skip the school-side translation pipeline and serve subjects whose `lang`
// matches the visitor's locale.
//
// Known limitation (MVP): "See all" / grade-sibling deep links inside the
// reused components hardcode `/[lang]/subjects/...` and `/[lang]/exams/...`
// paths — those routes only exist behind the school-dashboard auth gate, so
// clicking them will 404 on the public domain. The inline content (chapter
// scroller, video tiles, material/exam pipelines, qbank type cards,
// assignments) is what carries this view.
export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ lang: Locale; slug: string }>
}

export default async function CommunitySubjectDetailPage({ params }: Props) {
  const { lang, slug } = await params

  const subject = await getCommunitySubjectBySlug(slug)
  if (!subject) notFound()

  const chapterIds = subject.chapters.map((ch) => ch.id)
  const lessonIds = subject.chapters.flatMap((ch) =>
    ch.lessons.map((l) => l.id)
  )

  const resources = await getCommunitySubjectResources({
    subjectId: subject.id,
    chapterIds,
    lessonIds,
  })

  const heroImageUrl = getCatalogImageUrl(subject.banner, "original")
  const subjectImageUrl = getCatalogImageUrl(subject.thumbnail, "sm")

  // Reshape chapters/lessons for the existing client components. No
  // translation step — the catalog row is already in the visitor's lang
  // (when present) or whatever the seed provides as a fallback.
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

  // Build "video" cards from every lesson — matches the school-dashboard
  // pattern where each lesson surfaces as a video tile (provider="catalog").
  const allLessons = subject.chapters.flatMap((ch) =>
    ch.lessons.map((l) => ({
      id: l.id,
      title: l.name,
      thumbnailUrl: getCatalogImageUrl(l.thumbnail, "original") ?? null,
      durationSeconds: (l.durationMinutes ?? 0) * 60,
      viewCount: 0,
      isFeatured: false,
      provider: "catalog",
      catalogLessonId: l.id,
      color: l.color ?? ch.color ?? null,
    }))
  )

  const contentSections = {
    videos: allLessons,
    materials: resources.materials,
    exams: resources.exams,
    questionStats: resources.questionStats,
    assignments: resources.assignments,
  }

  return (
    <>
      <CatalogDetailContent
        subject={{
          name: subject.name,
          slug: subject.slug,
          description: subject.description,
          department: subject.department,
          color: subject.color,
          heroImageUrl,
          imageUrl: subjectImageUrl,
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
      <CatalogContentSections
        data={contentSections}
        lang={lang}
        subjectColor={subject.color}
        name={subject.name}
        subdomain=""
        subjectSlug={subject.slug}
        catalogSubjectId={subject.id}
        textbookPdfUrl={subject.pdf ? getCloudFrontUrl(subject.pdf) : null}
        textbookCoverUrl={
          subject.cover ? getCloudFrontUrl(subject.cover) : null
        }
      />
    </>
  )
}
