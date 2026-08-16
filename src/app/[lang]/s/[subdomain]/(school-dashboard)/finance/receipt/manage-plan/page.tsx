// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { redirect } from "next/navigation"
import { auth } from "@/auth"

import { getTenantContext } from "@/lib/tenant-context"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { FinanceAccessDenied } from "@/components/school-dashboard/finance/access-denied"
import { getTemporaryAccessToken } from "@/components/school-dashboard/finance/receipt/schematic/get-temporary-access-token"
import SchematicEmbed from "@/components/school-dashboard/finance/receipt/schematic/schematic-embed"

/**
 * The Schematic portal is scoped to the SCHOOL, so only a school administrator
 * may open it. Mirrors the role gate inside getTemporaryAccessToken — the page
 * check exists so a denied caller sees the block's standard deny UI instead of
 * a misleading "unable to load" error.
 */
const PLAN_MANAGER_ROLES = new Set(["ADMIN", "DEVELOPER"])

export default async function ManagePlanPage({
  params,
}: {
  params: Promise<{ lang: Locale; subdomain: string }>
}) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const t = dictionary.finance.managePlan

  // 1. Authenticate + authorize
  const [session, { role }] = await Promise.all([auth(), getTenantContext()])

  if (!session?.user) {
    redirect(`/${lang}/login`)
  }

  if (!role || !PLAN_MANAGER_ROLES.has(role)) {
    return <FinanceAccessDenied dictionary={dictionary} module="receipt" />
  }

  // 2. Get Schematic access token
  const accessToken = await getTemporaryAccessToken()

  if (!accessToken) {
    return (
      <div className="py-16 text-center">
        <h1 className="mb-4 text-2xl font-bold">{t.loadErrorTitle}</h1>
        <p className="text-muted-foreground">{t.loadErrorDescription}</p>
      </div>
    )
  }

  // 3. Get component ID from environment
  const componentId =
    process.env.NEXT_PUBLIC_SCHEMATIC_CUSTOMER_PORTAL_COMPONENT_ID

  if (!componentId) {
    console.error("NEXT_PUBLIC_SCHEMATIC_CUSTOMER_PORTAL_COMPONENT_ID not set")
    return (
      <div className="py-16 text-center">
        <h1 className="mb-4 text-2xl font-bold">{t.configErrorTitle}</h1>
        <p className="text-muted-foreground">{t.configErrorDescription}</p>
      </div>
    )
  }

  return (
    <div className="py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t.title}</h1>
        <p className="text-muted-foreground mt-2">{t.description}</p>
      </div>

      <div className="bg-card rounded-lg border">
        <SchematicEmbed accessToken={accessToken} componentId={componentId} />
      </div>
    </div>
  )
}
