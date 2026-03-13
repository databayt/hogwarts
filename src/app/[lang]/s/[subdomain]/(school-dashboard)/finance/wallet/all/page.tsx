// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { type Locale } from "@/components/internationalization/config"

export const metadata = { title: "Wallets" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function WalletsPage({ params }: Props) {
  const { lang } = await params
  const { schoolId } = await getTenantContext()

  if (!schoolId) {
    return <p className="text-muted-foreground">School context not found</p>
  }

  const wallets = await db.wallet.findMany({
    where: { schoolId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { transactions: true } },
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Wallets</h3>
        <Link href={`/${lang}/finance/wallet/new`} className={buttonVariants()}>
          Create Wallet
        </Link>
      </div>
      {wallets.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">
          No wallets yet.
        </p>
      ) : (
        <div className="space-y-3">
          {wallets.map((wallet) => (
            <Link key={wallet.id} href={`/${lang}/finance/wallet/${wallet.id}`}>
              <Card className="hover:bg-muted/50 transition-colors">
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-medium">{wallet.ownerId}</p>
                    <p className="text-muted-foreground text-sm">
                      {wallet._count.transactions} transactions
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-medium">
                      {wallet.currency}{" "}
                      {Number(wallet.balance).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                    <Badge>{wallet.walletType}</Badge>
                    <Badge variant={wallet.isActive ? "default" : "secondary"}>
                      {wallet.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
