"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowDownLeft, ArrowUpRight, ArrowRight } from 'lucide-react'
import { format } from "date-fns"
import type { RecentTransaction } from "./types"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface TransactionListProps {
  transactions: RecentTransaction[]
  className?: string
}

export function TransactionList({ transactions, className }: TransactionListProps) {
  const getIcon = (type: RecentTransaction['type']) => {
    switch (type) {
      case 'income':
        return <ArrowDownLeft className="h-4 w-4 text-green-500" />
      case 'expense':
        return <ArrowUpRight className="h-4 w-4 text-red-500" />
      case 'transfer':
        return <ArrowRight className="h-4 w-4 text-blue-500" />
    }
  }

  const getStatusBadge = (status: RecentTransaction['status']) => {
    switch (status) {
      case 'completed':
        return <Badge variant="outline" className="text-green-600">Completed</Badge>
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600">Pending</Badge>
      case 'failed':
        return <Badge variant="outline" className="text-red-600">Failed</Badge>
    }
  }

  const formatAmount = (amount: number, type: RecentTransaction['type']) => {
    const formatted = new Intl.NumberFormat('en-SD', {
      style: 'currency',
      currency: 'SDG',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)

    const colorClass = type === 'income' ? 'text-green-600' : 'text-red-600'
    const prefix = type === 'income' ? '+' : '-'

    return (
      <span className={`font-semibold ${colorClass}`}>
        {prefix}{formatted}
      </span>
    )
  }

  if (transactions.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>
            No transactions found for this period
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>
              Latest financial activities
            </CardDescription>
          </div>
          <Link href="/finance/transactions">
            <Button variant="outline" size="sm">
              View All
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-muted">
                    {getIcon(transaction.type)}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {transaction.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{format(new Date(transaction.date), 'MMM d, yyyy')}</span>
                      {transaction.category && (
                        <>
                          <span>•</span>
                          <span>{transaction.category}</span>
                        </>
                      )}
                      {transaction.reference && (
                        <>
                          <span>•</span>
                          <span className="font-mono">{transaction.reference}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {formatAmount(transaction.amount, transaction.type)}
                  {getStatusBadge(transaction.status)}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Summary */}
        <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Total Income</p>
            <p className="text-sm font-semibold text-green-600">
              SDG {new Intl.NumberFormat('en-SD').format(
                transactions
                  .filter(t => t.type === 'income' && t.status === 'completed')
                  .reduce((sum, t) => sum + t.amount, 0)
              )}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Expenses</p>
            <p className="text-sm font-semibold text-red-600">
              SDG {new Intl.NumberFormat('en-SD').format(
                transactions
                  .filter(t => t.type === 'expense' && t.status === 'completed')
                  .reduce((sum, t) => sum + t.amount, 0)
              )}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Pending</p>
            <p className="text-sm font-semibold text-yellow-600">
              {transactions.filter(t => t.status === 'pending').length}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}