// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"
import { notFound } from "next/navigation"

import { db } from "@/lib/db"
import { formatCurrency, formatDate } from "@/lib/i18n-format"
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
import { getDictionary } from "@/components/internationalization/dictionaries"
import { FinanceAccessDenied } from "@/components/school-dashboard/finance/access-denied"
import { PaymentDetailActions } from "@/components/school-dashboard/finance/fees/payment-detail-actions"
import { resolveFinanceAccess } from "@/components/school-dashboard/finance/guard"

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
  const dictionary = await getDictionary(lang)
  const d = dictionary?.finance?.fees?.payment
  const { schoolId, can } = await resolveFinanceAccess("fees", ["view"])

  if (!schoolId) notFound()

  if (!can.view) {
    return <FinanceAccessDenied dictionary={dictionary} module="fees" />
  }

  // School name + currency drive the receipt header and money formatting —
  // never hardcode "School" or a default currency on a financial document.
  const [payment, school] = await Promise.all([
    db.payment.findFirst({
      where: { id, schoolId },
      include: {
        student: { select: { firstName: true, lastName: true } },
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
    }),
    db.school.findUnique({
      where: { id: schoolId },
      select: { name: true, currency: true },
    }),
  ])

  if (!payment) notFound()

  const currency = school?.currency ?? "USD"

  const studentName = [payment.student?.firstName, payment.student?.lastName]
    .filter(Boolean)
    .join(" ")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {d?.paymentDetails ?? "Payment Details"}
          </h1>
          <p className="text-muted-foreground">{payment.paymentNumber}</p>
        </div>
        <div className="flex gap-2">
          <PaymentDetailActions
            paymentId={payment.id}
            receiptData={{
              paymentNumber: payment.paymentNumber,
              receiptNumber: payment.receiptNumber,
              amount: formatCurrency(Number(payment.amount), lang, currency),
              paymentDate: payment.paymentDate
                ? formatDate(payment.paymentDate, lang)
                : "-",
              paymentMethod: payment.paymentMethod,
              status: payment.status,
              transactionId: payment.transactionId || undefined,
              studentName,
              schoolName: school?.name,
              feeStructureName:
                payment.feeAssignment?.feeStructure?.name || "-",
              academicYear: payment.feeAssignment?.academicYear || "-",
            }}
          />
          <Button variant="outline" asChild>
            <Link href={`/${lang}/finance/fees/payments`}>
              {d?.back ?? "Back"}
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              {d?.paymentInformation ?? "Payment Information"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {d?.paymentNumber ?? "Payment Number"}
              </span>
              <span className="font-medium">{payment.paymentNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {d?.receiptNumber ?? "Receipt Number"}
              </span>
              <span className="font-medium">
                {payment.receiptNumber || "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {d?.amount ?? "Amount"}
              </span>
              <span className="text-xl font-bold">
                {formatCurrency(Number(payment.amount), lang, currency)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{d?.date ?? "Date"}</span>
              <span className="font-medium">
                {payment.paymentDate
                  ? formatDate(payment.paymentDate, lang)
                  : "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {d?.method ?? "Method"}
              </span>
              <span className="font-medium">{payment.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {d?.status ?? "Status"}
              </span>
              <Badge variant={statusVariant(payment.status)}>
                {payment.status}
              </Badge>
            </div>
            {payment.transactionId && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {d?.transactionId ?? "Transaction ID"}
                </span>
                <span className="font-mono text-sm">
                  {payment.transactionId}
                </span>
              </div>
            )}
            {payment.bankName && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {d?.bank ?? "Bank"}
                </span>
                <span className="font-medium">{payment.bankName}</span>
              </div>
            )}
            {payment.chequeNumber && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {d?.chequeNumber ?? "Cheque Number"}
                </span>
                <span className="font-medium">{payment.chequeNumber}</span>
              </div>
            )}
            {payment.cardLastFour && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {d?.card ?? "Card"}
                </span>
                <span className="font-medium">**** {payment.cardLastFour}</span>
              </div>
            )}
            {payment.remarks && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {d?.remarks ?? "Remarks"}
                </span>
                <span>{payment.remarks}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {d?.relatedInformation ?? "Related Information"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {d?.student ?? "Student"}
              </span>
              <span className="font-medium">{studentName}</span>
            </div>
            {payment.feeAssignment && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {d?.feeStructure ?? "Fee Structure"}
                  </span>
                  <span className="font-medium">
                    {payment.feeAssignment.feeStructure?.name || "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {d?.academicYear ?? "Academic Year"}
                  </span>
                  <span className="font-medium">
                    {payment.feeAssignment.academicYear}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {d?.totalFee ?? "Total Fee"}
                  </span>
                  <span className="font-medium">
                    {formatCurrency(
                      Number(payment.feeAssignment.finalAmount),
                      lang,
                      currency
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {d?.assignmentStatus ?? "Assignment Status"}
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
                      {d?.viewAssignment ?? "View Assignment"}
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
