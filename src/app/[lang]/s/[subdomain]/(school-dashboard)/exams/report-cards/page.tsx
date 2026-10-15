// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { redirect } from "next/navigation"

import type { Locale } from "@/components/internationalization/config"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

/**
 * Report cards live in the grades hub (/grades/reports). This older copy was
 * a second, diverging implementation reachable from no tab — keep old links
 * working by sending them to the one screen.
 */
export default async function ReportCardsRedirect({ params }: Props) {
  const { lang } = await params
  redirect(`/${lang}/grades/reports`)
}
