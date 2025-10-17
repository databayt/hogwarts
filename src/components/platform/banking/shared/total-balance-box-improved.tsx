'use client'

import { useEffect, useState } from 'react'
import { AnimatedCounter } from './animated-counter'
import { DoughnutChartImproved } from './doughnut-chart-improved'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { TrendingUp, TrendingDown, AlertCircle, RefreshCw, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BankAccount, BankingDictionary } from '../types'

interface TotalBalanceBoxProps {
  accounts: BankAccount[]
  totalBanks: number
  totalCurrentBalance: number
  dictionary?: BankingDictionary
  isLoading?: boolean
  error?: Error | null
  onRefresh?: () => void
  previousBalance?: number
  className?: string
}

export function TotalBalanceBoxImproved({
  accounts = [],
  totalBanks,
  totalCurrentBalance,
  dictionary,
  isLoading = false,
  error = null,
  onRefresh,
  previousBalance,
  className
}: TotalBalanceBoxProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const balanceChange = previousBalance ? totalCurrentBalance - previousBalance : 0
  const changePercent = previousBalance ? (balanceChange / previousBalance) * 100 : 0

  // Trigger animation on mount
  useEffect(() => {
    if (!isLoading) {
      setIsAnimating(true)
    }
  }, [isLoading])

  // Loading state
  if (isLoading) {
    return (
      <Card className={cn("animate-pulse", className)}>
        <CardHeader>
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-8 w-32" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-32 w-32 rounded-full" />
            </div>
            <Skeleton className="h-32 w-32 rounded-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (error) {
    return (
      <Card className={cn("border-destructive", className)}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <p className="text-lg font-semibold mb-2">
            {dictionary?.error || 'Unable to load balance'}
          </p>
          <p className="text-sm text-muted-foreground mb-4 text-center">
            {error.message || 'An unexpected error occurred'}
          </p>
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {dictionary?.retry || 'Retry'}
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  // Empty state
  if (accounts.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-semibold mb-2">
            {dictionary?.noDataAvailable || 'No accounts connected'}
          </p>
          <p className="text-sm text-muted-foreground text-center">
            Connect your bank accounts to see your total balance
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <TooltipProvider>
      <Card className={cn(
        "relative overflow-hidden transition-all duration-300",
        isAnimating && "animate-in fade-in slide-in-from-bottom-2",
        className
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {dictionary?.totalBalance || 'Total Balance'}
            </CardTitle>
            {onRefresh && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onRefresh}
                    className="h-8 w-8 p-0"
                    aria-label="Refresh balance"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Refresh balance</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex-1 space-y-3">
              {/* Balance amount with animation */}
              <div className="text-3xl sm:text-4xl font-bold tracking-tight">
                <AnimatedCounter amount={totalCurrentBalance} />
              </div>

              {/* Balance change indicator */}
              {previousBalance && balanceChange !== 0 && (
                <div className="flex items-center gap-2">
                  <Badge
                    variant={balanceChange > 0 ? 'default' : 'destructive'}
                    className="gap-1"
                  >
                    {balanceChange > 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    <span className="text-xs font-semibold">
                      {balanceChange > 0 ? '+' : ''}{changePercent.toFixed(2)}%
                    </span>
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    from last month
                  </span>
                </div>
              )}

              {/* Account count */}
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="gap-1">
                  <Wallet className="h-3 w-3" />
                  <span className="text-xs font-medium">{totalBanks}</span>
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {totalBanks === 1
                    ? (dictionary?.bankAccounts?.replace(/s$/, '') || 'Bank Account')
                    : (dictionary?.bankAccounts || 'Bank Accounts')}
                </span>
              </div>
            </div>

            {/* Chart section */}
            {accounts.length > 0 && (
              <div className="relative">
                <div className="h-36 w-36 sm:h-40 sm:w-40">
                  <DoughnutChartImproved
                    accounts={accounts}
                    dictionary={dictionary}
                  />
                </div>
                {/* Chart legend could be added here */}
              </div>
            )}
          </div>
        </CardContent>

        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent
                        opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      </Card>
    </TooltipProvider>
  )
}