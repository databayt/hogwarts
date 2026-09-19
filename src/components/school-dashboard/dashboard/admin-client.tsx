"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useDictionary } from "@/components/internationalization/use-dictionary"

import type { QuickLookData } from "./actions"
import { ChartSection } from "./chart-section"
import { DashboardHero } from "./hero-section"
import { InvoiceHistorySection } from "./invoice-history-section"
import { QuickActions } from "./quick-actions"
import { getQuickActionsByRole } from "./quick-actions-config"
import { QuickLookSection } from "./quick-look-section"
import { ResourceUsageSection } from "./resource-usage-section"
import { SectionHeading } from "./section-heading"
import type { WeatherData } from "./weather-actions"

// ============================================================================
// TYPES
// ============================================================================

export interface AdminDashboardClientProps {
  locale: string
  subdomain: string
  quickLookData?: QuickLookData
  weatherData?: WeatherData | null
}

// ============================================================================
// SECTION: Attendance Overview — REMOVED 2026-09-12
// ============================================================================
//
// An "Attendance Overview" section stood here: a radial grid of attendance by
// grade, a radial gauge of the school average, and a summary card. Every number
// in all three was written into this file — 96/94/92/88/91/85 per grade, 91%
// overall, 196 students, 178 present, "Grade 10 has 85% attendance" — so every
// school that opened this dashboard saw the same invented register, including
// schools whose real attendance was nothing like it.
//
// It is gone rather than wired because no query behind it exists yet. When one
// does, `dashboard.attendance` still holds every label the section used, and
// the charts it drew are plain Recharts radials.

// ============================================================================
// SECTION: Quick Actions (Using unified component)
// ============================================================================

function QuickActionsSection({
  locale,
  subdomain,
}: {
  locale: string
  subdomain: string
}) {
  const { dictionary } = useDictionary()
  const dict = dictionary?.school?.dashboard?.quickActionsSection
  const actions = getQuickActionsByRole("ADMIN", subdomain)

  return (
    // From `md` up only — below it the phone dashboard shows this same
    // section near the top instead (`phone-quick-actions.tsx`), where a
    // thumb reaches it; two copies at once would be the same four tiles twice.
    <section className="hidden md:block">
      <SectionHeading title={dict?.title || "Quick Actions"} />
      <QuickActions actions={actions} locale={locale} />
    </section>
  )
}

// ============================================================================
// MAIN CLIENT COMPONENT
// ============================================================================

export function AdminDashboardClient({
  locale,
  subdomain,
  quickLookData,
  weatherData,
}: AdminDashboardClientProps) {
  return (
    <div className="space-y-8">
      {/* ============ SHARED SECTIONS (the student dashboard's order) ========
          The hero opens the dashboard again from `md` up (`DashboardHero` —
          the role's flip card beside the school's weather); below `md` the
          phone block in `content.tsx` opens the page instead. The Quick Look
          row of announcements / events / notifications / messages stays
          hidden, and `admin.tsx` still does not fetch for it. */}
      <div className="space-y-6">
        <DashboardHero
          role="ADMIN"
          locale={locale}
          subdomain={subdomain}
          weatherData={weatherData}
        />
        {/* <QuickLookSection
          locale={locale}
          subdomain={subdomain}
          data={quickLookData}
        /> */}

        <QuickActionsSection locale={locale} subdomain={subdomain} />

        {/* Analytics, directly under the quick actions rather than below the
            two tables — the order the student dashboard settled on. */}
        <ChartSection role="ADMIN" />

        <ResourceUsageSection role="ADMIN" />

        <InvoiceHistorySection role="ADMIN" />
      </div>

      {/* The admin dashboard has no role-specific tail of its own: the
          attendance overview that stood here drew invented numbers and was
          removed (see above). What is left is the four shared sections, which
          is the shape the student dashboard ended at too. */}
    </div>
  )
}
