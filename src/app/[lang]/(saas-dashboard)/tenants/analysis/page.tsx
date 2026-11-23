// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"

import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { TenantsAnalysis } from "@/components/saas-dashboard/tenants/analysis"
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
    title: [b?.tenants, b?.analysis].every(Boolean)
      ? [b?.tenants, b?.analysis].join(" - ")
      : "Tenant Analysis",
    description: "Analytics and statistics for school tenants",
  }
}

interface Props {
  params: Promise<{ lang: Locale }>
}

export default async function TenantAnalysisPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const d = dictionary?.operator

  const n = d?.nav
  const tenantsPages: PageNavItem[] = [
    { name: n?.overview || "Overview", href: `/${lang}/tenants` },
    { name: n?.analytics || "Analysis", href: `/${lang}/tenants/analysis` },
    { name: n?.domains || "Domains", href: `/${lang}/domains` },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={d?.tenants?.title || "Tenants"} />
      <PageNav pages={tenantsPages} />
      <TenantsAnalysis dictionary={dictionary} lang={lang} />
    </div>
  )
}
