// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { notFound } from "next/navigation"

import { db } from "@/lib/db"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { BookDetailView } from "@/components/saas-dashboard/catalog/book-detail"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"

export const metadata = {
  title: "Book Detail",
  description: "View and manage a catalog book",
}

interface Props {
  params: Promise<{ lang: Locale; bookId: string }>
}

export default async function BookDetailPage({ params }: Props) {
  const { lang, bookId } = await params
  const dictionary = await getDictionary(lang)

  const book = await db.book.findUnique({
    where: { id: bookId },
    include: {
      _count: {
        select: { bookSelections: true, schoolBooks: true },
      },
    },
  })

  if (!book) notFound()

  return (
    <>
      <PageHeadingSetter title={book.title} />
      <BookDetailView book={book} lang={lang} dictionary={dictionary} />
    </>
  )
}
