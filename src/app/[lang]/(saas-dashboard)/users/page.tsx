// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"

import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { UsersContent } from "@/components/saas-dashboard/users/content"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>
}): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const b = dictionary?.platform?.breadcrumb
  return {
    title: b?.users || "User Management",
    description: "Manage platform user accounts",
  }
}

interface Props {
  params: Promise<{ lang: Locale }>
  searchParams: Promise<{
    page?: string
    limit?: string
    role?: string
    school?: string
    search?: string
  }>
}

export default async function Users({ params, searchParams }: Props) {
  const { lang } = await params
  const resolvedSearchParams = await searchParams
  const dictionary = await getDictionary(lang)
  const d = dictionary?.operator

  const n = d?.nav
  const usersPages: PageNavItem[] = [
    { name: n?.overview || "Overview", href: `/${lang}/users` },
    { name: n?.analytics || "Analysis", href: `/${lang}/users/analysis` },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title="Users" />
      <PageNav pages={usersPages} />
      <UsersContent
        dictionary={dictionary}
        lang={lang}
        searchParams={resolvedSearchParams}
      />
    </div>
  )
}
