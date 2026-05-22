// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

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
    // Clean client-facing path — middleware rewrites it to the internal
    // /s/[subdomain]/ route. Using the internal path here would double-rewrite.
    redirect(`/${lang}/login?callbackUrl=/${lang}/application`)
  }

  return <>{children}</>
}
