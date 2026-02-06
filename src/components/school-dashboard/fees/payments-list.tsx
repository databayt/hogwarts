"use client"

import { format } from "date-fns"
import { Download, Eye, Plus } from "lucide-react"

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
import type { Dictionary } from "@/components/internationalization/dictionaries"

interface Payment {
  id: string
  paymentNumber: string
  amount: any
  paymentDate: Date | string
  paymentMethod: string
  receiptNumber: string
  status: string
  student?: {
    studentId: string | null
    givenName: string
    surname: string
  }
  feeAssignment?: {
    feeStructure?: {
      name: string
      academicYear: string
    }
  }
}

interface Props {
  payments: Payment[]
  dictionary?: Dictionary
}

export function PaymentsList({ payments, dictionary }: Props) {
  const formatCurrency = (amount: any) => {
    const value = typeof amount === "object" ? amount.toNumber() : amount
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(value)
  }

  const getPaymentMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      CASH: "Cash",
      CHEQUE: "Cheque",
      BANK_TRANSFER: "Bank Transfer",
      CREDIT_CARD: "Credit Card",
      DEBIT_CARD: "Debit Card",
      UPI: "UPI",
      NET_BANKING: "Net Banking",
      WALLET: "Wallet",
      OTHER: "Other",
    }
    return methods[method] || method
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Payments</CardTitle>
          <CardDescription>Track and manage fee payments</CardDescription>
        </div>
        <Button>
          <Plus className="me-2 h-4 w-4" />
          Record Payment
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Payment No</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Fee Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-end">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-muted-foreground py-8 text-center"
                >
                  No payments found
                </TableCell>
              </TableRow>
            ) : (
              payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">
                    {payment.paymentNumber}
                  </TableCell>
                  <TableCell>
                    {payment.student
                      ? `${payment.student.givenName} ${payment.student.surname}`
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    {payment.feeAssignment?.feeStructure?.name || "N/A"}
                  </TableCell>
                  <TableCell>{formatCurrency(payment.amount)}</TableCell>
                  <TableCell>
                    {getPaymentMethodLabel(payment.paymentMethod)}
                  </TableCell>
                  <TableCell>
                    {format(new Date(payment.paymentDate), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        payment.status === "SUCCESS" ? "default" : "destructive"
                      }
                    >
                      {payment.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-end">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
