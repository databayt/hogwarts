// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Metadata } from "next"
import { redirect } from "next/navigation"
import { SearchParams } from "nuqs/server"

import { ADMIN_ROLES, isRoleIn } from "@/lib/rbac/ui-permissions"
import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import CampaignsContent from "@/components/school-dashboard/admission/campaigns-content"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
  searchParams: Promise<SearchParams>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return {
    title:
      dictionary.school.admission?.campaigns?.title || "Admission Campaigns",
    description:
      dictionary.school.admission?.description || "Manage admission campaigns",
  }
}

export default async function AdmissionPage({ params, searchParams }: Props) {
  const { lang } = await params

  // The index renders Campaigns, which is admin-only. STAFF and ACCOUNTANT
  // arrive here from the sidebar's Admission entry, so land them on the
  // first tab they can use instead of an inline denial.
  const { role } = await getTenantContext()
  if (!isRoleIn(role, ADMIN_ROLES)) {
    redirect(`/${lang}/admission/applications`)
  }

  const dictionary = await getDictionary(lang)

  return (
    <CampaignsContent
      searchParams={searchParams}
      dictionary={dictionary.school}
      lang={lang}
    />
  )
}
