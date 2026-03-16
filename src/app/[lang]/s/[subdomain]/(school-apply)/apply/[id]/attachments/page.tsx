// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import AttachmentsContent from "@/components/school-marketing/apply/attachments/content"

export const metadata = {
  title: "Attachments | Apply",
  description: "Upload photo and documents for your application.",
}

interface Props {
  params: Promise<{ lang: Locale }>
}

export default async function AttachmentsPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return <AttachmentsContent dictionary={dictionary} />
}
