'use client'

import { useState } from 'react'
import { formatAmount } from '@/components/banking/lib/utils'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import {
  Copy,
  Check,
  CreditCard,
  PiggyBank,
  Wallet,
  TrendingUp,
  Building,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BankAccount } from '../types'

interface BankCardProps {
  account: BankAccount
  userName: string
  showBalance?: boolean
  isLoading?: boolean
  className?: string
  onAccountClick?: (account: BankAccount) => void
}

// Account type icon mapping
const accountIcons = {
  checking: Wallet,
  savings: PiggyBank,
  credit: CreditCard,
  investment: TrendingUp,
  loan: Building,
  other: Wallet,
}

// Account status badge variants
const statusVariants = {
  active: 'default',
  inactive: 'secondary',
  frozen: 'destructive',
  closed: 'outline',
} as const

export function BankCardImproved({
  account,
  userName,
  showBalance = true,
  isLoading = false,
  className,
  onAccountClick
}: BankCardProps) {
  const [copiedMask, setCopiedMask] = useState(false)
  const Icon = accountIcons[account.type] || Wallet

  const handleCopyMask = async () => {
    if (account.mask) {
      await navigator.clipboard.writeText(account.mask)
      setCopiedMask(true)
      setTimeout(() => setCopiedMask(false), 2000)
    }
  }

  if (isLoading) {
    return (
      <Card className={cn("animate-pulse", className)}>
        <CardHeader className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    )
  }

  return (
    <TooltipProvider>
      <Card
        className={cn(
          "group relative transition-all duration-200 hover:shadow-lg",
          "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          onAccountClick && "cursor-pointer",
          className
        )}
        onClick={() => onAccountClick?.(account)}
        role={onAccountClick ? "button" : undefined}
        tabIndex={onAccountClick ? 0 : undefined}
        aria-label={`${account.name} account details`}
        onKeyDown={(e) => {
          if (onAccountClick && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            onAccountClick(account)
          }
        }}
      >
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-base leading-none tracking-tight">
                {account.name}
              </h3>
              {account.officialName && account.officialName !== account.name && (
                <p className="text-sm text-muted-foreground">
                  {account.officialName}
                </p>
              )}
              <div className="flex items-center gap-2">
                <Badge variant={statusVariants[account.status || 'active']} className="text-xs">
                  {account.status || 'Active'}
                </Badge>
                <Badge variant="outline" className="text-xs capitalize">
                  {account.type}
                </Badge>
              </div>
            </div>
          </div>

          {account.mask && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-1 text-muted-foreground hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCopyMask()
                  }}
                  aria-label={copiedMask ? "Account number copied" : "Copy account number"}
                >
                  <span className="text-xs font-mono mr-1">•••• {account.mask}</span>
                  {copiedMask ? (
                    <Check className="h-3 w-3 text-green-600" aria-hidden="true" />
                  ) : (
                    <Copy className="h-3 w-3" aria-hidden="true" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{copiedMask ? 'Copied!' : 'Copy account ending'}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Account holder</span>
              <span className="text-sm font-medium">{userName}</span>
            </div>

            {showBalance && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Current balance</span>
                  <span className="text-sm font-semibold tabular-nums">
                    {formatAmount(account.currentBalance)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Available</span>
                  <span className="text-sm font-medium tabular-nums text-green-600 dark:text-green-400">
                    {formatAmount(account.availableBalance)}
                  </span>
                </div>
                {account.limit && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Credit limit</span>
                    <span className="text-sm font-medium tabular-nums">
                      {formatAmount(account.limit)}
                    </span>
                  </div>
                )}
              </>
            )}

            {account.institutionName && (
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-xs text-muted-foreground">Institution</span>
                <span className="text-xs font-medium">{account.institutionName}</span>
              </div>
            )}
          </div>

          {account.status === 'frozen' && (
            <div className="flex items-center gap-2 p-2 rounded-md bg-destructive/10 text-destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span className="text-xs">This account is currently frozen</span>
            </div>
          )}
        </CardContent>

        {/* Hover effect indicator */}
        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-primary/0 via-primary to-primary/0
                        opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </Card>
    </TooltipProvider>
  )
}