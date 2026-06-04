// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { redirect } from "next/navigation"
import { auth } from "@/auth"

import type { Locale } from "@/components/internationalization/config"
import { getFinanceDictionary } from "@/components/internationalization/dictionaries"
import { getTemporaryAccessToken } from "@/components/school-dashboard/finance/receipt/schematic/get-temporary-access-token"
import SchematicEmbed from "@/components/school-dashboard/finance/receipt/schematic/schematic-embed"

export default async function ManagePlanPage({
  params,
}: {
  params: Promise<{ lang: Locale; subdomain: string }>
}) {
  const { lang } = await params
  const dictionary = await getFinanceDictionary(lang)
  const t = dictionary.finance.managePlan

  // 1. Authenticate
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/signin")
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
