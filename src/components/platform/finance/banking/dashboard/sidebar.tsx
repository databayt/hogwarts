import Link from "next/link"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { BankCard } from "@/components/platform/finance/banking/shared/bank-card"

interface DashboardSidebarProps {
  user: {
    name?: string | null
    email?: string | null
  }
  transactions: any[]
  banks: any[]
  dictionary: any
  lang: string
}

interface UserProfileSectionProps {
  user: {
    name?: string | null
    email?: string | null
  }
}

interface RecentActivityItemProps {
  transaction: any
}

/**
 * UserProfileSection - Server component for user profile display
 */
function UserProfileSection({ user }: UserProfileSectionProps) {
  const initial = user?.name?.[0]?.toUpperCase() || "U"

  return (
    <div className="bg-card rounded-lg border p-6">
      <div className="flex items-center space-x-4">
        <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-full">
          <span className="text-primary text-lg font-semibold">{initial}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{user?.name}</p>
          <p className="text-muted-foreground truncate text-sm">
            {user?.email}
          </p>
        </div>
      </div>
    </div>
  )
}

/**
 * RecentActivityItem - Memoized activity item component
 */
function RecentActivityItem({ transaction }: RecentActivityItemProps) {
  const amount = Number(transaction.amount)
  const isPositive = amount > 0
  const colorClass = isPositive ? "text-green-600" : "text-red-600"
  const sign = isPositive ? "+" : ""

  return (
    <div className="flex items-center justify-between py-2">
      <div className="mr-4 min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{transaction.name}</p>
        <p className="text-muted-foreground text-xs">
          {new Date(transaction.date).toLocaleDateString()}
        </p>
      </div>
      <p className={`text-sm font-medium whitespace-nowrap ${colorClass}`}>
        {sign}${Math.abs(amount).toFixed(2)}
      </p>
    </div>
  )
}

/**
 * DashboardSidebar - Server component for sidebar content
 *
 * Converted to server component as it only displays data and contains
 * Links (which work on server side). No client interactivity needed.
 */
export function DashboardSidebar({
  user,
  transactions,
  banks,
  dictionary,
  lang,
}: DashboardSidebarProps) {
  const recentTransactions = transactions?.slice(0, 3) || []

  return (
    <aside className="bg-muted/10 w-96 border-l p-8">
      <div className="space-y-6">
        {/* User Profile Section */}
        <UserProfileSection user={user} />

        {/* My Banks Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">
              {dictionary?.myBanks || "My Banks"}
            </h3>
            <Link href={`/${lang}/banking/my-banks`}>
              <Button variant="ghost" size="sm">
                <Plus className="mr-1 h-4 w-4" />
                {dictionary?.addBank || "Add Bank"}
              </Button>
            </Link>
          </div>

          {banks?.length > 0 ? (
            <div className="space-y-3">
              {banks.map((bank: any) => (
                <BankCard
                  key={bank.id}
                  account={bank}
                  userName={user?.name || "User"}
                  showBalance={false}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-6 text-center">
              <p className="text-muted-foreground text-sm">
                {dictionary?.noBanksConnected || "No banks connected yet"}
              </p>
              <Link href={`/${lang}/banking/my-banks`}>
                <Button variant="outline" size="sm" className="mt-2">
                  {dictionary?.connectBank || "Connect Bank"}
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="space-y-4">
          <h3 className="font-semibold">
            {dictionary?.recentActivity || "Recent Activity"}
          </h3>
          {recentTransactions.length > 0 ? (
            <div className="space-y-1">
              {recentTransactions.map((transaction: any) => (
                <RecentActivityItem
                  key={transaction.id}
                  transaction={transaction}
                />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              {dictionary?.noRecentActivity || "No recent activity"}
            </p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="space-y-2">
          <h3 className="mb-3 font-semibold">
            {dictionary?.quickActions || "Quick Actions"}
          </h3>
          <Link href={`/${lang}/banking/payment-transfer`} className="block">
            <Button variant="outline" className="w-full justify-start">
              {dictionary?.transferFunds || "Transfer Funds"}
            </Button>
          </Link>
          <Link href={`/${lang}/banking/transaction-history`} className="block">
            <Button variant="outline" className="w-full justify-start">
              {dictionary?.viewAllTransactions || "View All Transactions"}
            </Button>
          </Link>
        </div>
      </div>
    </aside>
  )
}
