// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Metadata } from "next"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import SubjectsContent from "@/components/school-dashboard/listings/subjects/content"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
  searchParams?: Promise<{ studentId?: string; teacherId?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return {
    title: dictionary.school.subjects?.title || "Subjects",
  }
}

export default async function Page({ params, searchParams }: Props) {
  const { lang } = await params
  const { studentId, teacherId } = (await searchParams) ?? {}

  return (
    <SubjectsContent lang={lang} studentId={studentId} teacherId={teacherId} />
  )
}
