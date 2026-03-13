// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { type Locale } from "@/components/internationalization/config"

export const metadata = { title: "Wallet Transactions" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function WalletTransactionsPage({ params }: Props) {
  await params
  const { schoolId } = await getTenantContext()

  if (!schoolId) {
    return <p className="text-muted-foreground">School context not found</p>
  }

  const transactions = await db.walletTransaction.findMany({
    where: { schoolId },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      wallet: { select: { walletType: true, ownerId: true } },
    },
  })

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
                    {tx.createdAt.toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-end">
                    <p className="font-medium">
                      {Number(tx.amount).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      Balance:{" "}
                      {Number(tx.balanceAfter).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
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
