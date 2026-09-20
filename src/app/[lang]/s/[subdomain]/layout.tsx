// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"

import { getSchoolBySubdomain } from "@/lib/subdomain-actions"
import { resolveSchoolDisplayName } from "@/components/template/site-header/display-name"

export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subdomain: string; lang: string }>
}): Promise<Metadata> {
  const { subdomain, lang } = await params
  const result = await getSchoolBySubdomain(subdomain)
  if (!result.success || !result.data) return {}

  const school = result.data
  // Everything under a tenant host belongs to the school, not to the platform.
  // Only the school-marketing pages set a title of their own, so the dashboard
  // and every other tenant route fell through to `[lang]/layout.tsx` and read
  // "بالقلم - نظام إدارة المدارس" in the tab. Same resolver the nav uses, so
  // /en gets `nameEn` (or an on-demand translation) rather than the Arabic name.
  const displayName = await resolveSchoolDisplayName(school, lang)

  const metadata: Metadata = {
    title: displayName,
    // `appleWebApp` merges shallowly, so the root layout's `capable` and
    // `statusBarStyle` have to be repeated here or the installed app loses
    // standalone mode. Without this the iOS home-screen icon for every
    // tenant was labelled "balqalam".
    appleWebApp: {
      capable: true,
      title: displayName,
      statusBarStyle: "default",
    },
  }

  // `openGraph` is deliberately NOT set here: a child segment replaces the
  // parent's object wholesale, which would drop `/og.png` from every share
  // card. The marketing pages — the ones people actually share — already set
  // their own openGraph with the school as `siteName`.

  if (school.logoUrl) {
    metadata.icons = {
      icon: school.logoUrl,
      shortcut: school.logoUrl,
      apple: school.logoUrl,
    }
  }

  return metadata
}

export default function SubdomainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
