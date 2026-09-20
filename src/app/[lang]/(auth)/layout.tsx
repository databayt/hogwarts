// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"
import { headers } from "next/headers"

import { getSubdomainFromHost } from "@/lib/root-domain"
import { getSchoolBySubdomain } from "@/lib/subdomain-actions"
import { ReportIssue } from "@/components/report-issue"
import { resolveSchoolDisplayName } from "@/components/template/site-header/display-name"

// Auth pages use cookies/headers - always dynamic
export const dynamic = "force-dynamic"

// Signing in at a school's own host should say the school's name, not the
// platform's. Auth routes are NOT rewritten under /s/[subdomain] (see
// src/proxy.ts), so the tenant layout's metadata never reaches them and the
// tab read "بالقلم - نظام إدارة المدارس" on every tenant. The subdomain comes
// from the request, the same way the login page already derives it; the school
// lookup is memoised for 60s, and this group is force-dynamic regardless.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  const requestHeaders = await headers()
  const subdomain =
    requestHeaders.get("x-subdomain") ??
    getSubdomainFromHost(
      requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host")
    )
  if (!subdomain) return {}

  const result = await getSchoolBySubdomain(subdomain)
  if (!result.success || !result.data) return {}

  const displayName = await resolveSchoolDisplayName(result.data, lang)

  return {
    title: displayName,
    // Shallow merge: the root layout's `capable`/`statusBarStyle` have to be
    // repeated or an installed app loses standalone mode.
    appleWebApp: {
      capable: true,
      title: displayName,
      statusBarStyle: "default",
    },
  }
}

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center px-6">
      {children}
      <div className="text-muted-foreground absolute start-6 bottom-4 text-sm">
        <ReportIssue />
      </div>
    </div>
  )
}

export default AuthLayout
