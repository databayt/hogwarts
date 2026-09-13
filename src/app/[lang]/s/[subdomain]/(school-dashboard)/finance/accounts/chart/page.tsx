// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"
import Link from "next/link"

import { db } from "@/lib/db"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { FinanceAccessDenied } from "@/components/school-dashboard/finance/access-denied"
import { resolveFinanceAccess } from "@/components/school-dashboard/finance/guard"
import { getLabels } from "@/components/translation/person"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return {
    title:
      dictionary?.finance?.accountsPage?.chartOfAccounts || "Chart of Accounts",
  }
}

export default async function ChartOfAccountsPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const ap = dictionary?.finance?.accountsPage
  const c = dictionary?.finance?.common
  const acctTypeLabels = dictionary?.finance?.accountsConfig?.accountTypeLabels
  const balanceTypeLabels = dictionary?.finance?.accounts?.balanceTypes
  const { schoolId, can } = await resolveFinanceAccess("accounts", ["view"])

  if (!schoolId) {
    return (
      <p className="text-muted-foreground">
        {dictionary?.finance?.common?.schoolNotFound ||
          "School context not found"}
      </p>
    )
  }

  if (!can.view) {
    return <FinanceAccessDenied dictionary={dictionary} module="accounts" />
  }

  const accounts = await db.chartOfAccount.findMany({
    where: { schoolId },
    orderBy: { code: "asc" },
    include: {
      _count: { select: { ledgerEntries: true } },
    },
  })

  // Batched, deduped translation of DB-stored (English seed) account names —
  // one resolution for the whole list, never per-row.
  const labels = await getLabels(
    accounts.map((a) => a.name),
    lang,
    schoolId
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">
          {ap?.chartOfAccounts || "Chart of Accounts"}
        </h3>
        <Link
          href={`/${lang}/finance/accounts/chart/new`}
          className={cn(buttonVariants(), "max-md:rounded-full max-md:px-4")}
        >
          {ap?.createAccount || "Create Account"}
        </Link>
      </div>
      {accounts.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">
          {ap?.noAccountsYet || "No accounts yet."}
        </p>
      ) : (
        // Phone: one grey grouped list with hairlines between accounts,
        // instead of a bordered card per account.
        <div className="max-md:bg-muted space-y-3 max-md:space-y-0 max-md:divide-y max-md:overflow-hidden max-md:rounded-xl">
          {accounts.map((account) => {
            const balanceLabel =
              account.normalBalance === "DEBIT"
                ? balanceTypeLabels?.debit || "Debit"
                : balanceTypeLabels?.credit || "Credit"

            return (
              <Card
                key={account.id}
                className="hover:bg-muted/50 transition-colors max-md:rounded-none max-md:border-0 max-md:bg-transparent max-md:shadow-none"
              >
                <CardContent className="flex items-center justify-between py-4 max-md:gap-3 max-md:px-4 max-md:py-3">
                  <div className="max-md:min-w-0">
                    <p className="font-medium">
                      {account.code} &mdash;{" "}
                      {labels.get(account.name) ?? account.name}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {acctTypeLabels?.[account.type] ?? account.type} &middot;{" "}
                      {ap?.normalBalance || "Normal"}: {balanceLabel} &middot;{" "}
                      {account._count.ledgerEntries}{" "}
                      {ap?.ledgerEntries || "ledger entries"}
                    </p>
                  </div>
                  <Badge
                    variant={account.isActive ? "default" : "secondary"}
                    className="max-md:shrink-0"
                  >
                    {account.isActive
                      ? c?.active || "Active"
                      : c?.inactive || "Inactive"}
                  </Badge>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
