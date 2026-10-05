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
import { AuthFormSkeleton } from "@/components/auth/form-skeleton"
import { getAuthDictionary } from "@/components/internationalization/dictionaries"
import { ForgetSavedPages } from "@/components/offline/forget-saved-pages"

interface Props {
  params: Promise<{ lang: Locale }>
  searchParams: Promise<{ callbackUrl?: string }>
}

const LoginPage = async ({ params, searchParams }: Props) => {
  const [{ lang }, { callbackUrl }] = await Promise.all([params, searchParams])
  const dictionary = await getAuthDictionary(lang)

  // The showcase tenant swaps the credential fields for a role picker. Auth
  // routes aren't rewritten under /s/[subdomain] (see src/proxy.ts), so the
  // tenant comes from the request, not from params.
  const requestHeaders = await headers()
  const subdomain =
    requestHeaders.get("x-subdomain") ??
    getSubdomainFromHost(
      requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host")
    )

  // Except for an applicant. The role picker is for visitors touring the
  // product; someone the application gate sent here is the public applying
  // for real, and needs their own account -- sign in or join -- to keep it.
  const isApplying = /^\/[a-z]{2}\/application(\/|\?|$)/.test(
    callbackUrl ?? ""
  )

  if (subdomain === DEMO_SUBDOMAIN && !isApplying) {
    const demoRoles = dictionary?.auth?.demoRoles
    const roles = DEMO_ROLE_KEYS.map((key) => ({
      key,
      label: demoRoles?.[key] ?? key,
    }))

    return (
      <Suspense
        fallback={
          <AuthFormSkeleton
            fields={0}
            buttons={roles.length}
            buttonClassName="h-12 rounded-lg md:h-11"
            label={dictionary?.common?.loading}
          />
        }
      >
        <ForgetSavedPages />
        <DemoLoginForm dictionary={dictionary} roles={roles} />
      </Suspense>
    )
  }

  return (
    <Suspense fallback={<AuthFormSkeleton label={dictionary?.common?.loading} />}>
      <ForgetSavedPages />
      <LoginForm dictionary={dictionary} />
    </Suspense>
  )
}

export default LoginPage
