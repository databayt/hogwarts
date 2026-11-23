"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type { QuickLookData } from "./actions"
import { InvoiceHistorySection } from "./invoice-history-section"
import { QuickLookSection } from "./quick-look-section"
import { ResourceUsageSection } from "./resource-usage-section"
import type { TeacherDashboardData } from "./types"
import type { WeatherData } from "./weather-actions"

// ============================================================================
// TYPES
// ============================================================================

export interface TeacherDashboardClientProps {
  locale: string
  subdomain: string
  data: TeacherDashboardData
  quickLookData?: QuickLookData
  weatherData?: WeatherData | null
}

// ============================================================================
// MAIN CLIENT COMPONENT
// ============================================================================

export function TeacherDashboardClient({
  locale,
  subdomain,
  data,
  quickLookData,
  weatherData,
}: TeacherDashboardClientProps) {
  return (
    <div className="space-y-8">
      {/* ============ TOP HERO SECTION (Unified Order) ============ */}
      <div className="space-y-6">
        {/* The day's classes are not here: `today-timetable.tsx` draws them
            once, above every section, at every width (content.tsx). The
            Today card and the classes-today tile that stood below were its
            desktop stand-ins and went on 2026-11-11. */}
        {/* Section 2, the Quick Look row of announcements / events /
            notifications / messages, is still hidden. Restore by
            un-commenting here and passing `quickLookData` from
            `teacher.tsx`. */}
        {/* <QuickLookSection
          locale={locale}
          subdomain={subdomain}
          data={quickLookData}
        /> */}

        {/* Section 4, the Teaching Analytics charts, is hidden: its numbers
            were placeholders (`chart-section.tsx` defaults, not read from the
            teacher's own lessons or grading), so every teacher saw the same
            fake «الدروس / المصحح» totals. Restore `<ChartSection
            role="TEACHER" />` (import from `./lazy-charts`) once the
            dashboard actions supply real per-teacher counts. The mobile
            payload never carried this card, so the app is unaffected. */}

        {/* Section 5: Resource Usage */}
        <ResourceUsageSection role="TEACHER" />

        {/* Section 6: Invoice History (Expense Claims) */}
        <InvoiceHistorySection role="TEACHER" />
      </div>
    </div>
  )
}
