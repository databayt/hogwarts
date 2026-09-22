// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { type Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/auth"

import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { getLiveLinkCoverage } from "@/components/school-dashboard/live/actions/settings"
import { LiveLandingContent } from "@/components/school-dashboard/live/landing/content"
import { loadLiveLanding } from "@/components/school-dashboard/live/landing/load"
import type {
  LandingPolicy,
  LandingReadiness,
  LandingSession,
} from "@/components/school-dashboard/live/landing/types"
import {
  canOpenLanding,
  resolveLandingViewer,
} from "@/components/school-dashboard/live/landing/viewer"
import { getLiveKitReadiness } from "@/components/school-dashboard/live/livekit/client"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>
}): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const d = dictionary?.school?.liveClasses
  // The block name, not the page's state — a tab title and a bookmark want a
  // stable label, and the state already has the <h1>.
  return {
    title: d?.title,
    description: d?.description,
  }
}

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

/**
 * The /live landing page.
 *
 * Students are deliberately NOT redirected past it, unlike /lumos: their strip
 * is section-scoped and sits at the top, so the page answers "can I join my
 * class" for them rather than being marketing they have to click through.
 */
export default async function Page({ params }: Props) {
  const [{ lang, subdomain }, session] = await Promise.all([params, auth()])
  const role = session?.user?.role ?? ""
  if (!canOpenLanding(role)) {
    redirect(`/${lang}/dashboard`)
  }

  const dictionary = await getDictionary(lang)
  const d = dictionary.school.liveClasses
  const settings = dictionary.liveClasses?.settings
  const { schoolId } = await getTenantContext()

  let viewer = resolveLandingViewer(role)
  let policy: LandingPolicy = {
    deliveryMode: "physical",
    isOnline: false,
    windowActive: false,
    provider: "external",
    degraded: false,
  }
  let live: LandingSession[] = []
  let upcoming: LandingSession[] = []
  let catchUp: LandingSession[] = []
  let recordings: LandingSession[] = []
  let readiness: LandingReadiness | null = null

  if (schoolId) {
    // Shared with `/api/mobile/live/landing`, so a phone and a browser signed
    // in as the same reader see the same classes, phases and rankings.
    ;({ viewer, policy, live, upcoming, catchUp, recordings } =
      await loadLiveLanding({
        schoolId,
        userId: session?.user?.id,
        role,
        lang,
        isDemo: subdomain === "demo",
      }))

    // Readiness reads separately, so a settings failure cannot blank the strip
    // above it.
    if (viewer.canConfigure) {
      try {
        const kit = getLiveKitReadiness()
        const coverage = await getLiveLinkCoverage()
        // This action RETURNS its failure rather than throwing, so the
        // discriminant is the only thing that catches a denied read.
        const ok = coverage && "success" in coverage && coverage.success
        readiness = {
          livekitReady: kit.configured,
          recordingReady: kit.recordingConfigured,
          hasFallback: ok ? coverage.data.hasFallback : false,
          coverage: ok
            ? {
                total: coverage.data.total,
                covered: coverage.data.covered,
                gapCount: coverage.data.gapCount,
              }
            : null,
        }
      } catch (error) {
        console.error("[LiveLanding] Could not load readiness:", error)
      }
    }
  }

  return (
    <LiveLandingContent
      dictionary={d}
      settings={settings}
      lang={lang}
      viewer={viewer}
      policy={policy}
      readiness={readiness}
      live={live}
      upcoming={upcoming}
      catchUp={catchUp}
      recordings={recordings}
    />
  )
}
