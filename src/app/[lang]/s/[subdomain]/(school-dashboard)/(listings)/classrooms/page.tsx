// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import ClassroomsContent from "@/components/school-dashboard/listings/classrooms/content"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>
}): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const b = dictionary?.platform?.breadcrumb
  return {
    title: b?.classrooms || "Dashboard: Classrooms",
  }
}

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang, subdomain } = await params
  const dictionary = await getDictionary(lang)

  return <ClassroomsContent lang={lang} subdomain={subdomain} />
}
