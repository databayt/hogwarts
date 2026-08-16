// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { type Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { SearchParams } from "nuqs/server"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import LiveClassesContent from "@/components/school-dashboard/conference/content"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>
}): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const d = dictionary?.school?.liveClasses
  return {
    title: d?.tabs?.sessions ?? d?.title,
  }
}

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
  searchParams: Promise<SearchParams>
}

const ALLOWED_ROLES = [
  "DEVELOPER",
  "ADMIN",
  "TEACHER",
  "STUDENT",
  "GUARDIAN",
  "STAFF",
  "ACCOUNTANT",
]

/**
 * The sessions table — what `/conference` itself used to be, before the
 * landing page took that URL. The heading and tab strip come from the
 * `(app)` layout, so this page renders only its own content.
 */
export default async function Page({ params, searchParams }: Props) {
  const [{ lang }, session] = await Promise.all([params, auth()])
  const role = session?.user?.role ?? ""
  if (!ALLOWED_ROLES.includes(role)) {
    redirect(`/${lang}/dashboard`)
  }

  const dictionary = await getDictionary(lang)

  return (
    <LiveClassesContent
      searchParams={searchParams}
      dictionary={dictionary.school}
      lang={lang}
    />
  )
}
