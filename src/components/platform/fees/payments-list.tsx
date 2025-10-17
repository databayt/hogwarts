"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { IconPlus, IconDownload, IconEye } from "@tabler/icons-react";
import { format } from "date-fns";
import type { Dictionary } from "@/components/internationalization/dictionaries";

interface Payment {
  id: string;
  paymentNumber: string;
  amount: any;
  paymentDate: Date | string;
  paymentMethod: string;
  receiptNumber: string;
  status: string;
  student?: {
    studentId: string;
    givenName: string;
    surname: string;
  };
  feeAssignment?: {
    feeStructure?: {
      name: string;
      academicYear: string;
    };
  };
}

interface Props {
  payments: Payment[];
  dictionary?: Dictionary;
}

export function PaymentsList({ payments, dictionary }: Props) {
  const formatCurrency = (amount: any) => {
    const value = typeof amount === 'object' ? amount.toNumber() : amount;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(value);
  };

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
    };
    return methods[method] || method;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{dictionary?.fees?.payments?.title || "Payments"}</CardTitle>
          <CardDescription>
            {dictionary?.fees?.payments?.description || "Track and manage fee payments"}
          </CardDescription>
        </div>
        <Button>
          <IconPlus className="mr-2 h-4 w-4" />
          {dictionary?.fees?.payments?.recordPayment || "Record Payment"}
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{dictionary?.fees?.payments?.paymentNo || "Payment No"}</TableHead>
              <TableHead>{dictionary?.fees?.payments?.student || "Student"}</TableHead>
              <TableHead>{dictionary?.fees?.payments?.feeType || "Fee Type"}</TableHead>
              <TableHead>{dictionary?.fees?.payments?.amount || "Amount"}</TableHead>
              <TableHead>{dictionary?.fees?.payments?.method || "Method"}</TableHead>
              <TableHead>{dictionary?.fees?.payments?.date || "Date"}</TableHead>
              <TableHead>{dictionary?.fees?.payments?.status || "Status"}</TableHead>
              <TableHead className="text-right">
                {dictionary?.fees?.payments?.actions || "Actions"}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  {dictionary?.fees?.payments?.noPayments || "No payments found"}
                </TableCell>
              </TableRow>
            ) : (
              payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">{payment.paymentNumber}</TableCell>
                  <TableCell>
                    {payment.student
                      ? `${payment.student.givenName} ${payment.student.surname}`
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    {payment.feeAssignment?.feeStructure?.name || "N/A"}
                  </TableCell>
                  <TableCell>{formatCurrency(payment.amount)}</TableCell>
                  <TableCell>{getPaymentMethodLabel(payment.paymentMethod)}</TableCell>
                  <TableCell>
                    {format(new Date(payment.paymentDate), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell>
                    <Badge variant={payment.status === "SUCCESS" ? "success" : "destructive"}>
                      {payment.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm">
                        <IconEye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <IconDownload className="h-4 w-4" />
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
  );
}