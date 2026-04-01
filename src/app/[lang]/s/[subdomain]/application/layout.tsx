// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { redirect } from "next/navigation"
import { auth } from "@/auth"

import type { Locale } from "@/components/internationalization/config"

interface ApplyLayoutProps {
  children: React.ReactNode
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function SchoolApplyLayout({
  children,
  params,
}: ApplyLayoutProps) {
  const { lang, subdomain } = await params
  const session = await auth()

  // Require authentication — applicants must create an account first
  if (!session?.user) {
    redirect(
      `/${lang}/login?callbackUrl=/${lang}/s/${subdomain}/application`
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex w-full flex-1 items-center px-4 sm:px-6 md:px-12 lg:px-20">
        {children}
      </main>
    </div>
  )
}
