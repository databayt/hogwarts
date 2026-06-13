// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/auth"

import type { Locale } from "@/components/internationalization/config"

interface AuthLayoutProps {
  children: React.ReactNode
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function ApplicationAuthLayout({
  children,
  params,
}: AuthLayoutProps) {
  const { lang } = await params
  const session = await auth()

  if (!session?.user) {
    // Preserve the full original path + query (including ?token=) so the
    // parent lands back on the exact offer page after login, not a generic
    // /application overview that would discard the token.
    // We read the actual requested URL from the x-invoke-path header that
    // Next.js sets during rewriting, falling back to the referer/origin, and
    // finally to a safe default. The callbackUrl must be a clean client-facing
    // /${lang}/... path — never /s/${subdomain}/ which is internal only.
    const headersList = await headers()

    // Next.js sets x-invoke-path to the file-system route the request was
    // matched against. Strip the /s/[subdomain] prefix to get the clean path.
    const invokePath = headersList.get("x-invoke-path") ?? ""
    const cleanPath = invokePath.replace(/^\/[a-z]{2}\/s\/[^/]+/, `/${lang}`)

    // The query string (e.g. ?token=xxx) is on x-invoke-query
    const invokeQuery = headersList.get("x-invoke-query") ?? ""
    const fullPath =
      cleanPath && cleanPath !== `/${lang}`
        ? `${cleanPath}${invokeQuery ? `?${invokeQuery}` : ""}`
        : `/${lang}/application`

    // Clean client-facing path — middleware rewrites it to the internal
    // /s/[subdomain]/ route. Using the internal path here would double-rewrite.
    redirect(`/${lang}/login?callbackUrl=${encodeURIComponent(fullPath)}`)
  }

  return <>{children}</>
}
