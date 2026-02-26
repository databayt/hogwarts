// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import DocumentsContent from "@/components/school-marketing/apply/documents/content"

export const metadata = {
  title: "Documents | Apply",
  description: "Upload required documents for your application.",
}

interface Props {
  params: Promise<{ lang: Locale }>
}

export default async function DocumentsPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return <DocumentsContent dictionary={dictionary} />
}
