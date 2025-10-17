'use client'

import { AnimatedCounter } from './animated-counter'
import { DoughnutChart } from './doughnut-chart'

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
  dictionary
}: TotalBalanceBoxProps) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            {dictionary?.totalBalance || 'Total Balance'}
          </p>
          <div className="text-3xl font-bold">
            <AnimatedCounter amount={totalCurrentBalance} />
          </div>
          <p className="text-sm text-muted-foreground">
            {totalBanks} {totalBanks === 1 ? 'Bank Account' : 'Bank Accounts'}
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