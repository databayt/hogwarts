// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"

import { db } from "@/lib/db"
import { formatCurrency, formatDate } from "@/lib/i18n-format"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { FinanceAccessDenied } from "@/components/school-dashboard/finance/access-denied"
import { resolveFinanceAccess } from "@/components/school-dashboard/finance/guard"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return {
    title:
      dictionary?.finance?.walletPage?.walletTransactions ||
      "Wallet Transactions",
  }
}

export default async function WalletTransactionsPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const { schoolId, can } = await resolveFinanceAccess("wallet", ["view"])

  if (!schoolId) {
    return (
      <p className="text-muted-foreground">
        {dictionary?.finance?.common?.schoolNotFound ||
          "School context not found"}
      </p>
    )
  }

  if (!can.view) {
    return <FinanceAccessDenied dictionary={dictionary} module="wallet" />
  }

  const [transactions, schoolForCurrency] = await Promise.all([
    db.walletTransaction.findMany({
      where: { schoolId },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        wallet: { select: { walletType: true, ownerId: true, currency: true } },
      },
    }),
    db.school.findUnique({
      where: { id: schoolId },
      select: { currency: true },
    }),
  ])
  const defaultCurrency = schoolForCurrency?.currency ?? "USD"

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Wallet Transactions</h3>
      {transactions.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">
          No transactions yet.
        </p>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <Card key={tx.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="font-medium">
                    {tx.description || tx.reference || "Transaction"}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {tx.wallet.walletType} &mdash; {tx.wallet.ownerId}
                    {tx.sourceModule && ` &mdash; ${tx.sourceModule}`}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {formatDate(tx.createdAt, lang)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-end">
                    <p className="font-medium">
                      {formatCurrency(
                        Number(tx.amount),
                        lang,
                        tx.wallet.currency || defaultCurrency
                      )}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      Balance:{" "}
                      {formatCurrency(
                        Number(tx.balanceAfter),
                        lang,
                        tx.wallet.currency || defaultCurrency
                      )}
                    </p>
                  </div>
                  <Badge
                    variant={tx.type === "CREDIT" ? "default" : "destructive"}
                  >
                    {tx.type}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
