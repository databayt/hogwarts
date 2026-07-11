// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"
import { redirect } from "next/navigation"

import type { Locale } from "@/components/internationalization/config"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
  searchParams: Promise<{ token?: string }>
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>
}): Promise<Metadata> {
  const { lang } = await params
  return {
    title: lang === "ar" ? "التقديم" : "Application | Apply",
  }
}

// Redirect to the first step (attachments), preserving a resume session
// token (?token=) so ApplySessionProvider can rehydrate the draft instead of
// silently starting a blank application.
export default async function ApplicationFormPage({
  params,
  searchParams,
}: Props) {
  const { lang, id } = await params
  const { token } = await searchParams
  const query = token ? `?token=${encodeURIComponent(token)}` : ""
  redirect(`/${lang}/application/${id}/attachments${query}`)
}
