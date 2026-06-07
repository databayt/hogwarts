// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { type Metadata } from "next"
import { redirect } from "next/navigation"
import { SearchParams } from "nuqs/server"

import { auth } from "@/auth"
import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"
import LiveClassesContent from "@/components/school-dashboard/conference/content"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>
}): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return {
    title: dictionary?.school?.liveClasses?.title || "Live Classes",
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

export default async function Page({ params, searchParams }: Props) {
  const [{ lang }, session] = await Promise.all([params, auth()])
  const role = session?.user?.role ?? ""
  if (!ALLOWED_ROLES.includes(role)) {
    redirect(`/${lang}/dashboard`)
  }

  const dictionary = await getDictionary(lang)
  const d = dictionary?.school?.liveClasses
  const pages: PageNavItem[] = [
    { name: d?.navAll || "All", href: `/${lang}/conference` },
  ]

  // Announcement-pattern listing: title + nav scoped to this page only (main's
  // [id]/schedule/network-test sub-routes keep their own LiveKit UI).
  return (
    <div className="space-y-6">
      <PageHeadingSetter title={d?.title || "Live Classes"} />
      <PageNav pages={pages} />
      <LiveClassesContent
        searchParams={searchParams}
        dictionary={dictionary.school}
        lang={lang}
      />
    </div>
  )
}
