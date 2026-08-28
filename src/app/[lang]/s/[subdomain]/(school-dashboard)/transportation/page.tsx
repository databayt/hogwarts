// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { type Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/auth"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { getOverviewStats } from "@/components/school-dashboard/transportation/actions/overview"
import { TransportationLandingContent } from "@/components/school-dashboard/transportation/landing/content"
import type { LandingStats } from "@/components/school-dashboard/transportation/landing/types"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>
}): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return {
    title: dictionary?.transportation?.title || "Transportation",
    description: dictionary?.transportation?.description || undefined,
  }
}

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

/** Roles `getOverviewStats()` will actually answer for — see authorization.ts. */
const STATS_ROLES = ["DEVELOPER", "ADMIN", "STAFF"]

/**
 * The transportation landing page.
 *
 * Same split lumos uses: this route is the section's front door, and the fleet
 * board it used to hold now lives at /transportation/dashboard under the (app)
 * route group with the rest of the ops surfaces.
 */
export default async function Page({ params }: Props) {
  const [{ lang }, session] = await Promise.all([params, auth()])
  const role = session?.user?.role ?? ""

  // Students and guardians never want the section overview — they want their
  // own route. Lumos does the same thing, sending students straight to courses.
  if (role === "STUDENT" || role === "GUARDIAN") {
    redirect(`/${lang}/transportation/me`)
  }

  const dictionary = await getDictionary(lang)

  // Only ask for counts the viewer is allowed to read. `getOverviewStats()`
  // returns a permission failure for anyone else, and the strip hides itself.
  let stats: LandingStats | null = null
  if (STATS_ROLES.includes(role)) {
    const result = await getOverviewStats()
    if (result.success) stats = result.data
  }

  return (
    <TransportationLandingContent
      dictionary={dictionary.transportation}
      lang={lang}
      role={role}
      stats={stats}
    />
  )
}
