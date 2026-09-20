// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"

import { tenantHostMetadata } from "@/lib/tenant-metadata"
import { ReportIssue } from "@/components/report-issue"

// Auth pages use cookies/headers - always dynamic
export const dynamic = "force-dynamic"

// Signing in at a school's own host should say the school's name, not the
// platform's. Auth routes are NOT rewritten under /s/[subdomain] (see
// src/proxy.ts), so the tenant layout's metadata never reaches them and the
// tab read "بالقلم - نظام إدارة المدارس" on every tenant.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  return tenantHostMetadata(lang)
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
