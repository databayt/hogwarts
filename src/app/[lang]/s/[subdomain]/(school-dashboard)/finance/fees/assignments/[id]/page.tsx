// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"
import { notFound } from "next/navigation"

import { db } from "@/lib/db"
import { formatCurrency, formatDate } from "@/lib/i18n-format"
import { getTenantContext } from "@/lib/tenant-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Locale } from "@/components/internationalization/config"

export const metadata = { title: "Assignment Details" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
}

function statusVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "PAID":
      return "default"
    case "PARTIAL":
      return "secondary"
    case "OVERDUE":
      return "destructive"
    default:
      return "outline"
  }
}

function paymentStatusVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "SUCCESS":
      return "default"
    case "PENDING":
      return "secondary"
    case "FAILED":
    case "CANCELLED":
      return "destructive"
    default:
      return "outline"
  }
}

export default async function AssignmentDetailPage({ params }: Props) {
  const { lang, id } = await params
  const { schoolId } = await getTenantContext()

  if (!schoolId) notFound()

  const assignment = await db.feeAssignment.findFirst({
    where: { id, schoolId },
    include: {
      student: { select: { givenName: true, surname: true } },
      feeStructure: { select: { name: true, totalAmount: true } },
      payments: {
        orderBy: { paymentDate: "desc" },
        select: {
          id: true,
          paymentNumber: true,
          amount: true,
          paymentDate: true,
          paymentMethod: true,
          receiptNumber: true,
          status: true,
        },
      },
      scholarship: { select: { name: true } },
    },
  })

  if (!assignment) notFound()

  const studentName = [
    assignment.student?.givenName,
    assignment.student?.surname,
  ]
    .filter(Boolean)
    .join(" ")
  const finalAmount = Number(assignment.finalAmount)
  const totalDiscount = Number(assignment.totalDiscount)
  const totalPaid = assignment.payments
    .filter((p) => p.status === "SUCCESS")
    .reduce((sum, p) => sum + Number(p.amount), 0)
  const remaining = Math.max(finalAmount - totalPaid, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Fee Assignment</h1>
          <p className="text-muted-foreground">{studentName}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/${lang}/finance/fees/assignments`}>Back</Link>
          </Button>
          <Button asChild>
            <Link
              href={`/${lang}/finance/fees/payments/new?assignmentId=${id}`}
            >
              Record Payment
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Fee Structure</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-medium">
              {assignment.feeStructure?.name || "-"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Final Amount</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(finalAmount, lang)}
            </p>
            {totalDiscount > 0 && (
              <p className="text-muted-foreground text-sm">
                Discount: {formatCurrency(totalDiscount, lang)}
              </p>
            )}
            {assignment.scholarship && (
              <p className="text-muted-foreground text-sm">
                Scholarship: {assignment.scholarship.name}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Paid</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(totalPaid, lang)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Remaining</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(remaining, lang)}
            </p>
            <Badge variant={statusVariant(assignment.status)} className="mt-1">
              {assignment.status}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payments</CardTitle>
          <CardDescription>
            {assignment.payments.length} payment
            {assignment.payments.length !== 1 ? "s" : ""} recorded
          </CardDescription>
        </CardHeader>
        <CardContent>
          {assignment.payments.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center">
              No payments recorded yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Receipt</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignment.payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <Link
                        href={`/${lang}/finance/fees/payments/${payment.id}`}
                        className="text-primary hover:underline"
                      >
                        {payment.paymentNumber}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {payment.paymentDate
                        ? formatDate(payment.paymentDate, lang)
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(Number(payment.amount), lang)}
                    </TableCell>
                    <TableCell>{payment.paymentMethod}</TableCell>
                    <TableCell>{payment.receiptNumber || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={paymentStatusVariant(payment.status)}>
                        {payment.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
