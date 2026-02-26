// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import BlogContent from "@/components/saas-marketing/blog/content"

export const metadata = {
  title: "Blog",
}

interface Props {
  params: Promise<{ lang: Locale }>
}

export default async function Blog({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <BlogContent dictionary={dictionary} lang={lang} />
}
