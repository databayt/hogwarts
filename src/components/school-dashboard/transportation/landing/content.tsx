// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
// Server component: pure prop composition with no client hooks/handlers, so it
// stays out of the client bundle and only its interactive leaves hydrate.

import type { Locale } from "@/components/internationalization/config"

import { AudienceSection } from "./audience-section"
import { CapabilitiesSection } from "./capabilities-section"
import { CtaSection } from "./cta-section"
import { FeaturesSection } from "./features-section"
import { HeroSection } from "./hero-section"
import { HowItWorksSection } from "./how-it-works-section"
import { StatsSection } from "./stats-section"
import type { LandingStats, TransportationDictionary } from "./types"

interface Props {
  dictionary: TransportationDictionary
  lang: Locale
  role: string
  /**
   * Real fleet counts, or null when the viewer can't read them. Resolved in the
   * page, because `getOverviewStats()` is permission-gated and would blank the
   * whole landing for a teacher or an accountant.
   */
  stats: LandingStats | null
}

// Mirrors each destination page's own ALLOWED_ROLES exactly. A CTA pointing at
// a page the viewer can't open would only redirect them to /dashboard, which
// reads as a broken link — so every href on this page is resolved through these.
const OPS_ROLES = ["DEVELOPER", "ADMIN", "STAFF"]
const TRIP_ROLES = [...OPS_ROLES, "TEACHER"]
const FEE_ROLES = ["DEVELOPER", "ADMIN", "ACCOUNTANT"]
const ME_ROLES = ["STUDENT", "GUARDIAN", "DEVELOPER", "ADMIN"]
const SETTINGS_ROLES = ["DEVELOPER", "ADMIN"]

/**
 * The transportation landing page.
 *
 * Mirrors the lumos home structure — hero, feature grid, a coloured band, and
 * a closing CTA — but this block sits behind a per-page role gate, so the CTAs
 * are resolved against what the viewer can actually open rather than hardcoded.
 */
export function TransportationLandingContent({
  dictionary,
  lang,
  role,
  stats,
}: Props) {
  const base = `/${lang}/transportation`

  const isOps = OPS_ROLES.includes(role)
  const canOpen = {
    dashboard: isOps ? `${base}/dashboard` : null,
    trips: TRIP_ROLES.includes(role) ? `${base}/trips` : null,
    fees: FEE_ROLES.includes(role) ? `${base}/fees` : null,
    me: ME_ROLES.includes(role) ? `${base}/me` : null,
    settings: SETTINGS_ROLES.includes(role) ? `${base}/settings` : null,
  }

  // Preference order for the hero/CTA buttons: the most useful surface this
  // role has, then the next one down. Both fall to null for a role with no
  // transportation surface at all, and the buttons disappear rather than 404.
  const [primaryHref = null, secondaryHref = null] = [
    canOpen.dashboard,
    canOpen.trips,
    canOpen.fees,
    canOpen.me,
  ].filter((href): href is string => href !== null)

  return (
    <div className="flex flex-col gap-16 p-6">
      <HeroSection
        dictionary={dictionary}
        lang={lang}
        primaryHref={primaryHref}
        secondaryHref={secondaryHref}
      />

      {stats ? (
        <StatsSection dictionary={dictionary} lang={lang} stats={stats} />
      ) : null}

      <FeaturesSection dictionary={dictionary} lang={lang} />

      <CapabilitiesSection dictionary={dictionary} lang={lang} />

      <AudienceSection
        dictionary={dictionary}
        lang={lang}
        hrefs={{
          admins: canOpen.dashboard,
          families: canOpen.me,
          drivers: canOpen.trips,
        }}
      />

      <HowItWorksSection
        dictionary={dictionary}
        lang={lang}
        canOpenSteps={isOps}
      />

      <CtaSection
        dictionary={dictionary}
        lang={lang}
        primaryHref={primaryHref}
        secondaryHref={canOpen.settings}
      />
    </div>
  )
}
