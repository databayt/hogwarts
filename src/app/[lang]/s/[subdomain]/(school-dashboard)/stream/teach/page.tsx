// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
// DEPRECATED: Redirects to unified dashboard

import { redirect } from "next/navigation"

import type { Locale } from "@/components/internationalization/config"

interface Props {
  params: Promise<{ lang: Locale }>
}

export default async function TeachPage({ params }: Props) {
  const { lang } = await params
  redirect(`/${lang}/stream/dashboard`)
}
