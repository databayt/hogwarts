// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Metadata } from "next"

import { ADMIN_ROLES, isRoleIn } from "@/lib/rbac/ui-permissions"
import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { AdmissionAccessDenied } from "@/components/school-dashboard/admission/access-denied"
import SettingsContent from "@/components/school-dashboard/admission/settings-content"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return {
    title: dictionary.school.admission?.settings?.title || "Admission Settings",
    description:
      dictionary.school.admission?.settings?.description ||
      "Configure admission settings and preferences",
  }
}

export default async function SettingsPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  // Settings is an admin-only tab (getTabsForRole) and holds bank details —
  // close the direct-URL gap for STAFF/ACCOUNTANT (the gated settings
  // actions stay the hard enforcement; this is honest UI). Gated in the
  // PAGE because SettingsContent is a client component.
  const { role } = await getTenantContext()
  if (!isRoleIn(role, ADMIN_ROLES)) {
    return <AdmissionAccessDenied dictionary={dictionary.school} />
  }

  return <SettingsContent dictionary={dictionary.school} lang={lang} />
}
