// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { format } from "date-fns"
import {
  CircleCheck,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  Printer,
  Receipt,
  TriangleAlert,
} from "lucide-react"

import { Alert } from "@/components/ui/alert"
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

import type { Student } from "../../registration/types"

interface FeesTabProps {
  student: Student
  dictionary?: any
}

export function FeesTab({ student, dictionary }: FeesTabProps) {
  const d = dictionary
  // Use real fee records from the database
  const feeRecords = student.feeRecords || []

  // Calculate totals from real data
  const totalFees = feeRecords.reduce(
    (sum: number, fee: any) => sum + (Number(fee.amount) || 0),
    0
  )
  const totalPaid = feeRecords.reduce(
    (sum: number, fee: any) => sum + (Number(fee.paidAmount) || 0),
    0
  )
  const totalPending = feeRecords
    .filter((f: any) => f.status === "PENDING" || f.status === "OVERDUE")
    .reduce((sum: number, fee: any) => sum + (Number(fee.amount) || 0), 0)
  const totalOverdue = feeRecords
    .filter((f: any) => f.status === "OVERDUE")
    .reduce(
      (sum: number, fee: any) =>
        sum + (Number(fee.amount) || 0) + (Number(fee.lateFee) || 0),
      0
    )

  const paymentProgress = totalFees > 0 ? (totalPaid / totalFees) * 100 : 0

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-green-100 text-green-800"
      case "PENDING":
        return "bg-yellow-100 text-yellow-800"
      case "PARTIAL":
        return "bg-blue-100 text-blue-800"
      case "OVERDUE":
        return "bg-red-100 text-red-800"
      case "WAIVED":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PAID":
        return <CircleCheck className="h-4 w-4 text-green-600" />
      case "PENDING":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "OVERDUE":
        return <TriangleAlert className="h-4 w-4 text-red-600" />
      default:
        return null
    }
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
                <p className="text-2xl font-bold">
                  {d?.currency || "SAR"} {totalFees.toLocaleString()}
                </p>
              </div>
              <DollarSign className="text-muted-foreground h-8 w-8" />
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
                <p className="text-2xl font-bold text-green-600">
                  {d?.currency || "SAR"} {totalPaid.toLocaleString()}
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
                <p className="text-2xl font-bold text-yellow-600">
                  {d?.currency || "SAR"} {totalPending.toLocaleString()}
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
                <p className="text-2xl font-bold text-red-600">
                  {d?.currency || "SAR"} {totalOverdue.toLocaleString()}
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
              <span>{d?.academicYear || "Academic Year"}</span>
              <span className="font-medium">
                {paymentProgress.toFixed(1)}% {d?.complete || "Complete"}
              </span>
            </div>
            <Progress value={paymentProgress} className="h-3" />
            <div className="text-muted-foreground flex justify-between text-xs">
              <span>
                {d?.currency || "SAR"} {totalPaid.toLocaleString()}{" "}
                {d?.paidLabel || "paid"}
              </span>
              <span>
                {d?.currency || "SAR"}{" "}
                {(totalFees - totalPaid).toLocaleString()}{" "}
                {d?.remaining || "remaining"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overdue Alert */}
      {totalOverdue > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <TriangleAlert className="h-4 w-4 text-red-600" />
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-red-900">
                {d?.paymentOverdue || "Payment Overdue"}
              </h4>
              <p className="mt-1 text-sm text-red-700">
                {d?.overdueMessage
                  ? d.overdueMessage.replace(
                      "{amount}",
                      `${d?.currency || "SAR"} ${totalOverdue.toLocaleString()}`
                    )
                  : `You have overdue fees totaling ${d?.currency || "SAR"} ${totalOverdue.toLocaleString()}. Please make payment immediately to avoid late fees.`}
              </p>
            </div>
            <Button variant="destructive" size="sm">
              {d?.payNow || "Pay Now"}
            </Button>
          </div>
        </Alert>
      )}

      {/* Fee Records Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{d?.feeRecords || "Fee Records"}</CardTitle>
            {feeRecords.length > 0 && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="me-2 h-4 w-4" />
                  {d?.downloadStatement || "Download Statement"}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {feeRecords.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{d?.feeType || "Fee Type"}</TableHead>
                  <TableHead>{d?.amount || "Amount"}</TableHead>
                  <TableHead>{d?.dueDate || "Due Date"}</TableHead>
                  <TableHead>{d?.status || "Status"}</TableHead>
                  <TableHead>{d?.paymentDate || "Payment Date"}</TableHead>
                  <TableHead>{d?.receipt || "Receipt"}</TableHead>
                  <TableHead>{d?.action || "Action"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feeRecords.map((fee: any) => (
                  <TableRow key={fee.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(fee.status)}
                        {fee.feeType}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        {d?.currency || "SAR"}{" "}
                        {Number(fee.amount).toLocaleString()}
                        {fee.lateFee && (
                          <p className="text-xs text-red-600">
                            +{Number(fee.lateFee).toLocaleString()} (
                            {d?.lateFee || "late fee"})
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {fee.dueDate
                        ? format(new Date(fee.dueDate), "dd MMM yyyy")
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={getStatusColor(fee.status)}
                      >
                        {fee.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {fee.paymentDate ? (
                        <div>
                          <p>
                            {format(new Date(fee.paymentDate), "dd MMM yyyy")}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {fee.paymentMethod}
                          </p>
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {fee.receiptNumber ? (
                        <Button variant="link" size="sm" className="h-auto p-0">
                          {fee.receiptNumber}
                        </Button>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {fee.status === "PAID" ? (
                        <Button variant="outline" size="sm">
                          <Printer className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button variant="default" size="sm">
                          {d?.pay || "Pay"}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-muted-foreground flex flex-col items-center justify-center py-8">
              <CreditCard className="mb-4 h-12 w-12" />
              <p>{d?.noFeeRecords || "No fee records yet"}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>{d?.recentPayments || "Recent Payments"}</CardTitle>
        </CardHeader>
        <CardContent>
          {feeRecords.filter((f: any) => f.status === "PAID").length > 0 ? (
            <div className="space-y-3">
              {feeRecords
                .filter((f: any) => f.status === "PAID")
                .sort((a: any, b: any) => {
                  const dateA = a.paymentDate
                    ? new Date(a.paymentDate).getTime()
                    : 0
                  const dateB = b.paymentDate
                    ? new Date(b.paymentDate).getTime()
                    : 0
                  return dateB - dateA
                })
                .slice(0, 5)
                .map((fee: any) => (
                  <div
                    key={fee.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Receipt className="text-muted-foreground h-4 w-4" />
                      <div>
                        <p className="font-medium">{fee.feeType}</p>
                        <p className="text-muted-foreground text-sm">
                          {fee.paymentMethod}
                          {fee.transactionId ? ` • ${fee.transactionId}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="text-end">
                      <p className="font-medium">
                        {d?.currency || "SAR"}{" "}
                        {Number(fee.paidAmount || 0).toLocaleString()}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {fee.paymentDate &&
                          format(new Date(fee.paymentDate), "dd MMM yyyy")}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-muted-foreground flex flex-col items-center justify-center py-8">
              <Receipt className="mb-4 h-12 w-12" />
              <p>{d?.noPayments || "No payments recorded yet"}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
