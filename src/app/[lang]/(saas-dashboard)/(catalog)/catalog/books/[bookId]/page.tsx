// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { notFound } from "next/navigation"

import { db } from "@/lib/db"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { CatalogBookDetailView } from "@/components/saas-dashboard/catalog/book-detail"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"

export const metadata = {
  title: "Book Detail",
  description: "View and manage a catalog book",
}

interface Props {
  params: Promise<{ lang: Locale; bookId: string }>
}

export default async function CatalogBookDetailPage({ params }: Props) {
  const { lang, bookId } = await params
  const dictionary = await getDictionary(lang)

  const book = await db.catalogBook.findUnique({
    where: { id: bookId },
    include: {
      _count: {
        select: { schoolSelections: true, books: true },
      },
    },
  })

  if (!book) notFound()

  return (
    <>
      <PageHeadingSetter title={book.title} />
      <CatalogBookDetailView book={book} lang={lang} />
    </>
  )
}
