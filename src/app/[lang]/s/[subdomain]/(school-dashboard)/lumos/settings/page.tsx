// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { redirect } from "next/navigation"

import type { Locale } from "@/components/internationalization/config"
import { LUMOS_SURFACES } from "@/components/stream/permissions"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

/**
 * Legacy entry point. The settings surfaces are top-level routes now
 * (/lumos/enrollments, …) and the old "Overview" tab was the same component as
 * /lumos/dashboard, so this only forwards. Kept because `Notification.url`
 * rows written before the move still carry `/lumos/settings?tab=videos`.
 */
export default async function LegacySettingsPage({
  params,
  searchParams,
}: Props) {
  const [{ lang }, sp] = await Promise.all([params, searchParams])
  const tab = typeof sp.tab === "string" ? sp.tab : null

  redirect(
    tab && LUMOS_SURFACES.includes(tab)
      ? `/${lang}/lumos/${tab}`
      : `/${lang}/lumos/dashboard`
  )
}
