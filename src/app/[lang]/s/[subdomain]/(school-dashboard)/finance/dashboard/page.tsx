// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Metadata } from "next"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { FinanceDashboardContent } from "@/components/school-dashboard/finance/dashboard/content"

interface Props {
  params: Promise<{ lang: Locale }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return {
    title:
      dictionary?.finance?.dashboardPage?.financialDashboard ||
      "Financial Dashboard | Finance",
    description:
      dictionary?.finance?.dashboardPage?.overviewDescription ||
      "Comprehensive financial overview and key performance indicators",
  }
}

export default async function FinanceDashboardPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return <FinanceDashboardContent lang={lang} />
}
