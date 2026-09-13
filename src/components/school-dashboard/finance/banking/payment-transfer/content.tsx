// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Suspense } from "react"
import Link from "next/link"
import { CircleAlert, CreditCard } from "lucide-react"
import type { User } from "next-auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"
import type { getDictionary } from "@/components/internationalization/dictionaries"

import { formatAmount } from "../lib/utils"
import { getAccounts } from "./actions"
import PaymentTransferForm from "./form"

interface Props {
  user: User
  dictionary: Awaited<ReturnType<typeof getDictionary>>["banking"]
  lang: Locale
}

export default async function PaymentTransferContent(props: Props) {
  // Fetch user's bank accounts
  if (!props.user.id) {
    return (
      <div>
        <p className="text-muted-foreground">
          {props.dictionary.transferErrorUnauthorized}
        </p>
      </div>
    )
  }

  // Money renders in the school's own currency -- BankAccount carries no
  // currency column, so School.currency is the source (same as the banking
  // dashboard). This tile used to hardcode USD.
  const { schoolId } = await getTenantContext()
  const [accounts, school] = await Promise.all([
    getAccounts({ userId: props.user.id }),
    schoolId
      ? db.school.findUnique({
          where: { id: schoolId },
          select: { currency: true },
        })
      : null,
  ])
  const currency = school?.currency ?? "USD"

  // Check if user has enough accounts for transfer
  if (!accounts || accounts.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <CreditCard className="text-muted-foreground mb-4 h-16 w-16" />
          <h2 className="mb-2 text-xl font-semibold">
            {props.dictionary.noBanks}
          </h2>
          <p className="text-muted-foreground mb-6 max-w-sm text-center">
            {props.dictionary.connectYourBank}
          </p>
          <Link href={`/${props.lang}/banking/my-banks`}>
            <Button>{props.dictionary.connectBank}</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  // Calculate total available balance
  const totalAvailable = accounts.reduce(
    (sum, acc) => sum + (acc.availableBalance || acc.currentBalance),
    0
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight max-md:text-2xl">
          {props.dictionary.paymentTransfer}
        </h1>
      </div>

      {/* Balance Overview — phone: one grey panel, two across, hairline
          between the cells */}
      <div className="max-md:bg-border grid gap-4 max-md:grid-cols-2 max-md:gap-px max-md:overflow-hidden max-md:rounded-xl md:grid-cols-2">
        <Card className="max-md:bg-muted max-md:h-full max-md:rounded-none max-md:border-0 max-md:shadow-none">
          <CardHeader className="pb-3 max-md:px-4 max-md:pt-4 max-md:pb-1">
            <CardTitle className="max-md:text-muted-foreground text-sm font-medium max-md:line-clamp-1 max-md:text-xs max-md:font-normal">
              {props.dictionary.availableBalance}
            </CardTitle>
          </CardHeader>
          <CardContent className="max-md:px-4 max-md:pb-4">
            <div className="text-2xl font-bold max-md:text-base max-md:leading-6 max-md:tabular-nums">
              {formatAmount(totalAvailable, props.lang, currency)}
            </div>
          </CardContent>
        </Card>

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
          </CardContent>
        </Card>
      </div>

      {/* Transfer Form — phone: grey card, white fields, pill submit */}
      <Card className="max-md:bg-muted max-md:[&_button[role=combobox]]:bg-background max-md:[&_input]:bg-background max-md:[&_textarea]:bg-background max-md:border-0 max-md:shadow-none max-md:[&_button[type=submit]]:h-10 max-md:[&_button[type=submit]]:rounded-full">
        <CardHeader className="max-md:p-4">
          <CardTitle>{props.dictionary.transfer}</CardTitle>
          <CardDescription>{props.dictionary.sendMoney}</CardDescription>
        </CardHeader>
        <CardContent className="max-md:px-4 max-md:pb-4">
          <Suspense fallback={<FormSkeleton />}>
            <PaymentTransferForm
              accounts={accounts}
              dictionary={props.dictionary}
              lang={props.lang}
              currency={currency}
            />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}

function FormSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i}>
          <div className="bg-muted mb-2 h-4 w-24 animate-pulse rounded" />
          <div className="bg-muted h-10 w-full animate-pulse rounded" />
        </div>
      ))}
      <div className="bg-muted h-10 w-32 animate-pulse rounded" />
    </div>
  )
}
