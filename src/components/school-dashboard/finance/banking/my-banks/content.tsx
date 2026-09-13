// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Suspense } from "react"
import { Building2 } from "lucide-react"
import type { User } from "next-auth"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"
import type { getDictionary } from "@/components/internationalization/dictionaries"

import { getAccounts } from "./actions"
import AddBankButton from "./add-bank-button"
import BankList from "./bank-list"

interface Props {
  user: User
  dictionary: Awaited<ReturnType<typeof getDictionary>>["banking"]
  lang: Locale
}

export default async function MyBanksContent(props: Props) {
  // Fetch user's bank accounts
  if (!props.user.id) {
    return (
      <div className="py-8">
        <p className="text-muted-foreground">
          {props.dictionary.transferErrorUnauthorized}
        </p>
      </div>
    )
  }

  const accounts = await getAccounts({ userId: props.user.id })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        {accounts.length > 0 && (
          <Suspense
            fallback={
              <div className="bg-muted h-10 w-32 animate-pulse rounded" />
            }
          >
            <AddBankButton dictionary={props.dictionary} />
          </Suspense>
        )}
      </div>

      {/* Banks List or Empty State */}
      {accounts.length === 0 ? (
        <Card className="max-md:bg-muted max-md:border-0 max-md:shadow-none">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building2 className="text-muted-foreground mb-4 h-16 w-16" />
            <h2 className="mb-2 text-xl font-semibold">
              {props.dictionary.noBanks}
            </h2>
            <p className="text-muted-foreground mb-6 max-w-sm text-center">
              {props.dictionary.connectYourBank}
            </p>
            <Suspense
              fallback={
                <div className="bg-muted h-10 w-40 animate-pulse rounded" />
              }
            >
              <AddBankButton dictionary={props.dictionary} size="lg" />
            </Suspense>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Cards — phone: one grey panel two across, hairlines
              between cells; the third spans the row */}
          <div className="max-md:bg-border grid gap-4 max-md:grid-cols-2 max-md:gap-px max-md:overflow-hidden max-md:rounded-xl md:grid-cols-3 max-md:[&>*:last-child:nth-child(odd)]:col-span-2">
            <Card className="max-md:bg-muted max-md:h-full max-md:rounded-none max-md:border-0 max-md:shadow-none">
              <CardHeader className="pb-3 max-md:px-4 max-md:pt-4 max-md:pb-1">
                <CardTitle className="max-md:text-muted-foreground text-sm font-medium max-md:line-clamp-1 max-md:text-xs max-md:font-normal">
                  {props.dictionary.accounts}
                </CardTitle>
              </CardHeader>
              <CardContent className="max-md:px-4 max-md:pb-4">
                <div className="text-2xl font-bold max-md:text-lg max-md:leading-7 max-md:tabular-nums">
                  {accounts.length}
                </div>
                <p className="text-muted-foreground text-xs max-md:line-clamp-1">
                  {props.dictionary.connectBank}
                </p>
              </CardContent>
            </Card>

            <Card className="max-md:bg-muted max-md:h-full max-md:rounded-none max-md:border-0 max-md:shadow-none">
              <CardHeader className="pb-3 max-md:px-4 max-md:pt-4 max-md:pb-1">
                <CardTitle className="max-md:text-muted-foreground text-sm font-medium max-md:line-clamp-1 max-md:text-xs max-md:font-normal">
                  {props.dictionary.totalBalance}
                </CardTitle>
              </CardHeader>
              <CardContent className="max-md:px-4 max-md:pb-4">
                <div className="text-2xl font-bold max-md:text-base max-md:leading-6 max-md:tabular-nums">
                  {formatCurrency(
                    accounts.reduce((sum, acc) => sum + acc.currentBalance, 0)
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="max-md:bg-muted max-md:h-full max-md:rounded-none max-md:border-0 max-md:shadow-none">
              <CardHeader className="pb-3 max-md:px-4 max-md:pt-4 max-md:pb-1">
                <CardTitle className="max-md:text-muted-foreground text-sm font-medium max-md:line-clamp-1 max-md:text-xs max-md:font-normal">
                  {props.dictionary.lastSynced}
                </CardTitle>
              </CardHeader>
              <CardContent className="max-md:px-4 max-md:pb-4">
                <div className="text-2xl font-bold max-md:text-lg max-md:leading-7">
                  {formatTimeAgo(
                    accounts[0]?.lastUpdated || new Date(),
                    props.dictionary
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bank Accounts List */}
          <BankList
            accounts={accounts}
            dictionary={props.dictionary}
            lang={props.lang}
          />
        </>
      )}
    </div>
  )
}

// Utility functions
function formatCurrency(amount: number, locale: string = "ar"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatTimeAgo(
  date: Date | string,
  dict?: Record<string, any>
): string {
  const now = new Date()
  const past = new Date(date)
  const diffMs = now.getTime() - past.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return dict?.justNow || "Just now"
  if (diffMins < 60) return `${diffMins} ${dict?.minsAgo || "mins ago"}`
  if (diffHours < 24) return `${diffHours} ${dict?.hoursAgo || "hours ago"}`
  return `${diffDays} ${dict?.daysAgo || "days ago"}`
}
