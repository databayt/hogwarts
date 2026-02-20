import { notFound } from "next/navigation"

import { getCatalogImageUrl } from "@/lib/catalog-image-url"
import { db } from "@/lib/db"
import type { Locale } from "@/components/internationalization/config"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"
import { CatalogChaptersContent } from "@/components/school-dashboard/listings/subjects/catalog-chapters"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; slug: string }>
}

export default async function CatalogChaptersPage({ params }: Props) {
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
      chapters: {
        where: { status: "PUBLISHED" },
        orderBy: { sequenceOrder: "asc" },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          imageKey: true,
          thumbnailKey: true,
          totalLessons: true,
          lessons: {
            where: { status: "PUBLISHED" },
            orderBy: { sequenceOrder: "asc" },
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
              imageKey: true,
              thumbnailKey: true,
              durationMinutes: true,
              videoCount: true,
              resourceCount: true,
            },
          },
        },
      },
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

  const chapters = subject.chapters.map((ch) => ({
    id: ch.id,
    name: ch.name,
    slug: ch.slug,
    description: ch.description,
    totalLessons: ch.totalLessons,
    imageUrl: getCatalogImageUrl(ch.thumbnailKey, ch.imageKey, "sm"),
    lessons: ch.lessons.map((l) => ({
      id: l.id,
      name: l.name,
      slug: l.slug,
      description: l.description,
      durationMinutes: l.durationMinutes,
      videoCount: l.videoCount,
      resourceCount: l.resourceCount,
      imageUrl: getCatalogImageUrl(l.thumbnailKey, l.imageKey, "md"),
    })),
  }))

  return (
    <>
      <PageHeadingSetter title="" />
      <CatalogChaptersContent
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
    </>
  )
}
