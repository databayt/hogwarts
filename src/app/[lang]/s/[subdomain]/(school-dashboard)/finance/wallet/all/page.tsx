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

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return { title: dictionary?.finance?.walletPage?.wallets || "Wallets" }
}

export default async function WalletsPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const wp = dictionary?.finance?.walletPage
  const c = dictionary?.finance?.common
  const walletTypeLabels = dictionary?.finance?.walletConfig?.walletTypes
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
        <h3 className="text-lg font-medium">{wp?.wallets || "Wallets"}</h3>
        <Link
          href={`/${lang}/finance/wallet/new`}
          className={cn(buttonVariants(), "max-md:rounded-full")}
        >
          {wp?.createWallet || "Create Wallet"}
        </Link>
      </div>
      {wallets.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">
          {wp?.noWalletsYet || "No wallets yet."}
        </p>
      ) : (
        // Phone: one grey grouped list; balance/badges drop under the owner
        // id, which also gets to break mid-token now (a bare cuid has no
        // spaces, so it forced the whole row wider than the screen before).
        <div className="max-md:bg-muted space-y-3 max-md:space-y-0 max-md:divide-y max-md:overflow-hidden max-md:rounded-xl max-md:[&>a]:block">
          {wallets.map((wallet) => (
            <Link key={wallet.id} href={`/${lang}/finance/wallet/${wallet.id}`}>
              <Card className="hover:bg-muted/50 transition-colors max-md:rounded-none max-md:border-0 max-md:bg-transparent max-md:shadow-none">
                <CardContent className="flex items-center justify-between py-4 max-md:flex-col max-md:items-stretch max-md:gap-2 max-md:px-4 max-md:py-3">
                  <div className="max-md:min-w-0">
                    <p className="font-medium max-md:break-all">
                      {wallet.ownerId}
                    </p>
                    <p className="text-muted-foreground text-sm max-md:text-xs">
                      {wallet._count.transactions}{" "}
                      {c?.transactions || "transactions"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 max-md:w-full max-md:flex-wrap max-md:justify-between max-md:gap-2">
                    <p className="font-medium max-md:tabular-nums">
                      {wallet.currency}{" "}
                      {Number(wallet.balance).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                    <Badge>
                      {walletTypeLabels?.[wallet.walletType] ??
                        wallet.walletType}
                    </Badge>
                    <Badge variant={wallet.isActive ? "default" : "secondary"}>
                      {wallet.isActive
                        ? c?.active || "Active"
                        : c?.inactive || "Inactive"}
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
