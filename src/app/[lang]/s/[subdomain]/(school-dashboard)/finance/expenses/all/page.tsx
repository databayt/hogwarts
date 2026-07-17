// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"

import { db } from "@/lib/db"
import { formatCurrency, formatDate } from "@/lib/i18n-format"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { FinanceAccessDenied } from "@/components/school-dashboard/finance/access-denied"
import { ExpenseRowActions } from "@/components/school-dashboard/finance/expenses/expense-row-actions"
import { resolveFinanceAccess } from "@/components/school-dashboard/finance/guard"

export const metadata = { title: "Expenses" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Expenses</h3>
        <Link
          href={`/${lang}/finance/expenses/new`}
          className={buttonVariants()}
        >
          Submit Expense
        </Link>
      </div>
      {expenses.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">
          No expenses yet.
        </p>
      ) : (
        <div className="space-y-3">
          {expenses.map((expense) => (
            <Card
              key={expense.id}
              className="hover:bg-muted/50 transition-colors"
            >
              <CardContent className="flex items-center justify-between gap-3 py-4">
                <Link
                  href={`/${lang}/finance/expenses/${expense.id}`}
                  className="min-w-0 flex-1"
                >
                  <p className="font-medium">
                    {expense.expenseNumber}
                    {expense.vendor && ` \u2014 ${expense.vendor}`}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {expense.category.name} &mdash;{" "}
                    {formatDate(expense.expenseDate, lang)}
                  </p>
                </Link>
                <div className="flex shrink-0 items-center gap-3">
                  <p className="font-medium">
                    {formatCurrency(Number(expense.amount), lang, currency)}
                  </p>
                  <Badge variant={statusVariant(expense.status)}>
                    {expense.status}
                  </Badge>
                  <ExpenseRowActions
                    expenseId={expense.id}
                    status={expense.status}
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
