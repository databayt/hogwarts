"use client"

import * as React from "react"
import { useCallback, useMemo, useState } from "react"
import { addDays, differenceInDays, format, isFuture, isPast } from "date-fns"
import {
  Ban,
  Calendar,
  CircleAlert,
  CircleCheck,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  Eye,
  FileText,
  ListFilter,
  Mail,
  MessageSquare,
  Pencil,
  Phone,
  Plus,
  Printer,
  Receipt,
  RefreshCw,
  Search,
  Send,
  Share2,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

interface Student {
  id: string
  givenName: string
  surname: string
  studentId: string
  profileImageUrl?: string
  class: string
  guardian: {
    name: string
    email: string
    phone: string
  }
}

interface FeeStructure {
  id: string
  name: string
  description?: string
  amount: number
  category:
    | "tuition"
    | "transport"
    | "library"
    | "sports"
    | "examination"
    | "other"
  frequency: "one-time" | "monthly" | "quarterly" | "annually"
  mandatory: boolean
  applicableTo: string[] // class names
  academicYear: string
  dueDate?: Date
}

interface FeePayment {
  id: string
  studentId: string
  student?: Student
  feeStructureId: string
  feeStructure?: FeeStructure
  amountDue: number
  amountPaid: number
  balance: number
  status: "pending" | "partial" | "paid" | "overdue" | "waived"
  dueDate: Date
  paidDate?: Date
  paymentMethod?: "cash" | "card" | "bank-transfer" | "online" | "cheque"
  transactionId?: string
  receiptNumber?: string
  discount?: {
    type: "percentage" | "fixed"
    value: number
    reason: string
  }
  installments?: {
    number: number
    amount: number
    dueDate: Date
    status: "pending" | "paid"
  }[]
  lateFee?: number
  notes?: string
}

interface PaymentTransaction {
  id: string
  feePaymentId: string
  amount: number
  paymentDate: Date
  paymentMethod: string
  transactionId: string
  receiptNumber: string
  collectedBy: string
  notes?: string
}

interface FeeManagementProps {
  students: Student[]
  feeStructures: FeeStructure[]
  feePayments: FeePayment[]
  transactions: PaymentTransaction[]
  currentUser: {
    id: string
    name: string
    role: "admin" | "accountant" | "parent" | "student"
  }
  onRecordPayment: (payment: {
    feePaymentId: string
    amount: number
    paymentMethod: string
    transactionId?: string
  }) => Promise<void>
  onSendReminder: (
    studentIds: string[],
    method: "email" | "sms"
  ) => Promise<void>
  onGenerateReceipt: (transactionId: string) => Promise<Blob>
  onWaiveFee: (feePaymentId: string, reason: string) => Promise<void>
  onApplyDiscount: (
    feePaymentId: string,
    discount: { type: "percentage" | "fixed"; value: number; reason: string }
  ) => Promise<void>
  onExportReport: (filters: any) => void
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"]

const categoryColors = {
  tuition: "bg-blue-100 text-blue-800",
  transport: "bg-green-100 text-green-800",
  library: "bg-purple-100 text-purple-800",
  sports: "bg-yellow-100 text-yellow-800",
  examination: "bg-red-100 text-red-800",
  other: "bg-gray-100 text-gray-800",
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  partial: "bg-orange-100 text-orange-800",
  paid: "bg-green-100 text-green-800",
  overdue: "bg-red-100 text-red-800",
  waived: "bg-gray-100 text-gray-800",
}

export function FeeManagement({
  students,
  feeStructures,
  feePayments,
  transactions,
  currentUser,
  onRecordPayment,
  onSendReminder,
  onGenerateReceipt,
  onWaiveFee,
  onApplyDiscount,
  onExportReport,
}: FeeManagementProps) {
  const [selectedTab, setSelectedTab] = useState<
    "overview" | "payments" | "defaulters" | "reports"
  >("overview")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedClass, setSelectedClass] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<FeePayment | null>(
    null
  )
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [transactionId, setTransactionId] = useState("")
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false)
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">(
    "percentage"
  )
  const [discountValue, setDiscountValue] = useState("")
  const [discountReason, setDiscountReason] = useState("")

  // Filter fee payments
  const filteredPayments = useMemo(() => {
    let filtered = feePayments

    if (currentUser.role === "parent" || currentUser.role === "student") {
      // Show only relevant student's fees
      filtered = filtered.filter((fp) => fp.studentId === currentUser.id)
    }

    if (selectedClass !== "all") {
      filtered = filtered.filter((fp) => fp.student?.class === selectedClass)
    }

    if (selectedStatus !== "all") {
      filtered = filtered.filter((fp) => fp.status === selectedStatus)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (fp) =>
          `${fp.student?.givenName} ${fp.student?.surname}`
            .toLowerCase()
            .includes(query) ||
          fp.student?.studentId.toLowerCase().includes(query)
      )
    }

    return filtered.sort((a, b) => {
      // Overdue first
      if (a.status === "overdue" && b.status !== "overdue") return -1
      if (b.status === "overdue" && a.status !== "overdue") return 1
      return b.dueDate.getTime() - a.dueDate.getTime()
    })
  }, [feePayments, currentUser, selectedClass, selectedStatus, searchQuery])

  // Statistics
  const stats = useMemo(() => {
    const totalDue = feePayments.reduce((sum, fp) => sum + fp.amountDue, 0)
    const totalPaid = feePayments.reduce((sum, fp) => sum + fp.amountPaid, 0)
    const totalPending = feePayments.reduce((sum, fp) => sum + fp.balance, 0)
    const overdueCount = feePayments.filter(
      (fp) => fp.status === "overdue"
    ).length
    const collectionRate = totalDue > 0 ? (totalPaid / totalDue) * 100 : 0

    // This month stats
    const thisMonth = new Date()
    const monthlyCollected = transactions
      .filter((t) => {
        const tDate = new Date(t.paymentDate)
        return (
          tDate.getMonth() === thisMonth.getMonth() &&
          tDate.getFullYear() === thisMonth.getFullYear()
        )
      })
      .reduce((sum, t) => sum + t.amount, 0)

    const defaulters = feePayments.filter(
      (fp) =>
        fp.status === "overdue" ||
        (fp.status === "partial" && isPast(fp.dueDate))
    ).length

    return {
      totalDue,
      totalPaid,
      totalPending,
      overdueCount,
      collectionRate,
      monthlyCollected,
      defaulters,
    }
  }, [feePayments, transactions])

  // Payment trends
  const paymentTrends = useMemo(() => {
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - (5 - i))
      return {
        month: format(date, "MMM"),
        collected: 0,
        pending: 0,
      }
    })

    transactions.forEach((t) => {
      const monthIndex = last6Months.findIndex(
        (m) => m.month === format(new Date(t.paymentDate), "MMM")
      )
      if (monthIndex !== -1) {
        last6Months[monthIndex].collected += t.amount
      }
    })

    return last6Months
  }, [transactions])

  // Fee category breakdown
  const categoryBreakdown = useMemo(() => {
    const breakdown = feeStructures.map((fs) => {
      const payments = feePayments.filter((fp) => fp.feeStructureId === fs.id)
      const collected = payments.reduce((sum, fp) => sum + fp.amountPaid, 0)
      return {
        name: fs.name,
        value: collected,
        category: fs.category,
      }
    })

    return breakdown
  }, [feeStructures, feePayments])

  const handleRecordPayment = async () => {
    if (!selectedPayment) return

    const amount = parseFloat(paymentAmount)
    if (isNaN(amount) || amount <= 0 || amount > selectedPayment.balance) {
      toast.error("Invalid payment amount")
      return
    }

    try {
      await onRecordPayment({
        feePaymentId: selectedPayment.id,
        amount,
        paymentMethod,
        transactionId: transactionId || undefined,
      })
      toast.success("Payment recorded successfully")
      setPaymentDialogOpen(false)
      setPaymentAmount("")
      setTransactionId("")
    } catch (error) {
      toast.error("Failed to record payment")
    }
  }

  const handleApplyDiscount = async () => {
    if (!selectedPayment) return

    const value = parseFloat(discountValue)
    if (isNaN(value) || value <= 0) {
      toast.error("Invalid discount value")
      return
    }

    try {
      await onApplyDiscount(selectedPayment.id, {
        type: discountType,
        value,
        reason: discountReason,
      })
      toast.success("Discount applied successfully")
      setDiscountDialogOpen(false)
      setDiscountValue("")
      setDiscountReason("")
    } catch (error) {
      toast.error("Failed to apply discount")
    }
  }

  const handleSendReminders = async () => {
    const overdueStudentIds = filteredPayments
      .filter((fp) => fp.status === "overdue")
      .map((fp) => fp.studentId)

    if (overdueStudentIds.length === 0) {
      toast.error("No students with overdue payments")
      return
    }

    try {
      await onSendReminder(overdueStudentIds, "email")
      toast.success(`Reminders sent to ${overdueStudentIds.length} parents`)
    } catch (error) {
      toast.error("Failed to send reminders")
    }
  }

  const getDaysOverdue = (dueDate: Date) => {
    const days = differenceInDays(new Date(), dueDate)
    return days > 0 ? days : 0
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Fee Management</CardTitle>
              <CardDescription>
                Track and manage student fee payments
              </CardDescription>
            </div>
            {(currentUser.role === "admin" ||
              currentUser.role === "accountant") && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleSendReminders}>
                  <Send className="mr-2 h-4 w-4" />
                  Send Reminders
                </Button>
                <Button variant="outline" onClick={() => onExportReport({})}>
                  <Download className="mr-2 h-4 w-4" />
                  Export Report
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-7">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Due</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.totalDue.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Collected</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${stats.totalPaid.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              ${stats.totalPending.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Collection Rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.collectionRate.toFixed(1)}%
            </div>
            <Progress value={stats.collectionRate} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>This Month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${stats.monthlyCollected.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Overdue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.overdueCount}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Defaulters</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.defaulters}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)}>
        <TabsList className="grid w-full max-w-lg grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="payments">
            Payments
            {stats.overdueCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {stats.overdueCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="defaulters">Defaulters</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Payment Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Trends</CardTitle>
                <CardDescription>Last 6 months collection</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={paymentTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => `$${value}`} />
                    <Bar dataKey="collected" fill="#10b981" name="Collected" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Category Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Fee Category Breakdown</CardTitle>
                <CardDescription>Collection by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryBreakdown.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${value}`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Fee Structures */}
          <Card>
            <CardHeader>
              <CardTitle>Fee Structures</CardTitle>
              <CardDescription>
                Current academic year fee breakdown
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {feeStructures.map((fs) => (
                  <div
                    key={fs.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{fs.name}</p>
                        <Badge
                          variant="outline"
                          className={categoryColors[fs.category]}
                        >
                          {fs.category}
                        </Badge>
                        {fs.mandatory && (
                          <Badge variant="secondary">Mandatory</Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground text-sm">
                        {fs.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">${fs.amount}</p>
                      <p className="text-muted-foreground text-xs capitalize">
                        {fs.frequency}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <Input
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payments Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Fee Type</TableHead>
                    <TableHead>Amount Due</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => {
                    const daysOverdue = getDaysOverdue(payment.dueDate)

                    return (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={payment.student?.profileImageUrl}
                              />
                              <AvatarFallback>
                                {payment.student?.givenName[0]}
                                {payment.student?.surname[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">
                                {payment.student?.givenName}{" "}
                                {payment.student?.surname}
                              </p>
                              <p className="text-muted-foreground text-xs">
                                {payment.student?.studentId}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              categoryColors[
                                payment.feeStructure?.category || "other"
                              ]
                            }
                          >
                            {payment.feeStructure?.name}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          ${payment.amountDue.toLocaleString()}
                        </TableCell>
                        <TableCell className="font-medium text-green-600">
                          ${payment.amountPaid.toLocaleString()}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "font-medium",
                            payment.balance > 0
                              ? "text-red-600"
                              : "text-green-600"
                          )}
                        >
                          ${payment.balance.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p>{format(payment.dueDate, "MMM dd, yyyy")}</p>
                            {daysOverdue > 0 && (
                              <p className="text-xs text-red-600">
                                {daysOverdue} days overdue
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={statusColors[payment.status]}
                          >
                            {payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {payment.balance > 0 &&
                              (currentUser.role === "admin" ||
                                currentUser.role === "accountant") && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedPayment(payment)
                                    setPaymentDialogOpen(true)
                                  }}
                                >
                                  <DollarSign className="mr-1 h-4 w-4" />
                                  Pay
                                </Button>
                              )}
                            {payment.receiptNumber && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  onGenerateReceipt(payment.receiptNumber!)
                                }
                              >
                                <Receipt className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Defaulters Tab */}
        <TabsContent value="defaulters">
          <Card>
            <CardHeader>
              <CardTitle>Fee Defaulters</CardTitle>
              <CardDescription>
                Students with overdue payments requiring immediate attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredPayments
                  .filter((fp) => fp.status === "overdue")
                  .map((payment) => {
                    const daysOverdue = getDaysOverdue(payment.dueDate)

                    return (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4"
                      >
                        <div className="flex items-center gap-3">
                          <CircleAlert className="h-8 w-8 text-red-600" />
                          <div>
                            <p className="font-medium">
                              {payment.student?.givenName}{" "}
                              {payment.student?.surname}
                            </p>
                            <p className="text-muted-foreground text-sm">
                              {payment.feeStructure?.name} - $
                              {payment.balance.toLocaleString()} overdue
                            </p>
                            <p className="text-xs text-red-600">
                              {daysOverdue} days past due date
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              onSendReminder([payment.studentId], "email")
                            }
                          >
                            <Mail className="mr-1 h-4 w-4" />
                            Remind
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                              setSelectedPayment(payment)
                              setPaymentDialogOpen(true)
                            }}
                          >
                            Record Payment
                          </Button>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Financial Reports</CardTitle>
              <CardDescription>
                Generate and export fee collection reports
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  onClick={() => onExportReport({ type: "collection" })}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Collection Report
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onExportReport({ type: "outstanding" })}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Outstanding Report
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onExportReport({ type: "defaulters" })}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Defaulters Report
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onExportReport({ type: "category" })}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Category-wise Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              {selectedPayment && (
                <>
                  {selectedPayment.student?.givenName}{" "}
                  {selectedPayment.student?.surname} -{" "}
                  {selectedPayment.feeStructure?.name}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-4">
              <div className="bg-muted grid grid-cols-2 gap-4 rounded p-3">
                <div>
                  <Label className="text-xs">Amount Due</Label>
                  <p className="font-bold">
                    ${selectedPayment.amountDue.toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="text-xs">Balance</Label>
                  <p className="font-bold text-red-600">
                    ${selectedPayment.balance.toLocaleString()}
                  </p>
                </div>
              </div>

              <div>
                <Label>Payment Amount</Label>
                <Input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="mt-2"
                  max={selectedPayment.balance}
                />
              </div>

              <div>
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                    <SelectItem value="online">Online Payment</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Transaction ID (Optional)</Label>
                <Input
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="Enter transaction ID"
                  className="mt-2"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPaymentDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleRecordPayment}>Record Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
