// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { type Locale } from "@/components/internationalization/config"

export const metadata = { title: "Budgets" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function BudgetsPage({ params }: Props) {
  const { lang } = await params
  const { schoolId } = await getTenantContext()

  if (!schoolId) {
    return <p className="text-muted-foreground">School context not found</p>
  }

  const budgets = await db.budget.findMany({
    where: { schoolId },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      fiscalYear: { select: { name: true } },
      _count: { select: { allocations: true } },
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Budgets</h3>
        <Link href={`/${lang}/finance/budget/new`} className={buttonVariants()}>
          Create Budget
        </Link>
      </div>
      {budgets.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">
          No budgets yet.
        </p>
      ) : (
        <div className="space-y-3">
          {budgets.map((budget) => (
            <Link key={budget.id} href={`/${lang}/finance/budget/${budget.id}`}>
              <Card className="hover:bg-muted/50 transition-colors">
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-medium">{budget.name}</p>
                    <p className="text-muted-foreground text-sm">
                      {budget.fiscalYear.name} &mdash;{" "}
                      {budget._count.allocations} allocations
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-medium">
                      $
                      {Number(budget.totalAmount).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                    <Badge
                      variant={
                        budget.status === "ACTIVE" ? "default" : "secondary"
                      }
                    >
                      {budget.status}
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
