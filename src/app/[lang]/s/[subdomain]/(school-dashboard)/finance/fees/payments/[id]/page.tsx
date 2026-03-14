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
import type { Locale } from "@/components/internationalization/config"

export const metadata = { title: "Payment Details" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
}

function statusVariant(
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
    case "REFUNDED":
      return "outline"
    default:
      return "outline"
  }
}

export default async function PaymentDetailPage({ params }: Props) {
  const { lang, id } = await params
  const { schoolId } = await getTenantContext()

  if (!schoolId) notFound()

  const payment = await db.payment.findFirst({
    where: { id, schoolId },
    include: {
      student: { select: { givenName: true, surname: true } },
      feeAssignment: {
        select: {
          id: true,
          academicYear: true,
          finalAmount: true,
          status: true,
          feeStructure: { select: { name: true } },
        },
      },
    },
  })

  if (!payment) notFound()

  const studentName = [payment.student?.givenName, payment.student?.surname]
    .filter(Boolean)
    .join(" ")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Payment Details</h1>
          <p className="text-muted-foreground">{payment.paymentNumber}</p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/${lang}/finance/fees/payments`}>Back</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Payment Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment Number</span>
              <span className="font-medium">{payment.paymentNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Receipt Number</span>
              <span className="font-medium">
                {payment.receiptNumber || "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount</span>
              <span className="text-xl font-bold">
                {formatCurrency(Number(payment.amount), lang)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date</span>
              <span className="font-medium">
                {payment.paymentDate
                  ? formatDate(payment.paymentDate, lang)
                  : "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Method</span>
              <span className="font-medium">{payment.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={statusVariant(payment.status)}>
                {payment.status}
              </Badge>
            </div>
            {payment.transactionId && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transaction ID</span>
                <span className="font-mono text-sm">
                  {payment.transactionId}
                </span>
              </div>
            )}
            {payment.bankName && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bank</span>
                <span className="font-medium">{payment.bankName}</span>
              </div>
            )}
            {payment.chequeNumber && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cheque Number</span>
                <span className="font-medium">{payment.chequeNumber}</span>
              </div>
            )}
            {payment.cardLastFour && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Card</span>
                <span className="font-medium">**** {payment.cardLastFour}</span>
              </div>
            )}
            {payment.remarks && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Remarks</span>
                <span>{payment.remarks}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Related Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Student</span>
              <span className="font-medium">{studentName}</span>
            </div>
            {payment.feeAssignment && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fee Structure</span>
                  <span className="font-medium">
                    {payment.feeAssignment.feeStructure?.name || "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Academic Year</span>
                  <span className="font-medium">
                    {payment.feeAssignment.academicYear}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Fee</span>
                  <span className="font-medium">
                    {formatCurrency(
                      Number(payment.feeAssignment.finalAmount),
                      lang
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Assignment Status
                  </span>
                  <Badge variant="outline">
                    {payment.feeAssignment.status}
                  </Badge>
                </div>
                <div className="pt-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      href={`/${lang}/finance/fees/assignments/${payment.feeAssignment.id}`}
                    >
                      View Assignment
                    </Link>
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
