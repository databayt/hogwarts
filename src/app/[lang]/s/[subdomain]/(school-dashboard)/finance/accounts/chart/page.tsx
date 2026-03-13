// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { type Locale } from "@/components/internationalization/config"

export const metadata = { title: "Chart of Accounts" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function ChartOfAccountsPage({ params }: Props) {
  const { lang } = await params
  const { schoolId } = await getTenantContext()

  if (!schoolId) {
    return <p className="text-muted-foreground">School context not found</p>
  }

  const accounts = await db.chartOfAccount.findMany({
    where: { schoolId },
    orderBy: { code: "asc" },
    include: {
      _count: { select: { ledgerEntries: true } },
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Chart of Accounts</h3>
        <Link
          href={`/${lang}/finance/accounts/chart/new`}
          className={buttonVariants()}
        >
          Create Account
        </Link>
      </div>
      {accounts.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">
          No accounts yet.
        </p>
      ) : (
        <div className="space-y-3">
          {accounts.map((account) => (
            <Card
              key={account.id}
              className="hover:bg-muted/50 transition-colors"
            >
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="font-medium">
                    {account.code} &mdash; {account.name}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {account.type} &middot; Normal: {account.normalBalance}{" "}
                    &middot; {account._count.ledgerEntries} ledger entries
                  </p>
                </div>
                <Badge variant={account.isActive ? "default" : "secondary"}>
                  {account.isActive ? "Active" : "Inactive"}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
