// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { redirect } from "next/navigation"

import type { Locale } from "@/components/internationalization/config"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

/** Report-card templates live in grades settings, under the grade scale. */
export default async function GradeTemplatesRedirect({ params }: Props) {
  const { lang } = await params
  redirect(`/${lang}/grades/settings`)
}
