// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"
import { notFound } from "next/navigation"

import { db } from "@/lib/db"
import { formatCurrency, formatDate } from "@/lib/i18n-format"
import { resolveDefaultCurrency } from "@/lib/payment/gateway-config"
import {
  filterConfiguredManualRails,
  getSchoolPaymentSettings,
} from "@/lib/payment/manual-rail-settings"
import { resolveAvailableMethods } from "@/lib/payment/provider"
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
import { getDictionary } from "@/components/internationalization/dictionaries"
import { interpolate } from "@/components/internationalization/helpers"
import { FinanceAccessDenied } from "@/components/school-dashboard/finance/access-denied"
import { FeePaymentMethods } from "@/components/school-dashboard/finance/fees/fee-payment-methods"
import {
  buildInstallments,
  InstallmentTimeline,
} from "@/components/school-dashboard/finance/fees/installment-timeline"
import { resolveFinanceAccess } from "@/components/school-dashboard/finance/guard"

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
  const dictionary = await getDictionary(lang)
  const d = dictionary?.finance
  const { schoolId, can } = await resolveFinanceAccess("fees", ["view"])

  if (!schoolId) notFound()

  if (!can.view) {
    return <FinanceAccessDenied dictionary={dictionary} module="fees" />
  }

  const [assignment, school, paymentSettings] = await Promise.all([
    db.feeAssignment.findFirst({
      where: { id, schoolId },
      include: {
        student: { select: { firstName: true, lastName: true } },
        feeStructure: {
          select: {
            name: true,
            totalAmount: true,
            installments: true,
            paymentSchedule: true,
          },
        },
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
    }),
    db.school.findUnique({
      where: { id: schoolId },
      select: { currency: true, country: true, timezone: true },
    }),
    getSchoolPaymentSettings(schoolId),
  ])

  if (!assignment) notFound()

  const currency =
    school?.currency ??
    resolveDefaultCurrency(school?.country, school?.timezone)
  // Rails the school's region supports (Tap-first for AE, Stripe elsewhere,
  // Bankak/Cashi for SD). Filtered by configured + currency-compatible so we
  // never render a gateway whose API key is missing...
  const resolvedMethods = resolveAvailableMethods(
    school?.country,
    school?.timezone,
    currency
  )
  // ...then drop the manual wallet rails this school hasn't set up, since
  // isConfigured() is env-level and can't know about per-school accounts.
  const methods = filterConfiguredManualRails(resolvedMethods, paymentSettings)

  const studentName = [
    assignment.student?.firstName,
    assignment.student?.lastName,
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
          <h1 className="text-2xl font-semibold">
            {d?.fees?.assignment?.title || "Fee Assignment"}
          </h1>
          <p className="text-muted-foreground">{studentName}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/${lang}/finance/fees/assignments`}>
              {d?.fees?.assignment?.back || "Back"}
            </Link>
          </Button>
          <Button asChild>
            <Link
              href={`/${lang}/finance/fees/payments/new?assignmentId=${id}`}
            >
              {d?.fees?.overview?.recordPayment || "Record Payment"}
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              {d?.fees?.feeStructure || "Fee Structure"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-medium">
              {assignment.feeStructure?.name || "-"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              {d?.fees?.assignment?.finalAmount || "Final Amount"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(finalAmount, lang, currency)}
            </p>
            {totalDiscount > 0 && (
              <p className="text-muted-foreground text-sm">
                {d?.fees?.discount || "Discount"}:{" "}
                {formatCurrency(totalDiscount, lang, currency)}
              </p>
            )}
            {assignment.scholarship && (
              <p className="text-muted-foreground text-sm">
                {d?.fees?.scholarshipLabel || "Scholarship"}:{" "}
                {assignment.scholarship.name}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{d?.fees?.myFees?.paid || "Paid"}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(totalPaid, lang, currency)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              {d?.fees?.myFees?.remaining || "Remaining"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(remaining, lang, currency)}
            </p>
            <Badge variant={statusVariant(assignment.status)} className="mt-1">
              {(d?.fees?.myFees?.statusLabels as Record<string, string>)?.[
                assignment.status
              ] || assignment.status}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Parent-side gateway picker. Hidden when remaining is zero or no
          online gateway is configured for the school's region. */}
      <FeePaymentMethods
        feeAssignmentId={id}
        lang={lang}
        remaining={remaining}
        methods={methods}
        dictionary={
          (
            d as unknown as {
              gateways?: {
                title?: string
                chooseMethod?: string
                paymentFailed?: string
                redirecting?: string
              }
            }
          )?.gateways
        }
      />

      {/* Installment Timeline */}
      {(() => {
        const schedule = assignment.feeStructure?.paymentSchedule as Array<{
          dueDate: string
          amount: number
          description?: string
        }> | null
        const instCount = assignment.feeStructure?.installments ?? 1
        const installments = buildInstallments(
          schedule,
          instCount,
          finalAmount,
          assignment.payments.map((p) => ({
            amount: Number(p.amount),
            status: p.status,
            paymentDate: p.paymentDate,
          })),
          assignment.createdAt
        )
        return (
          <InstallmentTimeline
            installments={installments}
            totalAmount={finalAmount}
            totalPaid={totalPaid}
            lang={lang}
          />
        )
      })()}

      <Card>
        <CardHeader>
          <CardTitle>{d?.fees?.assignment?.payments || "Payments"}</CardTitle>
          <CardDescription>
            {interpolate(
              d?.fees?.assignment?.paymentsRecorded ||
                "{count} payment(s) recorded",
              { count: assignment.payments.length }
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {assignment.payments.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center">
              {d?.fees?.assignment?.noPaymentsRecorded ||
                "No payments recorded yet."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    {d?.fees?.myFees?.paymentNumber || "Payment #"}
                  </TableHead>
                  <TableHead>{d?.fees?.myFees?.date || "Date"}</TableHead>
                  <TableHead>{d?.fees?.myFees?.amount || "Amount"}</TableHead>
                  <TableHead>{d?.fees?.myFees?.method || "Method"}</TableHead>
                  <TableHead>{d?.fees?.myFees?.receipt || "Receipt"}</TableHead>
                  <TableHead>{d?.fees?.myFees?.status || "Status"}</TableHead>
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
                      {formatCurrency(Number(payment.amount), lang, currency)}
                    </TableCell>
                    <TableCell>{payment.paymentMethod}</TableCell>
                    <TableCell>{payment.receiptNumber || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={paymentStatusVariant(payment.status)}>
                        {(
                          d?.fees?.assignment?.paymentStatus as Record<
                            string,
                            string
                          >
                        )?.[payment.status] || payment.status}
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
