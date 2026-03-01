// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { notFound } from "next/navigation"

import { getCatalogImageUrl } from "@/lib/catalog-image-url"
import { db } from "@/lib/db"
import type { Locale } from "@/components/internationalization/config"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"
import { CatalogMaterialsContent } from "@/components/school-dashboard/listings/subjects/catalog-materials"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; slug: string }>
}

export default async function CatalogMaterialsPage({ params }: Props) {
  const { lang, subdomain, slug } = await params

  const subject = await db.catalogSubject.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      color: true,
      chapters: {
        where: { status: "PUBLISHED" },
        select: {
          id: true,
          lessons: {
            where: { status: "PUBLISHED" },
            select: { id: true },
          },
        },
      },
    },
  })

  if (!subject) {
    notFound()
  }

  const chapterIds = subject.chapters.map((ch) => ch.id)
  const lessonIds = subject.chapters.flatMap((ch) =>
    ch.lessons.map((l) => l.id)
  )

  const materials = await db.catalogMaterial.findMany({
    where: {
      status: "PUBLISHED",
      OR: [
        { catalogSubjectId: subject.id },
        ...(chapterIds.length > 0
          ? [{ catalogChapterId: { in: chapterIds } }]
          : []),
        ...(lessonIds.length > 0
          ? [{ catalogLessonId: { in: lessonIds } }]
          : []),
      ],
    },
    orderBy: { downloadCount: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      type: true,
      fileUrl: true,
      externalUrl: true,
      pageCount: true,
      mimeType: true,
      tags: true,
      catalogLesson: {
        select: { imageKey: true, thumbnailKey: true, color: true },
      },
      catalogChapter: {
        select: { imageKey: true, thumbnailKey: true, color: true },
      },
      catalogSubject: {
        select: { imageKey: true, thumbnailKey: true, color: true },
      },
    },
  })

  // Resolve image URL per material: lesson > chapter > subject
  const materialsWithImages = materials.map((m) => {
    const sources = [m.catalogLesson, m.catalogChapter, m.catalogSubject]
    let imageUrl: string | null = null
    let color: string | null = null
    for (const src of sources) {
      if (!src) continue
      if (!imageUrl) {
        imageUrl = getCatalogImageUrl(src.thumbnailKey, src.imageKey, "sm")
      }
      if (!color && src.color) {
        color = src.color
      }
      if (imageUrl && color) break
    }
    return {
      id: m.id,
      title: m.title,
      description: m.description,
      type: m.type,
      fileUrl: m.fileUrl,
      externalUrl: m.externalUrl,
      pageCount: m.pageCount,
      mimeType: m.mimeType,
      tags: m.tags,
      imageUrl,
      color,
    }
  })

  return (
    <>
      <PageHeadingSetter title="" />
      <CatalogMaterialsContent
        subject={{
          name: subject.name,
          slug: subject.slug,
          color: subject.color,
        }}
        materials={materialsWithImages}
        lang={lang}
        subdomain={subdomain}
      />
    </>
  )
}
