// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Suspense } from "react"
import { headers } from "next/headers"

import { getSubdomainFromHost } from "@/lib/root-domain"
import {
  DEMO_ROLE_KEYS,
  DEMO_SUBDOMAIN,
} from "@/components/auth/login/demo-accounts"
import { DemoLoginForm } from "@/components/auth/login/demo-form"
import { LoginForm } from "@/components/auth/login/form"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"

interface Props {
  params: Promise<{ lang: Locale }>
}

const LoginPage = async ({ params }: Props) => {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  // The showcase tenant swaps the credential fields for a role picker. Auth
  // routes aren't rewritten under /s/[subdomain] (see src/proxy.ts), so the
  // tenant comes from the request, not from params.
  const requestHeaders = await headers()
  const subdomain =
    requestHeaders.get("x-subdomain") ??
    getSubdomainFromHost(
      requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host")
    )

  if (subdomain === DEMO_SUBDOMAIN) {
    const demoRoles = dictionary?.auth?.demoRoles
    const roles = DEMO_ROLE_KEYS.map((key) => ({
      key,
      label: demoRoles?.[key] ?? key,
    }))

    return (
      <Suspense fallback={<div className="h-10" />}>
        <DemoLoginForm dictionary={dictionary} roles={roles} />
      </Suspense>
    )
  }

  return (
    <Suspense fallback={<div className="h-10" />}>
      <LoginForm dictionary={dictionary} />
    </Suspense>
  )
}

export default LoginPage
