// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { FinanceAccessDenied } from "@/components/school-dashboard/finance/access-denied"
import { resolveFinanceAccess } from "@/components/school-dashboard/finance/guard"
import { PermissionManagementContent } from "@/components/school-dashboard/finance/permissions/content"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return { title: dictionary?.finance?.permissions?.title }
}

export default async function FinancePermissionsPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  // The grant console is for whoever can approve grants (ADMIN/ACCOUNTANT/
  // DEVELOPER short-circuit every module check; a granular grantee does not).
  // Module choice is a proxy — grant/revoke actions re-check per module.
  const { can } = await resolveFinanceAccess("accounts", ["approve"])
  if (!can.approve) {
    return <FinanceAccessDenied dictionary={dictionary} module="accounts" />
  }

  return <PermissionManagementContent />
}
