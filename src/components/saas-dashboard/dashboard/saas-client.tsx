"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { ChartSection } from "@/components/school-dashboard/dashboard/chart-section"
import { InvoiceHistorySection } from "@/components/school-dashboard/dashboard/invoice-history-section"
import { QuickActions } from "@/components/school-dashboard/dashboard/quick-actions"
import { ResourceUsageSection } from "@/components/school-dashboard/dashboard/resource-usage-section"
import { SectionHeading } from "@/components/school-dashboard/dashboard/section-heading"
import { Weather } from "@/components/school-dashboard/dashboard/weather"
import type { WeatherData } from "@/components/school-dashboard/dashboard/weather-actions"

import { MetricsCards } from "./metrics-cards"
import { RecentSales } from "./recent-sales"
import { saasQuickActions } from "./saas-quick-actions-config"
import { SaasQuickLook } from "./saas-quick-look"
import { SaasUpcoming } from "./saas-upcoming"

// ============================================================================
// TYPES
// ============================================================================

interface SaasDashboardClientProps {
  locale: Locale
  dictionary: Dictionary
  totals: {
    totalSchools: number
    activeSchools: number
    totalUsers: number
    totalStudents: number
  }
  weatherData?: WeatherData | null
}

// ============================================================================
// MAIN CLIENT COMPONENT
// ============================================================================

export function SaasDashboardClient({
  locale,
  dictionary,
  totals,
  weatherData,
}: SaasDashboardClientProps) {
  return (
    <div className="space-y-8">
      {/* Section 1: Hero — SaasUpcoming + Weather */}
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        <SaasUpcoming locale={locale} />
        <Weather
          current={weatherData?.current}
          forecast={weatherData?.forecast}
          location={weatherData?.location}
          className="lg:w-[280px] lg:self-end"
        />
      </div>

      {/* Section 2: Quick Look */}
      <section>
        <SectionHeading title="Quick Look" />
        <SaasQuickLook locale={locale} totals={totals} />
      </section>

      {/* Section 3: Quick Actions */}
      <section>
        <SectionHeading title="Quick Actions" />
        <QuickActions actions={saasQuickActions} locale={locale} />
      </section>

      {/* Section 4: Platform Stats */}
      <MetricsCards totals={totals} />

      {/* Section 5: Resource Usage */}
      <ResourceUsageSection role="DEVELOPER" />

      {/* Section 6: Invoice History */}
      <InvoiceHistorySection role="DEVELOPER" />

      {/* Section 7: Charts */}
      <ChartSection role="DEVELOPER" />

      {/* Section 8: Recent Sales */}
      <section>
        <SectionHeading title="Recent Sales" />
        <RecentSales />
      </section>
    </div>
  )
}
