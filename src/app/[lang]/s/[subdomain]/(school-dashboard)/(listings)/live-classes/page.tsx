// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Metadata } from "next"
import { SearchParams } from "nuqs/server"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import LiveClassesContent from "@/components/school-dashboard/listings/live-classes/content"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
  searchParams: Promise<SearchParams>
}

// Generate dynamic metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return {
    title: dictionary.platform?.sidebar?.["Live Classes"] || "Live Classes",
    description: "Schedule and manage online live classrooms",
  }
}

export default async function LiveClassesPage({ params, searchParams }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return (
    <LiveClassesContent
      searchParams={searchParams}
      dictionary={dictionary}
      lang={lang}
    />
  )
}
