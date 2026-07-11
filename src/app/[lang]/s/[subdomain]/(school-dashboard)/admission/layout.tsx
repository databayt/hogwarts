// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { redirect } from "next/navigation"
import { auth } from "@/auth"

import type { Role } from "@/lib/rbac/types"
import { isRoleIn } from "@/lib/rbac/ui-permissions"
import { PageNav } from "@/components/atom/page-nav"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import {
  ADMISSION_VIEW_ROLES,
  getTabsForRole,
} from "@/components/school-dashboard/admission/permissions"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string; subdomain: string }>
}

export default async function AdmissionLayout({ children, params }: Props) {
  const [{ lang }, session] = await Promise.all([params, auth()])
  const dictionary = await getDictionary(lang as Locale)
  const d = dictionary?.school?.admission
  const role = (session?.user?.role ?? null) as Role | null

  // Applicant PII, merit ranks, and bank settings live under this segment —
  // hard-gate the whole tree to staff-side roles (the middleware role matrix
  // is the first line; this gate survives matrix drift).
  if (!isRoleIn(role, ADMISSION_VIEW_ROLES)) {
    redirect(`/${lang}/unauthorized`)
  }

  const admissionPages = getTabsForRole(
    role,
    lang,
    d?.nav as Record<string, string> | undefined
  )

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={d?.title || "Admission"} />
      <PageNav pages={admissionPages} />
      {children}
    </div>
  )
}
