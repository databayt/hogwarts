// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { type Metadata } from "next"

import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import UpcomingExamsContent from "@/components/school-dashboard/exams/upcoming/content"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return { title: dictionary?.school?.exams?.upcomingExams || "Upcoming Exams" }
}

export default async function UpcomingExamsPage({
  params,
  searchParams,
}: Props) {
  const { lang } = await params
  const sp = await searchParams
  const dictionary = await getDictionary(lang)
  const catalogSubjectId =
    typeof sp.catalogSubjectId === "string" ? sp.catalogSubjectId : undefined

  return (
    <UpcomingExamsContent
      dictionary={dictionary}
      lang={lang}
      catalogSubjectId={catalogSubjectId}
    />
  )
}
