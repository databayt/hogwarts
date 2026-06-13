// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// @deprecated 2026-06-12 — Application-fee payment leg retired per product
// decision: submitting a school application is ALWAYS FREE.
// This route now redirects any visitor to the application overview so that
// bookmarked / emailed payment links continue to work gracefully.

import { redirect } from "next/navigation"

import { type Locale } from "@/components/internationalization/config"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
  searchParams: Promise<Record<string, string | undefined>>
}

export default async function PaymentPage({ params }: Props) {
  const { lang } = await params
  // Redirect to the clean application overview.
  // Client-facing URLs never include /s/[subdomain] (subdomain URL rule).
  redirect(`/${lang}/application`)
}
