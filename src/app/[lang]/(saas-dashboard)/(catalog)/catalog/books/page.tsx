// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { BookContent } from "@/components/saas-dashboard/catalog/book-content"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"

export const metadata = {
  title: "Catalog Books",
  description: "Manage global catalog books shared across schools",
}

interface Props {
  params: Promise<{ lang: Locale }>
}

export default async function BooksPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return (
    <>
      <PageHeadingSetter
        title={dictionary?.saas?.catalog?.navigation?.books || "Catalog Books"}
      />
      <BookContent dictionary={dictionary} lang={lang} />
    </>
  )
}
