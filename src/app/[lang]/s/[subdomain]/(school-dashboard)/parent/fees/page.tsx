// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { redirect } from "next/navigation"

import type { Locale } from "@/components/internationalization/config"

// Reuse the existing /my-fees surface (handles STUDENT + GUARDIAN). Phase 2
// or beyond may inline a parent-portal-styled wrapper if the shared route
// feels off-brand for the parent surface.
export default async function ParentFeesPage({
  params,
}: {
  params: Promise<{ lang: Locale; subdomain: string }>
}) {
  const { lang } = await params
  redirect(`/${lang}/my-fees`)
}
