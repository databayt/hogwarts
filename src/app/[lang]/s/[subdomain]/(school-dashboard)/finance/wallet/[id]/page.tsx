// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"
import { notFound } from "next/navigation"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type Locale } from "@/components/internationalization/config"

export const metadata = { title: "Wallet Details" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
}

export default async function WalletDetailPage({ params }: Props) {
  const { lang, id } = await params
  const { schoolId } = await getTenantContext()

  if (!schoolId) {
    return <p className="text-muted-foreground">School context not found</p>
  }

  const wallet = await db.wallet.findFirst({
    where: { id, schoolId },
    include: {
      transactions: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  })

  if (!wallet) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Wallet Details</h3>
          <p className="text-muted-foreground text-sm">{wallet.ownerId}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge>{wallet.walletType}</Badge>
          <Badge variant={wallet.isActive ? "default" : "secondary"}>
            {wallet.isActive ? "Active" : "Inactive"}
          </Badge>
          <Link
            href={`/${lang}/finance/wallet/all`}
            className={buttonVariants({ variant: "outline" })}
          >
            Back to Wallets
          </Link>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {wallet.currency}{" "}
              {Number(wallet.balance).toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Type</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{wallet.walletType}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {wallet.isActive ? "Active" : "Inactive"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{wallet.transactions.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent transactions */}
      <div className="space-y-3">
        <h4 className="font-medium">
          Recent Transactions ({wallet.transactions.length})
        </h4>
        {wallet.transactions.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No transactions for this wallet yet.
          </p>
        ) : (
          <div className="space-y-2">
            {wallet.transactions.map((tx) => (
              <Card key={tx.id}>
                <CardContent className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">
                      {tx.description || tx.reference || "Transaction"}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {tx.createdAt.toLocaleDateString()}
                      {tx.sourceModule && ` — ${tx.sourceModule}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span>
                      Amount:{" "}
                      {Number(tx.amount).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                    <span>
                      Balance:{" "}
                      {Number(tx.balanceAfter).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </span>
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
    </div>
  )
}
