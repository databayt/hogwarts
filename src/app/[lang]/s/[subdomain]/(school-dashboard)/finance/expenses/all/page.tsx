// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { type Locale } from "@/components/internationalization/config"

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
  const { schoolId } = await getTenantContext()

  if (!schoolId) {
    return <p className="text-muted-foreground">School context not found</p>
  }

  const expenses = await db.expense.findMany({
    where: { schoolId },
    orderBy: { expenseDate: "desc" },
    take: 20,
    include: {
      category: { select: { name: true } },
    },
  })

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
            <Link
              key={expense.id}
              href={`/${lang}/finance/expenses/${expense.id}`}
            >
              <Card className="hover:bg-muted/50 transition-colors">
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-medium">
                      {expense.expenseNumber}
                      {expense.vendor && ` — ${expense.vendor}`}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {expense.category.name} &mdash;{" "}
                      {expense.expenseDate.toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-medium">
                      $
                      {Number(expense.amount).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                    <Badge variant={statusVariant(expense.status)}>
                      {expense.status}
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
