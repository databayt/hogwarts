// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { notFound } from "next/navigation"

import { getCatalogImageUrl } from "@/lib/catalog-image-url"
import { getDisplayText } from "@/lib/content-display"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import type { Locale } from "@/components/internationalization/config"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"
import { CatalogChaptersContent } from "@/components/school-dashboard/listings/subjects/catalog-chapters"
import type { SupportedLanguage } from "@/components/translation/types"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; slug: string }>
}

export default async function CatalogChaptersPage({ params }: Props) {
  const { lang, slug } = await params
  const { schoolId } = await getTenantContext()
  const contentLang = (l: string | null | undefined) =>
    (l || "ar") as SupportedLanguage
  const t = (
    text: string | null | undefined,
    srcLang: string | null | undefined
  ) =>
    schoolId
      ? getDisplayText(text ?? "", contentLang(srcLang), lang, schoolId)
      : Promise.resolve(text ?? "")

  const subject = await db.catalogSubject.findUnique({
    where: { slug },
    select: {
      name: true,
      slug: true,
      description: true,
      department: true,
      lang: true,
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

  // Translate all content names for the current locale
  const sLang = subject.lang
  const [subjectName, subjectDescription, subjectDepartment] =
    await Promise.all([
      t(subject.name, sLang),
      t(subject.description, sLang),
      t(subject.department, sLang),
    ])

  const chapters = await Promise.all(
    subject.chapters.map(async (ch) => ({
      id: ch.id,
      name: await t(ch.name, sLang),
      slug: ch.slug,
      description: ch.description,
      totalLessons: ch.totalLessons,
      imageUrl: getCatalogImageUrl(ch.thumbnailKey, ch.imageKey, "sm"),
      lessons: await Promise.all(
        ch.lessons.map(async (l) => ({
          id: l.id,
          name: await t(l.name, sLang),
          slug: l.slug,
          description: l.description,
          durationMinutes: l.durationMinutes,
          videoCount: l.videoCount,
          resourceCount: l.resourceCount,
          imageUrl: getCatalogImageUrl(l.thumbnailKey, l.imageKey, "md"),
        }))
      ),
    }))
  )

  return (
    <>
      <PageHeadingSetter title="" />
      <CatalogChaptersContent
        subject={{
          name: subjectName,
          slug: subject.slug,
          description: subjectDescription,
          department: subjectDepartment,
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
