// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { AnalyticsContent } from "@/components/saas-dashboard/sales/analytics-content"

export const metadata: Metadata = {
  title: "Sales | Analytics",
  description: "Tier funnel, weekly cadence, status distribution",
}

interface Props {
  params: Promise<{ lang: Locale }>
}

export default async function SalesAnalytics({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return <AnalyticsContent dictionary={dictionary.sales} lang={lang} />
}
