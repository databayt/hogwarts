import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  CreditCard,
  DollarSign,
  Receipt,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Printer,
} from "lucide-react";
import type { Student, FeeRecord } from "../../registration/types";
import { format } from "date-fns";

interface FeesTabProps {
  student: Student;
}

export function FeesTab({ student }: FeesTabProps) {
  // Mock fee records
  const feeRecords: FeeRecord[] = student.feeRecords || [
    {
      id: "1",
      schoolId: student.schoolId,
      studentId: student.id,
      academicYearId: "2024",
      feeType: "Tuition Fee",
      amount: 5000,
      dueDate: new Date("2024-01-15"),
      paidAmount: 5000,
      paymentDate: new Date("2024-01-10"),
      paymentMethod: "Bank Transfer",
      transactionId: "TXN-2024-001",
      status: "PAID",
      receiptNumber: "RCP-2024-001",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "2",
      schoolId: student.schoolId,
      studentId: student.id,
      academicYearId: "2024",
      feeType: "Transport Fee",
      amount: 1500,
      dueDate: new Date("2024-01-15"),
      paidAmount: 1500,
      paymentDate: new Date("2024-01-10"),
      paymentMethod: "Bank Transfer",
      transactionId: "TXN-2024-002",
      status: "PAID",
      receiptNumber: "RCP-2024-002",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "3",
      schoolId: student.schoolId,
      studentId: student.id,
      academicYearId: "2024",
      feeType: "Library Fee",
      amount: 500,
      dueDate: new Date("2024-02-15"),
      paidAmount: 500,
      paymentDate: new Date("2024-02-14"),
      paymentMethod: "Cash",
      status: "PAID",
      receiptNumber: "RCP-2024-003",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "4",
      schoolId: student.schoolId,
      studentId: student.id,
      academicYearId: "2024",
      feeType: "Sports Fee",
      amount: 800,
      dueDate: new Date("2024-03-15"),
      status: "PENDING",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "5",
      schoolId: student.schoolId,
      studentId: student.id,
      academicYearId: "2024",
      feeType: "Lab Fee",
      amount: 1200,
      dueDate: new Date("2024-04-15"),
      status: "PENDING",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "6",
      schoolId: student.schoolId,
      studentId: student.id,
      academicYearId: "2024",
      feeType: "Annual Maintenance",
      amount: 2000,
      dueDate: new Date("2024-03-01"),
      status: "OVERDUE",
      lateFee: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const totalFees = feeRecords.reduce((sum, fee) => sum + fee.amount, 0);
  const totalPaid = feeRecords.reduce((sum, fee) => sum + (fee.paidAmount || 0), 0);
  const totalPending = feeRecords
    .filter(f => f.status === "PENDING" || f.status === "OVERDUE")
    .reduce((sum, fee) => sum + fee.amount, 0);
  const totalOverdue = feeRecords
    .filter(f => f.status === "OVERDUE")
    .reduce((sum, fee) => sum + fee.amount + (fee.lateFee || 0), 0);

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
      case "PAID": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "PENDING": return <Clock className="h-4 w-4 text-yellow-600" />;
      case "OVERDUE": return <AlertTriangle className="h-4 w-4 text-red-600" />;
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
              <CheckCircle className="h-8 w-8 text-green-600" />
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
              <AlertTriangle className="h-8 w-8 text-red-600" />
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
          <AlertTriangle className="h-4 w-4 text-red-600" />
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
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download Statement
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
              {feeRecords.map((fee) => (
                <TableRow key={fee.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(fee.status)}
                      {fee.feeType}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      SAR {fee.amount.toLocaleString()}
                      {fee.lateFee && (
                        <p className="text-xs text-red-600">
                          +{fee.lateFee} (late fee)
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{format(new Date(fee.dueDate), "dd MMM yyyy")}</TableCell>
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
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {feeRecords
              .filter(f => f.status === "PAID")
              .sort((a, b) => new Date(b.paymentDate!).getTime() - new Date(a.paymentDate!).getTime())
              .slice(0, 5)
              .map((fee) => (
                <div key={fee.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Receipt className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{fee.feeType}</p>
                      <p className="text-sm text-muted-foreground">
                        {fee.paymentMethod} • {fee.transactionId}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">SAR {fee.paidAmount?.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">
                      {fee.paymentDate && format(new Date(fee.paymentDate), "dd MMM yyyy")}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}