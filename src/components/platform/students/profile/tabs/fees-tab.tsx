import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert } from "@/components/ui/alert";
import { CreditCard, DollarSign, Receipt, TriangleAlert, CircleCheck, Clock, Download, Printer } from "lucide-react";
import type { Student } from "../../registration/types";
import { format } from "date-fns";

interface FeesTabProps {
  student: Student;
}

export function FeesTab({ student }: FeesTabProps) {
  // Use real fee records from the database
  const feeRecords = student.feeRecords || [];

  // Calculate totals from real data
  const totalFees = feeRecords.reduce((sum: number, fee: any) => sum + (Number(fee.amount) || 0), 0);
  const totalPaid = feeRecords.reduce((sum: number, fee: any) => sum + (Number(fee.paidAmount) || 0), 0);
  const totalPending = feeRecords
    .filter((f: any) => f.status === "PENDING" || f.status === "OVERDUE")
    .reduce((sum: number, fee: any) => sum + (Number(fee.amount) || 0), 0);
  const totalOverdue = feeRecords
    .filter((f: any) => f.status === "OVERDUE")
    .reduce((sum: number, fee: any) => sum + (Number(fee.amount) || 0) + (Number(fee.lateFee) || 0), 0);

  const paymentProgress = totalFees > 0 ? (totalPaid / totalFees) * 100 : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID": return "bg-green-100 text-green-800";
      case "PENDING": return "bg-yellow-100 text-yellow-800";
      case "PARTIAL": return "bg-blue-100 text-blue-800";
      case "OVERDUE": return "bg-red-100 text-red-800";
      case "WAIVED": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PAID": return <CircleCheck className="h-4 w-4 text-green-600" />;
      case "PENDING": return <Clock className="h-4 w-4 text-yellow-600" />;
      case "OVERDUE": return <TriangleAlert className="h-4 w-4 text-red-600" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Fee Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Fees</p>
                <p className="text-2xl font-bold">SAR {totalFees.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Paid</p>
                <p className="text-2xl font-bold text-green-600">SAR {totalPaid.toLocaleString()}</p>
              </div>
              <CircleCheck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">SAR {totalPending.toLocaleString()}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-red-600">SAR {totalOverdue.toLocaleString()}</p>
              </div>
              <TriangleAlert className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Academic Year 2024</span>
              <span className="font-medium">{paymentProgress.toFixed(1)}% Complete</span>
            </div>
            <Progress value={paymentProgress} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>SAR {totalPaid.toLocaleString()} paid</span>
              <span>SAR {(totalFees - totalPaid).toLocaleString()} remaining</span>
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
              <h4 className="font-medium text-red-900">Payment Overdue</h4>
              <p className="text-sm text-red-700 mt-1">
                You have overdue fees totaling SAR {totalOverdue.toLocaleString()}. Please make payment immediately to avoid late fees.
              </p>
            </div>
            <Button variant="destructive" size="sm">
              Pay Now
            </Button>
          </div>
        </Alert>
      )}

      {/* Fee Records Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Fee Records</CardTitle>
            {feeRecords.length > 0 && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download Statement
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
                  <TableHead>Fee Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment Date</TableHead>
                  <TableHead>Receipt</TableHead>
                  <TableHead>Action</TableHead>
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
                        SAR {Number(fee.amount).toLocaleString()}
                        {fee.lateFee && (
                          <p className="text-xs text-red-600">
                            +{Number(fee.lateFee).toLocaleString()} (late fee)
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {fee.dueDate ? format(new Date(fee.dueDate), "dd MMM yyyy") : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={getStatusColor(fee.status)}>
                        {fee.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {fee.paymentDate ? (
                        <div>
                          <p>{format(new Date(fee.paymentDate), "dd MMM yyyy")}</p>
                          <p className="text-xs text-muted-foreground">{fee.paymentMethod}</p>
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {fee.receiptNumber ? (
                        <Button variant="link" size="sm" className="p-0 h-auto">
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
                          Pay
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <CreditCard className="h-12 w-12 mb-4" />
              <p>No fee records yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
        </CardHeader>
        <CardContent>
          {feeRecords.filter((f: any) => f.status === "PAID").length > 0 ? (
            <div className="space-y-3">
              {feeRecords
                .filter((f: any) => f.status === "PAID")
                .sort((a: any, b: any) => {
                  const dateA = a.paymentDate ? new Date(a.paymentDate).getTime() : 0;
                  const dateB = b.paymentDate ? new Date(b.paymentDate).getTime() : 0;
                  return dateB - dateA;
                })
                .slice(0, 5)
                .map((fee: any) => (
                  <div key={fee.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Receipt className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{fee.feeType}</p>
                        <p className="text-sm text-muted-foreground">
                          {fee.paymentMethod}{fee.transactionId ? ` • ${fee.transactionId}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">SAR {Number(fee.paidAmount || 0).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">
                        {fee.paymentDate && format(new Date(fee.paymentDate), "dd MMM yyyy")}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Receipt className="h-12 w-12 mb-4" />
              <p>No payments recorded yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}