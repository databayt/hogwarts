// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { redirect } from "next/navigation"

import { type Locale } from "@/components/internationalization/config"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

/**
 * /attendance/analysis duplicated /attendance/analytics (same
 * AnalyticsContent, plus an Early Warning tab that has its own route) with
 * hardcoded-English chrome. Consolidated: permanent redirect to the
 * canonical, localized analytics page.
 */
export default async function Page({ params }: Props) {
  const { lang } = await params
  redirect(`/${lang}/attendance/analytics`)
}
