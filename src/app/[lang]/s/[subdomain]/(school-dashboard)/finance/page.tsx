// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"
import { auth } from "@/auth"

import type { Role } from "@/lib/rbac/types"
import { PageNav } from "@/components/atom/page-nav"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"
import FinanceContent from "@/components/school-dashboard/finance/content"
import { getFinanceRootTabs } from "@/components/school-dashboard/finance/permissions"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return { title: dictionary?.finance?.title || "Dashboard: Finance" }
}

export default async function Page({ params }: Props) {
  const [{ lang }, session] = await Promise.all([params, auth()])
  const dictionary = await getDictionary(lang)
  const d = dictionary?.finance
  const role = (session?.user?.role ?? null) as Role | null

  const financePages = getFinanceRootTabs(role, lang, d)

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={d?.title || "Finance"} />
      <PageNav pages={financePages} />
      <FinanceContent dictionary={dictionary} lang={lang} />
    </div>
  )
}
