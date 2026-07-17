// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"
import { notFound } from "next/navigation"

import { db } from "@/lib/db"
import { formatCurrency } from "@/lib/i18n-format"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { FinanceAccessDenied } from "@/components/school-dashboard/finance/access-denied"
import { resolveFinanceAccess } from "@/components/school-dashboard/finance/guard"

export const metadata = { title: "Budget Details" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
}

export default async function BudgetDetailPage({ params }: Props) {
  const { lang, id } = await params
  const dictionary = await getDictionary(lang)
  const d = dictionary?.finance?.budgetPage
  const c = dictionary?.finance?.common
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

  const [budget, schoolForCurrency] = await Promise.all([
    db.budget.findFirst({
      where: { id, schoolId },
      include: {
        fiscalYear: { select: { name: true } },
        allocations: {
          include: {
            category: { select: { name: true } },
          },
          orderBy: { allocated: "desc" },
        },
      },
    }),
    db.school.findUnique({
      where: { id: schoolId },
      select: { currency: true },
    }),
  ])

  if (!budget) {
    notFound()
  }

  const currency = schoolForCurrency?.currency ?? "USD"

  const totalAllocated = budget.allocations.reduce(
    (sum, a) => sum + Number(a.allocated),
    0
  )
  const totalSpent = budget.allocations.reduce(
    (sum, a) => sum + Number(a.spent),
    0
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">{budget.name}</h3>
          <p className="text-muted-foreground text-sm">
            {budget.fiscalYear.name}
            {budget.description && ` — ${budget.description}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={budget.status === "ACTIVE" ? "default" : "secondary"}>
            {budget.status}
          </Badge>
          <Link
            href={`/${lang}/finance/budget/all`}
            className={buttonVariants({ variant: "outline" })}
          >
            {d?.backToBudgets || "Back to Budgets"}
          </Link>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {d?.totalBudget || "Total Budget"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(Number(budget.totalAmount), lang, currency)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {d?.totalAllocated || "Total Allocated"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(totalAllocated, lang, currency)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {d?.totalSpent || "Total Spent"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(totalSpent, lang, currency)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Allocations */}
      <div className="space-y-3">
        <h4 className="font-medium">
          {d?.allocations || "Allocations"} ({budget.allocations.length})
        </h4>
        {budget.allocations.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {d?.noAllocationsYet || "No allocations for this budget yet."}
          </p>
        ) : (
          <div className="space-y-2">
            {budget.allocations.map((alloc) => {
              const allocated = Number(alloc.allocated)
              const spent = Number(alloc.spent)
              const remaining = Number(alloc.remaining)
              const pct = allocated > 0 ? (spent / allocated) * 100 : 0

              return (
                <Card key={alloc.id}>
                  <CardContent className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium">{alloc.category.name}</p>
                      {alloc.notes && (
                        <p className="text-muted-foreground text-sm">
                          {alloc.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span>
                        {c?.allocated || "Allocated"}:{" "}
                        {formatCurrency(allocated, lang, currency)}
                      </span>
                      <span>
                        {c?.spent || "Spent"}:{" "}
                        {formatCurrency(spent, lang, currency)}
                      </span>
                      <span>
                        {c?.remaining || "Remaining"}:{" "}
                        {formatCurrency(remaining, lang, currency)}
                      </span>
                      <Badge variant={pct > 90 ? "destructive" : "secondary"}>
                        {pct.toFixed(0)}%
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
