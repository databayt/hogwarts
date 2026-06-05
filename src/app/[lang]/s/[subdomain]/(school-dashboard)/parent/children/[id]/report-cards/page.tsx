// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Locale } from "@/components/internationalization/config"
import { ParentReportCardsContent } from "@/components/school-dashboard/parent-portal/report-cards/content"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
}

export default async function ChildReportCardsPage({ params }: Props) {
  const { id, lang } = await params
  return <ParentReportCardsContent studentId={id} lang={lang} />
}
