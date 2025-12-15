"use client"

import { AnimatedCounter } from "./animated-counter"
import { DoughnutChart } from "./doughnut-chart"

interface TotalBalanceBoxProps {
  accounts: any[]
  totalBanks: number
  totalCurrentBalance: number
  dictionary?: any
}

export function TotalBalanceBox({
  accounts = [],
  totalBanks,
  totalCurrentBalance,
  dictionary,
}: TotalBalanceBoxProps) {
  return (
    <div className="bg-card rounded-lg border p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="muted font-medium">
            {dictionary?.totalBalance || "Total Balance"}
          </p>
          <h2>
            <AnimatedCounter amount={totalCurrentBalance} />
          </h2>
          <p className="muted">
            {totalBanks} {totalBanks === 1 ? "Bank Account" : "Bank Accounts"}
          </p>
        </div>

        {accounts.length > 0 && (
          <div className="h-32 w-32">
            <DoughnutChart accounts={accounts} />
          </div>
        )}
      </div>
    </div>
  )
}
