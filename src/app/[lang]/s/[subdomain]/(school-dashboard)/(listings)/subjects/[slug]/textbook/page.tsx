// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { notFound } from "next/navigation"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"
import { TextbookContent } from "@/components/school-dashboard/listings/subjects/textbook/content"
import type { ReaderLabels } from "@/components/school-dashboard/listings/subjects/textbook/reader"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; slug: string }>
}

/**
 * /subjects/[slug]/textbook — native-text reader for the subject's textbook.
 * Catalog reads are global (no schoolId); the tenant context is resolved for
 * parity with the sibling sub-routes so the school chrome stays consistent.
 */
export default async function SubjectTextbookPage({ params }: Props) {
  const { lang, slug } = await params
  const dictionary = await getDictionary(lang)
  await getTenantContext()

  const subject = await db.subject.findUnique({
    where: { slug, status: "PUBLISHED" },
    select: {
      name: true,
      slug: true,
      pdf: true,
      chapters: {
        where: { status: "PUBLISHED" },
        orderBy: { sequenceOrder: "asc" },
        select: {
          id: true,
          name: true,
          lessons: {
            where: { status: "PUBLISHED" },
            orderBy: { sequenceOrder: "asc" },
            select: { id: true, name: true },
          },
        },
      },
    },
  })
  if (!subject || !subject.pdf) notFound()

  const labels = (dictionary.school?.subjects?.catalog?.reader ??
    {}) as ReaderLabels

  return (
    <>
      <PageHeadingSetter title="" />
      <TextbookContent
        subject={{
          name: subject.name,
          slug: subject.slug,
          pdfKey: subject.pdf,
          chapters: subject.chapters,
        }}
        labels={labels}
        lang={lang}
      />
    </>
  )
}
