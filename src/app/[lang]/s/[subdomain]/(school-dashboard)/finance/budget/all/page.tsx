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
  return { title: dictionary?.finance?.budgetPage?.budgets || "Budgets" }
}

export default async function BudgetsPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const bp = dictionary?.finance?.budgetPage
  const statusLabels = dictionary?.finance?.budgetConfig?.statusLabels
  const { schoolId, can } = await resolveFinanceAccess("budget", ["view"])

  if (!schoolId) {
    return (
      <p className="text-muted-foreground">
        {dictionary?.finance?.common?.schoolNotFound ||
          "School context not found"}
      </p>
    )
  }

  if (!can.view) {
    return <FinanceAccessDenied dictionary={dictionary} module="budget" />
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

  // Batched, deduped translation of DB-stored (English seed) budget names —
  // one resolution for the whole list, never per-row.
  const labels = await getLabels(
    budgets.map((b) => b.name),
    lang,
    schoolId
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">{bp?.budgets || "Budgets"}</h3>
        <Link
          href={`/${lang}/finance/budget/new`}
          className={cn(buttonVariants(), "max-md:rounded-full")}
        >
          {bp?.createBudget || "Create Budget"}
        </Link>
      </div>
      {budgets.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">
          {bp?.noBudgetsYet || "No budgets yet."}
        </p>
      ) : (
        // Phone: one grey grouped list; amount and status drop under the name.
        <div className="max-md:bg-muted space-y-3 max-md:space-y-0 max-md:divide-y max-md:overflow-hidden max-md:rounded-xl max-md:[&>a]:block">
          {budgets.map((budget) => (
            <Link key={budget.id} href={`/${lang}/finance/budget/${budget.id}`}>
              <Card className="hover:bg-muted/50 transition-colors max-md:rounded-none max-md:border-0 max-md:bg-transparent max-md:shadow-none">
                <CardContent className="flex items-center justify-between py-4 max-md:flex-col max-md:items-stretch max-md:gap-2 max-md:px-4 max-md:py-3">
                  <div className="max-md:min-w-0">
                    <p className="font-medium">
                      {labels.get(budget.name) ?? budget.name}
                    </p>
                    <p className="text-muted-foreground text-sm max-md:text-xs">
                      {budget.fiscalYear.name} &mdash;{" "}
                      {budget._count.allocations}{" "}
                      {bp?.allocations || "allocations"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 max-md:justify-between">
                    <p className="font-medium max-md:tabular-nums">
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
                      {statusLabels?.[budget.status] ?? budget.status}
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
