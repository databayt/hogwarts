// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { TenantsContent } from "@/components/saas-dashboard/tenants/content"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"

export const metadata = {
  title: "Tenant Management",
  description: "Manage school subdomains and tenant settings",
}

interface Props {
  params: Promise<{ lang: Locale }>
  searchParams: Promise<{
    page?: string
    limit?: string
    status?: string
    plan?: string
    search?: string
  }>
}

export default async function Tenants({ params, searchParams }: Props) {
  const { lang } = await params
  const resolvedSearchParams = await searchParams
  const dictionary = await getDictionary(lang)
  const d = dictionary?.operator

  const n = d?.nav
  const tenantsPages: PageNavItem[] = [
    { name: n?.overview || "Overview", href: `/${lang}/tenants` },
    { name: n?.domains || "Domains", href: `/${lang}/domains` },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={d?.tenants?.title || "Tenants"} />
      <PageNav pages={tenantsPages} />
      <TenantsContent
        dictionary={dictionary}
        lang={lang}
        searchParams={resolvedSearchParams}
      />
    </div>
  )
}
