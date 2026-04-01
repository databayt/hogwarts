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
  const { lang, subdomain } = await params
  const session = await auth()

  if (!session?.user) {
    redirect(`/${lang}/login?callbackUrl=/${lang}/s/${subdomain}/application`)
  }

  return <>{children}</>
}
