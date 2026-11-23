// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import SubjectsContent from "@/components/school-dashboard/listings/subjects/content"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>
}): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const b = dictionary?.platform?.breadcrumb
  return {
    title: [b?.subjects, b?.middle].every(Boolean)
      ? [b?.subjects, b?.middle].join(" - ")
      : "Dashboard: Middle Subjects",
  }
}

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
  searchParams?: Promise<{ studentId?: string; teacherId?: string }>
}

export default async function Page({ params, searchParams }: Props) {
  const { lang } = await params
  const { studentId, teacherId } = (await searchParams) ?? {}

  return (
    <SubjectsContent
      lang={lang}
      level="MIDDLE"
      studentId={studentId}
      teacherId={teacherId}
    />
  )
}
