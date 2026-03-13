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

export const metadata = { title: "Expense Details" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
}

const statusVariant = (status: string) => {
  switch (status) {
    case "APPROVED":
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

export default async function ExpenseDetailPage({ params }: Props) {
  const { lang, id } = await params
  const { schoolId } = await getTenantContext()

  if (!schoolId) {
    return <p className="text-muted-foreground">School context not found</p>
  }

  const expense = await db.expense.findFirst({
    where: { id, schoolId },
    include: {
      category: { select: { name: true } },
      receipts: true,
    },
  })

  if (!expense) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">{expense.expenseNumber}</h3>
          <p className="text-muted-foreground text-sm">
            {expense.category.name} &mdash;{" "}
            {expense.expenseDate.toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={statusVariant(expense.status)}>
            {expense.status}
          </Badge>
          <Link
            href={`/${lang}/finance/expenses/all`}
            className={buttonVariants({ variant: "outline" })}
          >
            Back to Expenses
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              $
              {Number(expense.amount).toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Vendor</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{expense.vendor || "N/A"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {expense.paymentMethod || "N/A"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Submitted</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {expense.submittedAt.toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{expense.description}</p>
        </CardContent>
      </Card>

      {/* Approval info */}
      {(expense.approvedAt || expense.rejectedAt) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              {expense.approvedAt ? "Approval" : "Rejection"} Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {expense.approvedAt && (
              <p>Approved on {expense.approvedAt.toLocaleDateString()}</p>
            )}
            {expense.rejectedAt && (
              <>
                <p>Rejected on {expense.rejectedAt.toLocaleDateString()}</p>
                {expense.rejectionReason && (
                  <p className="text-muted-foreground">
                    Reason: {expense.rejectionReason}
                  </p>
                )}
              </>
            )}
            {expense.paidAt && (
              <p>Paid on {expense.paidAt.toLocaleDateString()}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Receipts */}
      {expense.receipts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Receipts ({expense.receipts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {expense.receipts.map((receipt) => (
                <li key={receipt.id}>
                  <a
                    href={receipt.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline"
                  >
                    {receipt.fileDisplayName || receipt.fileName}
                  </a>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
