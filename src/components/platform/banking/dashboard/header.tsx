import { AnimatedCounter } from '@/components/platform/banking/shared/animated-counter'
import type { DashboardHeaderProps } from '../types'

interface StatCardProps {
  label: string
  value: string | number | React.ReactNode
  className?: string
}

function StatCard({ label, value, className }: StatCardProps) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <p className="text-sm font-medium text-muted-foreground">
        {label}
      </p>
      <p className={`text-2xl font-bold ${className || ''}`}>
        {value}
      </p>
    </div>
  )
}

export function DashboardHeader({
  user,
  accounts,
  totalBanks,
  totalCurrentBalance,
  dictionary,
}: DashboardHeaderProps) {
  return (
    <header className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          {dictionary?.welcome || 'Welcome back'}, {user?.name || 'Guest'}
        </h1>
        <p className="text-muted-foreground">
          {dictionary?.subtitle || 'Access and manage your account and transactions efficiently.'}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={dictionary?.totalBalance || 'Total Balance'}
          value={<AnimatedCounter amount={totalCurrentBalance} />}
        />

        <StatCard
          label={dictionary?.connectedBanks || 'Connected Banks'}
          value={totalBanks}
        />

        <StatCard
          label={dictionary?.activeAccounts || 'Active Accounts'}
          value={accounts?.length || 0}
        />

        <StatCard
          label={dictionary?.accountStatus || 'Account Status'}
          value={dictionary?.statusActive || 'Active'}
          className="text-green-600"
        />
      </div>
    </header>
  )
}