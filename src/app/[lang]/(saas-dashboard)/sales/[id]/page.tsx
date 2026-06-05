// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import {
  getOperatorLeadActivities,
  getOperatorLeadById,
} from "@/components/saas-dashboard/sales/actions"
import { LeadDetailContent } from "@/components/saas-dashboard/sales/detail"

export const metadata: Metadata = {
  title: "Sales | Lead",
  description: "Lead detail and activity log",
}

interface Props {
  params: Promise<{ lang: Locale; id: string }>
}

export default async function LeadDetailPage({ params }: Props) {
  const { lang, id } = await params
  const dictionary = await getDictionary(lang)

  const [leadResult, activitiesResult] = await Promise.all([
    getOperatorLeadById(id),
    getOperatorLeadActivities(id),
  ])

  const data = leadResult.success ? leadResult.data : null
  const activities = activitiesResult.success ? activitiesResult.data : []
  const error = leadResult.success ? null : leadResult.error

  return (
    <LeadDetailContent
      data={data}
      activities={activities}
      error={error}
      dictionary={dictionary.sales}
      lang={lang}
    />
  )
}
