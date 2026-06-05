// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { redirect } from "next/navigation"

import { getPolicyContext } from "@/lib/rbac/context"
import type { Locale } from "@/components/internationalization/config"

/**
 * Server-side gate for the parent portal. Only a GUARDIAN (or a DEVELOPER, for
 * platform inspection) may reach these surfaces. The data layer already denies
 * others (getGuardianScope in parent-portal/actions.ts), but gating here stops
 * non-guardians from rendering parent UI shells / structure. The upstream
 * (school-dashboard) layout has already enforced authentication + membership.
 */
export default async function ParentPortalLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ lang: Locale; subdomain: string }>
}) {
  const { lang } = await params
  const ctx = await getPolicyContext()
  if (ctx.role !== "GUARDIAN" && ctx.role !== "DEVELOPER") {
    redirect(`/${lang}/dashboard`)
  }
  return <>{children}</>
}
