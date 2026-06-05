// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { redirect } from "next/navigation"
import { auth } from "@/auth"

import { type Locale } from "@/components/internationalization/config"
import { getComplianceDictionary } from "@/components/internationalization/dictionaries"
import { SharedGroupsContent } from "@/components/saas-dashboard/compliance/shared-groups-content"

export const metadata = {
  title: "Compliance — Shared Credential Groups",
  description: "DEVELOPER-only: manage cross-tenant regulator credentials",
}

interface Props {
  params: Promise<{ lang: Locale }>
}

export default async function Page({ params }: Props) {
  const [{ lang }, session] = await Promise.all([params, auth()])

  if (session?.user?.role !== "DEVELOPER") {
    redirect(`/${lang}/dashboard`)
  }

  const dict = await getComplianceDictionary(lang)
  return <SharedGroupsContent locale={lang} dict={dict.compliance} />
}
