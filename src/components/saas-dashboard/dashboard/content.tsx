// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { db } from "@/lib/db"
import { type Locale } from "@/components/internationalization/config"
import { type Dictionary } from "@/components/internationalization/dictionaries"
import { getWeatherData } from "@/components/school-dashboard/dashboard/weather-actions"

import type { RecentSale } from "./recent-sales"
import { SaasDashboardClient } from "./saas-client"

interface DashboardContentProps {
  dictionary: Dictionary
  lang: Locale
}

function formatUsd(cents: number): string {
  return `+$${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export async function DashboardContent({
  dictionary,
  lang,
}: DashboardContentProps) {
  const [
    totalSchools,
    activeSchools,
    totalUsers,
    totalStudents,
    weatherData,
    recentPaidInvoices,
    pendingDomains,
    pendingReceipts,
    trialCount,
  ] = await Promise.all([
    db.school.count(),
    db.school.count({ where: { isActive: true } }),
    db.user.count(),
    db.student.count(),
    getWeatherData("metric", lang),
    // Real recent platform payments (replaces the fabricated persona list).
    db.invoice.findMany({
      where: { status: "paid" },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        amountPaid: true,
        school: { select: { name: true, domain: true } },
      },
    }),
    db.domainRequest.count({ where: { status: "pending" } }),
    db.receipt.count({ where: { status: "pending" } }),
    // planType casing is inconsistent across creation paths — match both.
    db.school.count({ where: { planType: { in: ["trial", "TRIAL"] } } }),
  ])

  const recentSales: RecentSale[] = recentPaidInvoices.map((inv) => ({
    name: inv.school?.name ?? "—",
    email: inv.school?.domain ?? "",
    amount: formatUsd(inv.amountPaid),
  }))

  return (
    <SaasDashboardClient
      locale={lang}
      dictionary={dictionary}
      totals={{ totalSchools, activeSchools, totalUsers, totalStudents }}
      weatherData={weatherData}
      recentSales={recentSales}
      upcoming={{
        trialExpirations: trialCount,
        pendingDomains,
        pendingReceipts,
      }}
    />
  )
}
