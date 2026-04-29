// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"

import type { Role } from "@/lib/rbac/types"
import { PageNav } from "@/components/atom/page-nav"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { getTabsForRole } from "@/components/school-dashboard/admission/permissions"
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
