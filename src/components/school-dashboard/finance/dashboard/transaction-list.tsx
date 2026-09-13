"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import Link from "next/link"
import { format } from "date-fns"
import { ar, enUS } from "date-fns/locale"
import { ArrowDownLeft, ArrowRight, ArrowUpRight } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import { useLocale } from "@/components/internationalization/use-locale"

import type { RecentTransaction } from "./types"

interface TransactionListProps {
  transactions: RecentTransaction[]
  currency?: string
  className?: string
}

export function TransactionList({
  transactions,
  currency = "USD",
  className,
}: TransactionListProps) {
  const { locale } = useLocale()
  const { dictionary } = useDictionary()
  const fd = (dictionary as any)?.finance
  const dp = fd?.dashboardPage as Record<string, string> | undefined
  const c = fd?.common as Record<string, string> | undefined

  const bcp47 = locale === "ar" ? "ar-SA" : "en-US"
  const dateFnsLocale = locale === "ar" ? ar : enUS
  const moneyFmt = new Intl.NumberFormat(bcp47, {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })

  const getIcon = (type: RecentTransaction["type"]) => {
    switch (type) {
      case "income":
        return <ArrowDownLeft className="h-4 w-4 text-green-500" />
      case "expense":
        return <ArrowUpRight className="h-4 w-4 text-red-500" />
      case "transfer":
        return <ArrowRight className="h-4 w-4 text-blue-500 rtl:rotate-180" />
    }
  }

  const getStatusBadge = (status: RecentTransaction["status"]) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="outline" className="text-green-600">
            {dp?.completed || "Completed"}
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="outline" className="text-yellow-600">
            {c?.pending || "Pending"}
          </Badge>
        )
      case "failed":
        return (
          <Badge variant="outline" className="text-red-600">
            {dp?.failed || "Failed"}
          </Badge>
        )
    }
  }

  const formatAmount = (amount: number, type: RecentTransaction["type"]) => {
    const formatted = moneyFmt.format(amount)
    const colorClass = type === "income" ? "text-green-600" : "text-red-600"
    const prefix = type === "income" ? "+" : "-"

    return (
      <span className={`font-semibold ${colorClass}`}>
        {prefix}
        {formatted}
      </span>
    )
  }

  if (transactions.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>
            {dp?.recentTransactions || "Recent Transactions"}
          </CardTitle>
          <CardDescription>
            {dp?.noTransactions || "No transactions found for this period"}
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
            <CardTitle>
              {dp?.recentTransactions || "Recent Transactions"}
            </CardTitle>
            <CardDescription>
              {dp?.latestActivities || "Latest financial activities"}
            </CardDescription>
          </div>
          <Link href={`/${locale}/finance/banking/transaction-history`}>
            <Button variant="outline" size="sm">
              {c?.viewAll || "View All"}
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {/* Phone: no scroll box inside the page's own scroll, and Radix's
            display:table wrapper released so rows can shrink to the card. */}
        <ScrollArea className="h-[400px] max-md:h-auto max-md:[&_[data-radix-scroll-area-viewport]>div]:block!">
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="hover:bg-muted/50 max-md:bg-background flex items-center justify-between rounded-lg border p-3 transition-colors max-md:flex-wrap max-md:gap-2 max-md:border-0"
              >
                <div className="flex items-center gap-3 max-md:min-w-0 max-md:flex-1 max-md:basis-full">
                  <div className="bg-muted rounded-full p-2 max-md:shrink-0">
                    {getIcon(transaction.type)}
                  </div>
                  <div className="space-y-1 max-md:min-w-0">
                    <p className="text-sm leading-none font-medium max-md:line-clamp-2 max-md:leading-5">
                      {transaction.description}
                    </p>
                    <div className="text-muted-foreground flex items-center gap-2 text-xs max-md:flex-wrap max-md:gap-x-1.5 max-md:gap-y-0">
                      <span>
                        {format(new Date(transaction.date), "PP", {
                          locale: dateFnsLocale,
                        })}
                      </span>
                      {transaction.category && (
                        <>
                          <span>•</span>
                          <span>{transaction.category}</span>
                        </>
                      )}
                      {transaction.reference && (
                        <>
                          <span>•</span>
                          <span className="font-mono">
                            {transaction.reference}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 max-md:w-full max-md:justify-between max-md:ps-11">
                  {formatAmount(transaction.amount, transaction.type)}
                  {getStatusBadge(transaction.status)}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Summary */}
        <div className="mt-4 grid grid-cols-3 gap-4 border-t pt-4 text-center">
          <div>
            <p className="text-muted-foreground text-xs">
              {dp?.totalIncome || "Total Income"}
            </p>
            <p className="text-sm font-semibold text-green-600">
              {moneyFmt.format(
                transactions
                  .filter(
                    (t) => t.type === "income" && t.status === "completed"
                  )
                  .reduce((sum, t) => sum + t.amount, 0)
              )}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">
              {dp?.totalExpenses || "Total Expenses"}
            </p>
            <p className="text-sm font-semibold text-red-600">
              {moneyFmt.format(
                transactions
                  .filter(
                    (t) => t.type === "expense" && t.status === "completed"
                  )
                  .reduce((sum, t) => sum + t.amount, 0)
              )}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">
              {c?.pending || "Pending"}
            </p>
            <p className="text-sm font-semibold text-yellow-600">
              {transactions.filter((t) => t.status === "pending").length}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
