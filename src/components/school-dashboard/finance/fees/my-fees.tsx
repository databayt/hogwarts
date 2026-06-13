// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"
import { CircleCheck, Clock, CreditCard, TriangleAlert } from "lucide-react"

import { formatCurrency, formatDate } from "@/lib/i18n-format"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Locale } from "@/components/internationalization/config"

import { PayOnlineButton } from "./pay-online-button"
import { PaymentDetailActions } from "./payment-detail-actions"

type AssignmentData = {
  id: string
  feeStructureName: string
  academicYear: string
  finalAmount: number
  totalDiscount: number
  paidAmount: number
  status: string
  payments: Array<{
    id: string
    paymentNumber: string
    receiptNumber: string
    amount: number
    paymentDate: string
    paymentMethod: string
    status: string
  }>
}

type MyFeesDictionary = {
  totalFees?: string
  paid?: string
  pending?: string
  overdue?: string
  paymentProgress?: string
  complete?: string
  paidLabel?: string
  remainingLabel?: string
  paymentOverdue?: string
  overdueMessage?: string
  feeAssignments?: string
  noFeeAssignments?: string
  feeStructure?: string
  year?: string
  amount?: string
  remaining?: string
  status?: string
  actions?: string
  view?: string
  paymentHistory?: string
  paymentNumber?: string
  date?: string
  method?: string
  receipt?: string
  viewReceipt?: string
  payOnline?: string
  redirecting?: string
  statusLabels?: Record<string, string>
}

interface MyFeesProps {
  studentName: string
  assignments: AssignmentData[]
  lang: Locale
  currency?: string
  /** School name forwarded to the receipt PDF so it never shows "School". */
  schoolName?: string
  dictionary?: MyFeesDictionary
}

const STATUS_COLORS: Record<string, string> = {
  PAID: "bg-green-500/10 text-green-500",
  PARTIAL: "bg-yellow-500/10 text-yellow-500",
  PENDING: "bg-blue-500/10 text-blue-500",
  OVERDUE: "bg-red-500/10 text-red-500",
  CANCELLED: "bg-gray-500/10 text-gray-500",
}

export function MyFees({
  studentName,
  assignments,
  lang,
  currency = "USD",
  schoolName,
  dictionary,
}: MyFeesProps) {
  const d = dictionary
  const totalFees = assignments.reduce((sum, a) => sum + a.finalAmount, 0)
  const totalPaid = assignments.reduce((sum, a) => sum + a.paidAmount, 0)
  const totalPending = assignments
    .filter((a) => a.status === "PENDING" || a.status === "PARTIAL")
    .reduce((sum, a) => sum + (a.finalAmount - a.paidAmount), 0)
  const totalOverdue = assignments
    .filter((a) => a.status === "OVERDUE")
    .reduce((sum, a) => sum + (a.finalAmount - a.paidAmount), 0)

  const progressPercent =
    totalFees > 0 ? Math.round((totalPaid / totalFees) * 100) : 0

  const getStatusLabel = (status: string) => d?.statusLabels?.[status] || status

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">
                  {d?.totalFees || "Total Fees"}
                </p>
                <p className="text-2xl font-bold tabular-nums">
                  {formatCurrency(totalFees, lang, currency)}
                </p>
              </div>
              <CreditCard className="text-muted-foreground h-8 w-8" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">
                  {d?.paid || "Paid"}
                </p>
                <p className="text-2xl font-bold text-green-600 tabular-nums">
                  {formatCurrency(totalPaid, lang, currency)}
                </p>
              </div>
              <CircleCheck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">
                  {d?.pending || "Pending"}
                </p>
                <p className="text-2xl font-bold text-yellow-600 tabular-nums">
                  {formatCurrency(totalPending, lang, currency)}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">
                  {d?.overdue || "Overdue"}
                </p>
                <p className="text-2xl font-bold text-red-600 tabular-nums">
                  {formatCurrency(totalOverdue, lang, currency)}
                </p>
              </div>
              <TriangleAlert className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Progress */}
      <Card>
        <CardHeader>
          <CardTitle>{d?.paymentProgress || "Payment Progress"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{studentName}</span>
              <span className="font-medium tabular-nums">
                {progressPercent}% {d?.complete || "Complete"}
              </span>
            </div>
            <Progress value={progressPercent} className="h-3" />
            <div className="text-muted-foreground flex justify-between text-xs tabular-nums">
              <span>
                {formatCurrency(totalPaid, lang, currency)}{" "}
                {d?.paidLabel || "paid"}
              </span>
              <span>
                {formatCurrency(
                  Math.max(totalFees - totalPaid, 0),
                  lang,
                  currency
                )}{" "}
                {d?.remainingLabel || "remaining"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overdue Alert */}
      {totalOverdue > 0 && (
        <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
          <CardContent className="flex items-center gap-4 pt-6">
            <TriangleAlert className="h-6 w-6 shrink-0 text-red-600" />
            <div>
              <p className="font-medium text-red-900 dark:text-red-100">
                {d?.paymentOverdue || "Payment Overdue"}
              </p>
              <p className="text-sm text-red-700 dark:text-red-300">
                {(
                  d?.overdueMessage ||
                  "You have overdue fees totaling {amount}. Please contact the administration."
                ).replace(
                  "{amount}",
                  formatCurrency(totalOverdue, lang, currency)
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fee Assignments */}
      <Card>
        <CardHeader>
          <CardTitle>{d?.feeAssignments || "Fee Assignments"}</CardTitle>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <div className="text-muted-foreground flex flex-col items-center py-8">
              <CreditCard className="mb-4 h-12 w-12" />
              <p>{d?.noFeeAssignments || "No fee assignments found"}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{d?.feeStructure || "Fee Structure"}</TableHead>
                  <TableHead>{d?.year || "Year"}</TableHead>
                  <TableHead>{d?.amount || "Amount"}</TableHead>
                  <TableHead>{d?.paid || "Paid"}</TableHead>
                  <TableHead>{d?.remaining || "Remaining"}</TableHead>
                  <TableHead>{d?.status || "Status"}</TableHead>
                  <TableHead>{d?.actions || "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">
                      {a.feeStructureName}
                    </TableCell>
                    <TableCell>{a.academicYear}</TableCell>
                    <TableCell className="tabular-nums">
                      {formatCurrency(a.finalAmount, lang, currency)}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatCurrency(a.paidAmount, lang, currency)}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatCurrency(
                        Math.max(a.finalAmount - a.paidAmount, 0),
                        lang,
                        currency
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={STATUS_COLORS[a.status] || ""}
                      >
                        {getStatusLabel(a.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <PayOnlineButton
                          feeAssignmentId={a.id}
                          lang={lang}
                          remaining={Math.max(a.finalAmount - a.paidAmount, 0)}
                          dictionary={{
                            payOnline: d?.payOnline,
                            redirecting: d?.redirecting,
                          }}
                        />
                        <Button variant="outline" size="sm" asChild>
                          <Link
                            href={`/${lang}/finance/fees/assignments/${a.id}`}
                          >
                            {d?.view || "View"}
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent Payments with Receipt Download */}
      {assignments.some((a) => a.payments.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>{d?.paymentHistory || "Payment History"}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{d?.paymentNumber || "Payment #"}</TableHead>
                  <TableHead>{d?.date || "Date"}</TableHead>
                  <TableHead>{d?.amount || "Amount"}</TableHead>
                  <TableHead>{d?.method || "Method"}</TableHead>
                  <TableHead>{d?.receipt || "Receipt"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments
                  .flatMap((a) =>
                    a.payments.map((p) => ({
                      ...p,
                      feeStructureName: a.feeStructureName,
                      academicYear: a.academicYear,
                    }))
                  )
                  .sort(
                    (a, b) =>
                      new Date(b.paymentDate).getTime() -
                      new Date(a.paymentDate).getTime()
                  )
                  .slice(0, 20)
                  .map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <Link
                          href={`/${lang}/finance/fees/payments/${p.id}`}
                          className="text-primary hover:underline"
                        >
                          {p.paymentNumber}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground tabular-nums">
                        {new Date(p.paymentDate).toLocaleDateString(
                          lang === "ar" ? "ar-SA" : "en-US"
                        )}
                      </TableCell>
                      <TableCell className="font-medium tabular-nums">
                        {formatCurrency(p.amount, lang, currency)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {p.paymentMethod.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <PaymentDetailActions
                            receiptData={{
                              paymentNumber: p.paymentNumber,
                              receiptNumber: p.receiptNumber,
                              amount: formatCurrency(p.amount, lang, currency),
                              paymentDate: new Date(
                                p.paymentDate
                              ).toLocaleDateString(
                                lang === "ar" ? "ar-SA" : "en-US"
                              ),
                              paymentMethod: p.paymentMethod,
                              status: p.status,
                              studentName,
                              feeStructureName: p.feeStructureName,
                              academicYear: p.academicYear,
                              schoolName,
                            }}
                          />
                          {p.status === "SUCCESS" && (
                            <Button variant="ghost" size="sm" asChild>
                              <Link
                                href={`/api/payment/${p.id}/receipt`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {d?.viewReceipt || "View Receipt"}
                              </Link>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
