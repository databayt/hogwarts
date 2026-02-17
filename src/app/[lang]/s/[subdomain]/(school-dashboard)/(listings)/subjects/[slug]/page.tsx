import { notFound } from "next/navigation"

import { getCatalogImageUrl } from "@/lib/catalog-image-url"
import { db } from "@/lib/db"
import type { Locale } from "@/components/internationalization/config"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"
import { CatalogDetailContent } from "@/components/school-dashboard/listings/subjects/catalog-detail"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; slug: string }>
}

export default async function CatalogSubjectDetailPage({ params }: Props) {
  const { lang, slug } = await params

  const subject = await db.catalogSubject.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      department: true,
      color: true,
      imageKey: true,
      thumbnailKey: true,
      levels: true,
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
            },
          },
        },
      },
    },
  })

  if (!subject) {
    notFound()
  }

  const heroImageUrl = getCatalogImageUrl(
    subject.thumbnailKey,
    subject.imageKey,
    "lg"
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
      imageUrl: getCatalogImageUrl(l.thumbnailKey, l.imageKey, "md"),
    })),
  }))

  return (
    <>
      <PageHeadingSetter title="" />
      <CatalogDetailContent
        subject={{
          name: subject.name,
          slug: subject.slug,
          description: subject.description,
          department: subject.department,
          color: subject.color,
          heroImageUrl,
          levels: subject.levels,
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
