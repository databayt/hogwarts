// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { type Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"
import {
  getComplianceDictionary,
  getDictionary,
} from "@/components/internationalization/dictionaries"
import { ComplianceContent } from "@/components/school-dashboard/compliance/content"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>
}): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return {
    title: dictionary?.compliance?.title || "Compliance",
  }
}

const ALLOWED_ROLES = ["DEVELOPER", "ADMIN", "STAFF"]

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const [{ lang }, session, tenantContext] = await Promise.all([
    params,
    auth(),
    getTenantContext().catch(() => ({ schoolId: null })),
  ])

  const role = session?.user?.role ?? ""
  if (!ALLOWED_ROLES.includes(role)) {
    redirect(`/${lang}/dashboard`)
  }

  const schoolId = tenantContext.schoolId
  if (!schoolId) {
    redirect(`/${lang}/dashboard`)
  }

  const school = await db.school.findUnique({
    where: { id: schoolId },
    select: { country: true },
  })

  // Regulator gate — only UAE schools see the compliance page. DEVELOPER
  // role bypasses for cross-tenant ops.
  const isDeveloper = role === "DEVELOPER"
  const isRegulatedCountry = school?.country === "AE"
  if (!isDeveloper && !isRegulatedCountry) {
    redirect(`/${lang}/dashboard`)
  }

  // Pre-load dict for the page header on first paint; ComplianceContent re-fetches it too.
  await getComplianceDictionary(lang)

  return (
    <ComplianceContent
      locale={lang}
      schoolId={schoolId}
      schoolCountry={school?.country ?? null}
    />
  )
}
