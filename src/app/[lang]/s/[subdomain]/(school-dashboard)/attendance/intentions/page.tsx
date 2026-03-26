// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"

import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import IntentionsContent from "@/components/school-dashboard/attendance/intentions/content"

export const metadata = { title: "Dashboard: Absence Intentions" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

const STAFF_ROLES = ["ADMIN", "TEACHER", "STAFF", "DEVELOPER"]

export default async function Page({ params }: Props) {
  const [{ lang }, session, { schoolId }] = await Promise.all([
    params,
    auth(),
    getTenantContext(),
  ])
  const dictionary = await getDictionary(lang)

  if (!STAFF_ROLES.includes(session?.user?.role ?? "")) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <h2>Access Denied</h2>
        <p className="text-muted-foreground">
          You do not have permission to review absence intentions.
        </p>
      </div>
    )
  }

  return <IntentionsContent locale={lang} schoolId={schoolId ?? ""} />
}
