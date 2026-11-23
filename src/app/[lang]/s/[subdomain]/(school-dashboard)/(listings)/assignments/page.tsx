// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { type Metadata } from "next"
import { SearchParams } from "nuqs/server"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import AssignmentsContent from "@/components/school-dashboard/listings/assignments/content"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>
}): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return { title: dictionary?.school?.assignments?.title || "Assignments" }
}

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
  searchParams: Promise<SearchParams>
}

export default async function Page({ params, searchParams }: Props) {
  const { lang } = await params
  // Started here, awaited inside the content alongside auth + tenant.
  const dictionary = getDictionary(lang)

  return (
    <AssignmentsContent
      searchParams={searchParams}
      dictionary={dictionary}
      lang={lang}
    />
  )
}
