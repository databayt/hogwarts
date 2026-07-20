// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { AnimatedCounter } from "@/components/school-dashboard/finance/banking/shared/animated-counter"

import type { DashboardHeaderProps } from "../types"

interface StatCardProps {
  label: string
  value: string | number | React.ReactNode
  className?: string
}

function StatCard({ label, value, className }: StatCardProps) {
  return (
    <div className="bg-muted/40 rounded-xl p-5">
      <p className="text-muted-foreground text-sm font-medium">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${className || ""}`}>{value}</p>
    </div>
  )
}

/** Falls back through the identities we actually have before showing "Guest".
 *  `displayName` is the DB `User.username` (the real, school-language name);
 *  the session itself carries no display name, so relying on `user.name` alone
 *  greeted every single user as "Guest". */
function resolveDisplayName(
  displayName: string | null | undefined,
  user: { name?: string | null; email?: string | null } | null | undefined,
  fallback: string
): string {
  return (
    displayName?.trim() ||
    user?.name?.trim() ||
    user?.email?.split("@")[0]?.trim() ||
    fallback
  )
}

export function DashboardHeader({
  user,
  displayName,
  accounts,
  totalBanks,
  totalCurrentBalance,
  dictionary,
  currency,
  lang,
}: DashboardHeaderProps) {
  // Arabic uses its own comma (U+060C); a Latin "," reads as a typo in RTL copy.
  const comma = lang === "ar" ? "،" : ","
  const greetingName = resolveDisplayName(
    displayName,
    user,
    (dictionary as Record<string, string>)?.guest || "Guest"
  )

  return (
    <header className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          {dictionary?.welcome || "Welcome back"}
          {comma} {greetingName}
        </h1>
        <p className="text-muted-foreground">
          {dictionary?.subtitle ||
            "Access and manage your account and transactions efficiently."}
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={dictionary?.totalBalance || "Total Balance"}
          value={
            <AnimatedCounter
              amount={totalCurrentBalance}
              currency={currency}
              locale={lang}
            />
          }
        />

        <StatCard
          label={dictionary?.connectedBanks || "Connected Banks"}
          value={totalBanks}
        />

        <StatCard
          label={dictionary?.activeAccounts || "Active Accounts"}
          value={accounts?.length || 0}
        />

        <StatCard
          label={dictionary?.accountStatus || "Account Status"}
          value={dictionary?.statusActive || "Active"}
          className="text-emerald-600 dark:text-emerald-500"
        />
      </div>
    </header>
  )
}
