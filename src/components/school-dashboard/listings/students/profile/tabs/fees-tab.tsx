"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useEffect, useState } from "react"
import {
  CircleCheck,
  Clock,
  CreditCard,
  Receipt,
  TriangleAlert,
} from "lucide-react"

import { formatCurrency } from "@/lib/i18n-format"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Locale } from "@/components/internationalization/config"
import {
  getStudentFees,
  type StudentFeeAssignment,
} from "@/components/school-dashboard/finance/fees/actions"

interface FeesTabProps {
  studentId: string
  lang: Locale
  dictionary?: Record<string, string>
}

const STATUS_COLORS: Record<string, string> = {
  PAID: "bg-green-500/10 text-green-500",
  PARTIAL: "bg-yellow-500/10 text-yellow-500",
  PENDING: "bg-blue-500/10 text-blue-500",
  OVERDUE: "bg-red-500/10 text-red-500",
  CANCELLED: "bg-gray-500/10 text-gray-500",
}

export function FeesTab({ studentId, lang, dictionary }: FeesTabProps) {
  const d = dictionary
  const [assignments, setAssignments] = useState<StudentFeeAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadFees = useCallback(async () => {
    setLoading(true)
    setError(null)
    const result = await getStudentFees(studentId)
    if (result.success && result.data) {
      setAssignments(result.data)
    } else {
      setError(result.error || d?.loadError || "Failed to load fee data")
    }
    setLoading(false)
  }, [studentId, d?.loadError])

  useEffect(() => {
    loadFees()
  }, [loadFees])

  // Compute totals from real FeeAssignment data
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

  // Flatten all payments for the payment history section
  const allPayments = assignments
    .flatMap((a) =>
      a.payments.map((p) => ({
        ...p,
        feeStructureName: a.feeStructureName,
        academicYear: a.academicYear,
      }))
    )
    .sort(
      (a, b) =>
        new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
    )
    .slice(0, 20)

  const dateLocale = lang === "ar" ? "ar-SA" : "en-US"

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="mb-2 h-4 w-20" />
                <Skeleton className="h-8 w-28" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="mb-2 h-4 w-40" />
            <Skeleton className="h-3 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="mb-4 h-6 w-32" />
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="text-muted-foreground flex flex-col items-center justify-center py-12">
        <TriangleAlert className="mb-4 h-12 w-12 text-red-400" />
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Fee Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">
                  {d?.totalFees || "Total Fees"}
                </p>
                <p className="text-2xl font-bold tabular-nums">
                  {formatCurrency(totalFees, lang)}
                </p>
              </div>
              <CreditCard className="text-muted-foreground h-8 w-8" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">
                  {d?.paid || "Paid"}
                </p>
                <p className="text-2xl font-bold text-green-600 tabular-nums">
                  {formatCurrency(totalPaid, lang)}
                </p>
              </div>
              <CircleCheck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">
                  {d?.pending || "Pending"}
                </p>
                <p className="text-2xl font-bold text-yellow-600 tabular-nums">
                  {formatCurrency(totalPending, lang)}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">
                  {d?.overdue || "Overdue"}
                </p>
                <p className="text-2xl font-bold text-red-600 tabular-nums">
                  {formatCurrency(totalOverdue, lang)}
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
              <span>
                {progressPercent}% {d?.complete || "Complete"}
              </span>
            </div>
            <Progress value={progressPercent} className="h-3" />
            <div className="text-muted-foreground flex justify-between text-xs tabular-nums">
              <span>
                {formatCurrency(totalPaid, lang)} {d?.paid || "paid"}
              </span>
              <span>
                {formatCurrency(Math.max(totalFees - totalPaid, 0), lang)}{" "}
                {d?.remaining || "remaining"}
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
                {d?.overdueMessage
                  ? d.overdueMessage.replace(
                      "{amount}",
                      formatCurrency(totalOverdue, lang)
                    )
                  : `You have overdue fees totaling ${formatCurrency(totalOverdue, lang)}. Please make payment immediately to avoid late fees.`}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fee Assignments Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {d?.feeAssignments || d?.feeRecords || "Fee Assignments"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <div className="text-muted-foreground flex flex-col items-center justify-center py-8">
              <CreditCard className="mb-4 h-12 w-12" />
              <p>{d?.noFeeRecords || "No fee assignments found"}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    {d?.feeStructure || d?.feeType || "Fee Structure"}
                  </TableHead>
                  <TableHead>{d?.year || "Year"}</TableHead>
                  <TableHead>{d?.amount || "Amount"}</TableHead>
                  <TableHead>{d?.paid || "Paid"}</TableHead>
                  <TableHead>{d?.remaining || "Remaining"}</TableHead>
                  <TableHead>{d?.status || "Status"}</TableHead>
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
                      {formatCurrency(a.finalAmount, lang)}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatCurrency(a.paidAmount, lang)}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatCurrency(
                        Math.max(a.finalAmount - a.paidAmount, 0),
                        lang
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={STATUS_COLORS[a.status] || ""}
                      >
                        {a.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Payment History */}
      {allPayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              {d?.paymentHistory || d?.recentPayments || "Payment History"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{d?.paymentNumber || "Payment #"}</TableHead>
                  <TableHead>{d?.paymentDate || "Date"}</TableHead>
                  <TableHead>{d?.amount || "Amount"}</TableHead>
                  <TableHead>{d?.method || "Method"}</TableHead>
                  <TableHead>{d?.receipt || "Receipt"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allPayments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.paymentNumber}</TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">
                      {new Date(p.paymentDate).toLocaleDateString(dateLocale)}
                    </TableCell>
                    <TableCell className="font-medium tabular-nums">
                      {formatCurrency(p.amount, lang)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {p.paymentMethod.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.receiptNumber}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Empty payment history (assignments exist but no payments yet) */}
      {assignments.length > 0 && allPayments.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              {d?.paymentHistory || d?.recentPayments || "Payment History"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground flex flex-col items-center justify-center py-8">
              <Receipt className="mb-4 h-12 w-12" />
              <p>{d?.noPayments || "No payments recorded yet"}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
