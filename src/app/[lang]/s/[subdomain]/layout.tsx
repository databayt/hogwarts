// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"

import { getSchoolBySubdomain } from "@/lib/subdomain-actions"

export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subdomain: string; lang: string }>
}): Promise<Metadata> {
  const { subdomain } = await params
  const result = await getSchoolBySubdomain(subdomain)
  if (result.success && result.data?.logoUrl) {
    return {
      icons: {
        icon: result.data.logoUrl,
        shortcut: result.data.logoUrl,
        apple: result.data.logoUrl,
      },
    }
  }
  return {}
}

export default function SubdomainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
