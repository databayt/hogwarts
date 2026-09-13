// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"
import Link from "next/link"

import { db } from "@/lib/db"
import { formatCurrency, formatDate } from "@/lib/i18n-format"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { FinanceAccessDenied } from "@/components/school-dashboard/finance/access-denied"
import { ExpenseRowActions } from "@/components/school-dashboard/finance/expenses/expense-row-actions"
import { resolveFinanceAccess } from "@/components/school-dashboard/finance/guard"
import { getLabels } from "@/components/translation/person"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return { title: dictionary?.finance?.expensesPage?.expenses || "Expenses" }
}

const statusVariant = (status: string) => {
  switch (status) {
    case "APPROVED":
      return "default" as const
    case "PAID":
      return "default" as const
    case "PENDING":
      return "secondary" as const
    case "REJECTED":
      return "destructive" as const
    case "CANCELLED":
      return "outline" as const
    default:
      return "secondary" as const
  }
}

export default async function ExpensesListPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const ep = dictionary?.finance?.expensesPage
  const statusLabels = dictionary?.finance?.expensesConfig?.statusLabels
  const { schoolId, can } = await resolveFinanceAccess("expenses", ["view"])

  if (!schoolId) {
    return (
      <p className="text-muted-foreground">
        {dictionary?.finance?.common?.schoolNotFound ||
          "School context not found"}
      </p>
    )
  }

  if (!can.view) {
    return <FinanceAccessDenied dictionary={dictionary} module="expenses" />
  }

  const [expenses, schoolForCurrency] = await Promise.all([
    db.expense.findMany({
      where: { schoolId },
      orderBy: { expenseDate: "desc" },
      take: 20,
      include: {
        category: { select: { name: true } },
      },
    }),
    db.school.findUnique({
      where: { id: schoolId },
      select: { currency: true },
    }),
  ])
  const currency = schoolForCurrency?.currency ?? "USD"

  // Batched, deduped translation of DB-stored (English seed) category names —
  // one resolution for the whole list, never per-row.
  const labels = await getLabels(
    expenses.map((e) => e.category.name),
    lang,
    schoolId
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">{ep?.expenses || "Expenses"}</h3>
        <Link
          href={`/${lang}/finance/expenses/new`}
          className={cn(buttonVariants(), "max-md:rounded-full")}
        >
          {ep?.submitExpense || "Submit Expense"}
        </Link>
      </div>
      {expenses.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">
          {ep?.noExpensesYet || "No expenses yet."}
        </p>
      ) : (
        // Phone: one grey grouped list; the amount, status and actions take
        // their own line so the expense number and vendor are not squeezed to
        // a word per line.
        <div className="max-md:bg-muted space-y-3 max-md:space-y-0 max-md:divide-y max-md:overflow-hidden max-md:rounded-xl">
          {expenses.map((expense) => (
            <Card
              key={expense.id}
              className="hover:bg-muted/50 transition-colors max-md:rounded-none max-md:border-0 max-md:bg-transparent max-md:shadow-none"
            >
              <CardContent className="flex items-center justify-between gap-3 py-4 max-md:flex-wrap max-md:gap-2 max-md:px-4 max-md:py-3">
                <Link
                  href={`/${lang}/finance/expenses/${expense.id}`}
                  className="min-w-0 flex-1 max-md:basis-full"
                >
                  <p className="font-medium max-md:line-clamp-2">
                    {expense.expenseNumber}
                    {expense.vendor && ` \u2014 ${expense.vendor}`}
                  </p>
                  <p className="text-muted-foreground text-sm max-md:text-xs">
                    {labels.get(expense.category.name) ?? expense.category.name}{" "}
                    &mdash; {formatDate(expense.expenseDate, lang)}
                  </p>
                </Link>
                <div className="flex shrink-0 items-center gap-3 max-md:w-full max-md:flex-wrap max-md:gap-2">
                  <p className="font-medium max-md:me-auto max-md:tabular-nums">
                    {formatCurrency(Number(expense.amount), lang, currency)}
                  </p>
                  <Badge variant={statusVariant(expense.status)}>
                    {statusLabels?.[expense.status] ?? expense.status}
                  </Badge>
                  <ExpenseRowActions
                    expenseId={expense.id}
                    status={expense.status}
                    labels={dictionary?.finance?.expenseActions}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
