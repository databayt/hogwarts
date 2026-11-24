// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import MembershipContent from "@/components/school-dashboard/school/membership/content"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
  searchParams: Promise<{ q?: string | string[]; status?: string | string[] }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return {
    title: dictionary.schoolConsole.meta.membership,
  }
}

export default async function Page({ params, searchParams }: Props) {
  const { lang } = await params
  const { q } = await searchParams
  const dictionary = await getDictionary(lang)
  // `?status=` is read by the table itself (column filter id "status", URL
  // state); `?q=` seeds the search box.
  const initialSearch = (Array.isArray(q) ? q[0] : q)?.slice(0, 100)

  return (
    <MembershipContent
      dictionary={dictionary}
      lang={lang}
      initialSearch={initialSearch}
    />
  )
}
