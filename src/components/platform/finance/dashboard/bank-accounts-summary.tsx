"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Building, CreditCard, PiggyBank, Wallet } from 'lucide-react'
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface BankAccountsSummaryProps {
  accounts: {
    name: string
    balance: number
    type: string
  }[]
  className?: string
}

export function BankAccountsSummary({ accounts, className }: BankAccountsSummaryProps) {
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0)

  const getIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'checking':
      case 'depository':
        return <Building className="h-4 w-4" />
      case 'savings':
        return <PiggyBank className="h-4 w-4" />
      case 'credit':
        return <CreditCard className="h-4 w-4" />
      default:
        return <Wallet className="h-4 w-4" />
    }
  }

  const getTypeBadge = (type: string) => {
    const typeColors: Record<string, string> = {
      checking: 'bg-blue-100 text-blue-800',
      savings: 'bg-green-100 text-green-800',
      credit: 'bg-purple-100 text-purple-800',
      depository: 'bg-blue-100 text-blue-800',
      loan: 'bg-red-100 text-red-800',
      investment: 'bg-yellow-100 text-yellow-800'
    }

    const colorClass = typeColors[type.toLowerCase()] || 'bg-gray-100 text-gray-800'

    return (
      <Badge variant="secondary" className={colorClass}>
        {type}
      </Badge>
    )
  }

  const formatBalance = (balance: number) => {
    return new Intl.NumberFormat('en-SD', {
      style: 'currency',
      currency: 'SDG',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(balance)
  }

  if (accounts.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Bank Accounts</CardTitle>
          <CardDescription>
            No bank accounts connected
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/finance/banking/connect">
            <Button className="w-full">
              Connect Bank Account
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Bank Accounts</CardTitle>
            <CardDescription>
              {accounts.length} active {accounts.length === 1 ? 'account' : 'accounts'}
            </CardDescription>
          </div>
          <Link href="/finance/banking">
            <Button variant="outline" size="sm">
              Manage
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Total Balance */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Total Balance</p>
            <p className="text-2xl font-bold">
              {formatBalance(totalBalance)}
            </p>
          </div>

          {/* Individual Accounts */}
          <div className="space-y-3">
            {accounts.map((account, index) => {
              const percentage = totalBalance > 0
                ? (account.balance / totalBalance) * 100
                : 0

              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getIcon(account.type)}
                      <div>
                        <p className="text-sm font-medium">{account.name}</p>
                        <div className="flex items-center gap-2">
                          {getTypeBadge(account.type)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        {formatBalance(account.balance)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {percentage.toFixed(1)}% of total
                      </p>
                    </div>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              )
            })}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2 pt-4 border-t">
            <Link href="/finance/banking/transfer">
              <Button variant="outline" size="sm" className="w-full">
                Transfer Funds
              </Button>
            </Link>
            <Link href="/finance/banking/reconciliation">
              <Button variant="outline" size="sm" className="w-full">
                Reconcile
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}