// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { notFound } from "next/navigation"

import type { Locale } from "@/components/internationalization/config"
import {
  getCommunitySubjectBySlug,
  getCommunitySubjectMaterials,
} from "@/components/saas-marketing/community/queries"
import { MaterialsContent } from "@/components/school-dashboard/listings/subjects/catalog-materials"

// Public mirror of `school-dashboard/(listings)/subjects/[slug]/materials`.
// Public-content gate lives in getCommunitySubjectMaterials. subdomain="" since
// there's no school context; MaterialsContent's links are relative or open
// file/external URLs directly.
export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ lang: Locale; slug: string }>
}

export default async function CommunityMaterialsPage({ params }: Props) {
  const { lang, slug } = await params

  const subject = await getCommunitySubjectBySlug(slug)
  if (!subject) notFound()

  const chapterIds = subject.chapters.map((ch) => ch.id)
  const lessonIds = subject.chapters.flatMap((ch) =>
    ch.lessons.map((l) => l.id)
  )

  const materials = await getCommunitySubjectMaterials({
    subjectId: subject.id,
    chapterIds,
    lessonIds,
  })

  return (
    <MaterialsContent
      subject={{
        name: subject.name,
        slug: subject.slug,
        color: subject.color,
      }}
      materials={materials}
      lang={lang}
      subdomain=""
    />
  )
}
