'use client'

import { memo, useCallback, useMemo, useState, useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw, TrendingUp, TrendingDown } from 'lucide-react'
import { usePrefetchOnHover } from '../lib/prefetch'
import type { BankAccount, Transaction } from '@prisma/client'

// Memoized sub-components for performance
const AccountCard = memo(function AccountCard({
  account,
  lang,
  onSelect,
}: {
  account: BankAccount
  lang: string
  onSelect: (id: string) => void
}) {
  // Prefetch on hover for instant navigation
  const prefetchProps = usePrefetchOnHover(`/${lang}/banking/accounts/${account.id}`)

  // Format currency with memoization
  const formattedBalance = useMemo(() => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Number(account.currentBalance))
  }, [account.currentBalance])

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => onSelect(account.id)}
      {...prefetchProps}
    >
      <CardHeader>
        <CardTitle className="text-lg">{account.name}</CardTitle>
        <p className="text-sm text-muted-foreground">
          ****{account.mask}
        </p>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{formattedBalance}</p>
        <p className="text-xs text-muted-foreground mt-1">
          Available: ${Number(account.availableBalance).toFixed(2)}
        </p>
      </CardContent>
    </Card>
  )
})

// Memoized transaction row
const TransactionRow = memo(function TransactionRow({
  transaction,
  onClick,
}: {
  transaction: Transaction
  onClick: (id: string) => void
}) {
  const isDebit = transaction.type === 'debit'
  const Icon = isDebit ? TrendingDown : TrendingUp

  const formattedAmount = useMemo(() => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: transaction.isoCurrencyCode || 'USD',
    }).format(Math.abs(Number(transaction.amount)))
  }, [transaction.amount, transaction.isoCurrencyCode])

  const formattedDate = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(transaction.date))
  }, [transaction.date])

  return (
    <div
      className="flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer transition-colors"
      onClick={() => onClick(transaction.id)}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full ${isDebit ? 'bg-red-100' : 'bg-green-100'}`}>
          <Icon className={`h-4 w-4 ${isDebit ? 'text-red-600' : 'text-green-600'}`} />
        </div>
        <div>
          <p className="font-medium">{transaction.name}</p>
          <p className="text-sm text-muted-foreground">{transaction.category}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={`font-medium ${isDebit ? 'text-red-600' : 'text-green-600'}`}>
          {isDebit ? '-' : '+'}{formattedAmount}
        </p>
        <p className="text-xs text-muted-foreground">{formattedDate}</p>
      </div>
    </div>
  )
})

// Main optimized component
export const OptimizedBankingDashboard = memo(function OptimizedBankingDashboard({
  accounts,
  transactions,
  lang,
  onRefresh,
}: {
  accounts: BankAccount[]
  transactions: Transaction[]
  lang: string
  onRefresh?: () => Promise<void>
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Memoized calculations
  const totalBalance = useMemo(() => {
    return accounts.reduce((sum, account) => {
      return sum + Number(account.currentBalance)
    }, 0)
  }, [accounts])

  const totalAvailable = useMemo(() => {
    return accounts.reduce((sum, account) => {
      return sum + Number(account.availableBalance)
    }, 0)
  }, [accounts])

  // Callbacks with useCallback for referential stability
  const handleAccountSelect = useCallback((accountId: string) => {
    startTransition(() => {
      router.push(`${pathname}?account=${accountId}`)
    })
  }, [pathname, router])

  const handleTransactionSelect = useCallback((transactionId: string) => {
    startTransition(() => {
      router.push(`/${lang}/banking/transactions/${transactionId}`)
    })
  }, [lang, router])

  const handleRefresh = useCallback(async () => {
    if (onRefresh) {
      setIsRefreshing(true)
      try {
        await onRefresh()
        // Use router.refresh() for server component re-render
        router.refresh()
      } finally {
        setIsRefreshing(false)
      }
    }
  }, [onRefresh, router])

  // Group transactions by date for better UX
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, Transaction[]> = {}

    transactions.forEach(transaction => {
      const date = new Date(transaction.date).toDateString()
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(transaction)
    })

    return groups
  }, [transactions])

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-8 w-8"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalBalance.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Available: ${totalAvailable.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accounts.length}</div>
            <p className="text-xs text-muted-foreground">Connected accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${Math.abs(2450.00).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Total spending</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Savings Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23%</div>
            <p className="text-xs text-green-600">+5% from last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Accounts Grid */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Your Accounts</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map(account => (
            <AccountCard
              key={account.id}
              account={account}
              lang={lang}
              onSelect={handleAccountSelect}
            />
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {Object.entries(groupedTransactions).map(([date, dateTransactions]) => (
              <div key={date}>
                <div className="px-4 py-2 bg-muted/30">
                  <p className="text-sm font-medium text-muted-foreground">{date}</p>
                </div>
                {dateTransactions.map(transaction => (
                  <TransactionRow
                    key={transaction.id}
                    transaction={transaction}
                    onClick={handleTransactionSelect}
                  />
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Loading overlay */}
      {isPending && (
        <div className="fixed inset-0 bg-background/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      )}
    </div>
  )
})