"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import {
  ArrowRight,
  Calendar as CalendarIcon,
  CircleCheck,
  CircleX,
  Clock,
  TrendingUp,
  TriangleAlert,
  Users,
} from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Card,
  CardContent,
  CardDescription,
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import type { Batch, Student } from "../registration/types"
import type { BatchTransferRequest } from "./types"
import { batchTransferSchema, type BatchTransferFormInput } from "./validation"

interface BatchTransferProps {
  students: Student[]
  batches: Batch[]
  transfers: BatchTransferRequest[]
  onTransferRequest: (data: BatchTransferFormInput) => Promise<void>
  onApproveTransfer: (transferId: string) => Promise<void>
  onRejectTransfer: (transferId: string, reason: string) => Promise<void>
}

export function BatchTransfer({
  students,
  batches,
  transfers,
  onTransferRequest,
  onApproveTransfer,
  onRejectTransfer,
}: BatchTransferProps) {
  const { dictionary } = useDictionary()
  const t = dictionary?.messages?.toast
  const bt = dictionary?.school?.students?.enrollmentForm?.batchTransfer
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showTransferDialog, setShowTransferDialog] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [selectedTransfer, setSelectedTransfer] =
    useState<BatchTransferRequest | null>(null)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")

  const form = useForm<BatchTransferFormInput>({
    resolver: zodResolver(batchTransferSchema),
    defaultValues: {
      effectiveDate: new Date(),
    },
  })

  const pendingTransfers = transfers.filter((t) => t.status === "PENDING")
  const approvedTransfers = transfers.filter((t) => t.status === "APPROVED")
  const rejectedTransfers = transfers.filter((t) => t.status === "REJECTED")

  const handleTransferRequest = async (data: BatchTransferFormInput) => {
    try {
      setIsSubmitting(true)
      await onTransferRequest(data)
      toast.success(
        t?.success?.created || "Transfer request submitted successfully"
      )
      setShowTransferDialog(false)
      form.reset()
    } catch (error) {
      toast.error(t?.error?.createFailed || "Failed to submit transfer request")
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleApprove = async (transferId: string) => {
    try {
      await onApproveTransfer(transferId)
      toast.success(t?.success?.updated || "Transfer approved successfully")
    } catch (error) {
      toast.error(t?.error?.updateFailed || "Failed to approve transfer")
      console.error(error)
    }
  }

  const handleReject = async () => {
    if (!selectedTransfer || !rejectionReason) return

    try {
      await onRejectTransfer(selectedTransfer.id, rejectionReason)
      toast.success(t?.success?.updated || "Transfer rejected")
      setShowRejectDialog(false)
      setRejectionReason("")
      setSelectedTransfer(null)
    } catch (error) {
      toast.error(t?.error?.updateFailed || "Failed to reject transfer")
      console.error(error)
    }
  }

  const getStudentName = (studentId: string) => {
    const student = students.find((s) => s.id === studentId)
    return student
      ? `${student.firstName} ${student.lastName}`
      : bt?.unknown || "Unknown"
  }

  const getBatchName = (batchId: string) => {
    const batch = batches.find((b) => b.id === batchId)
    return batch?.name || bt?.unknown || "Unknown"
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <CircleCheck className="h-4 w-4 text-green-600" />
      case "PENDING":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "REJECTED":
        return <CircleX className="h-4 w-4 text-red-600" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800"
      case "PENDING":
        return "bg-yellow-100 text-yellow-800"
      case "REJECTED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{transfers.length}</p>
                <p className="text-muted-foreground text-sm">
                  {bt?.totalTransfers || "Total Transfers"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{pendingTransfers.length}</p>
                <p className="text-muted-foreground text-sm">
                  {bt?.pending || "Pending"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CircleCheck className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{approvedTransfers.length}</p>
                <p className="text-muted-foreground text-sm">
                  {bt?.approved || "Approved"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CircleX className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{rejectedTransfers.length}</p>
                <p className="text-muted-foreground text-sm">
                  {bt?.rejected || "Rejected"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Transfers */}
      {pendingTransfers.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {bt?.pendingRequests || "Pending Transfer Requests"}
                </CardTitle>
                <CardDescription>
                  {bt?.pendingDescription ||
                    "Review and approve or reject batch transfer requests"}
                </CardDescription>
              </div>
              <Badge
                variant="secondary"
                className="bg-yellow-100 text-yellow-800"
              >
                {pendingTransfers.length} {bt?.pending || "Pending"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{bt?.student || "Student"}</TableHead>
                  <TableHead>{bt?.fromBatch || "From Batch"}</TableHead>
                  <TableHead>{bt?.toBatch || "To Batch"}</TableHead>
                  <TableHead>{bt?.reason || "Reason"}</TableHead>
                  <TableHead>{bt?.requestedOn || "Requested On"}</TableHead>
                  <TableHead>{bt?.effectiveDate || "Effective Date"}</TableHead>
                  <TableHead>{bt?.actions || "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingTransfers.map((transfer) => (
                  <TableRow key={transfer.id}>
                    <TableCell className="font-medium">
                      {getStudentName(transfer.studentId)}
                    </TableCell>
                    <TableCell>{getBatchName(transfer.fromBatchId)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getBatchName(transfer.toBatchId)}
                        <ArrowRight className="text-muted-foreground h-4 w-4 rtl:rotate-180" />
                      </div>
                    </TableCell>
                    <TableCell
                      className="max-w-xs truncate"
                      title={transfer.reason}
                    >
                      {transfer.reason}
                    </TableCell>
                    <TableCell>
                      {format(new Date(transfer.requestDate), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell>
                      {transfer.effectiveDate &&
                        format(new Date(transfer.effectiveDate), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApprove(transfer.id)}
                        >
                          {bt?.approve || "Approve"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedTransfer(transfer)
                            setShowRejectDialog(true)
                          }}
                        >
                          {bt?.reject || "Reject"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* New Transfer Request */}
      <Card>
        <CardHeader>
          <CardTitle>{bt?.newTransfer || "New Transfer Request"}</CardTitle>
          <CardDescription>
            {bt?.newTransferDescription ||
              "Initiate a batch transfer for a student"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setShowTransferDialog(true)}>
            <TrendingUp className="me-2 h-4 w-4" />
            {bt?.requestTransfer || "Request Transfer"}
          </Button>
        </CardContent>
      </Card>

      {/* Transfer History */}
      <Card>
        <CardHeader>
          <CardTitle>{bt?.transferHistory || "Transfer History"}</CardTitle>
          <CardDescription>
            {bt?.transferHistoryDescription || "All batch transfer records"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{bt?.student || "Student"}</TableHead>
                <TableHead>{bt?.transfer || "Transfer"}</TableHead>
                <TableHead>{bt?.status || "Status"}</TableHead>
                <TableHead>{bt?.requestDate || "Request Date"}</TableHead>
                <TableHead>{bt?.approvedBy || "Approved By"}</TableHead>
                <TableHead>{bt?.effectiveDate || "Effective Date"}</TableHead>
                <TableHead>{bt?.reason || "Reason"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transfers.map((transfer) => (
                <TableRow key={transfer.id}>
                  <TableCell className="font-medium">
                    {getStudentName(transfer.studentId)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">
                        {getBatchName(transfer.fromBatchId)}
                      </span>
                      <ArrowRight className="h-3 w-3 rtl:rotate-180" />
                      <span>{getBatchName(transfer.toBatchId)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(transfer.status)}
                      <Badge
                        variant="secondary"
                        className={getStatusColor(transfer.status)}
                      >
                        {transfer.status}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(transfer.requestDate), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell>{transfer.approvedBy || "-"}</TableCell>
                  <TableCell>
                    {transfer.effectiveDate
                      ? format(new Date(transfer.effectiveDate), "dd MMM yyyy")
                      : "-"}
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <span
                      className="text-muted-foreground truncate text-sm"
                      title={transfer.reason}
                    >
                      {transfer.reason}
                    </span>
                    {transfer.rejectionReason && (
                      <p className="mt-1 text-xs text-red-600">
                        {bt?.rejectedPrefix || "Rejected:"}{" "}
                        {transfer.rejectionReason}
                      </p>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Transfer Request Dialog */}
      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {bt?.requestDialog || "Request Batch Transfer"}
            </DialogTitle>
            <DialogDescription>
              {bt?.requestDialogDescription ||
                "Submit a request to transfer a student to a different batch"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleTransferRequest)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="studentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{bt?.student || "Student"}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={bt?.selectStudent || "Select student"}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {students.map((student) => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.firstName} {student.lastName}
                            {student.grNumber && ` (${student.grNumber})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fromBatchId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {bt?.currentBatch || "Current Batch"}
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                bt?.selectCurrentBatch || "Select current batch"
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {batches.map((batch) => (
                            <SelectItem key={batch.id} value={batch.id}>
                              {batch.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="toBatchId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{bt?.newBatch || "New Batch"}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                bt?.selectNewBatch || "Select new batch"
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {batches.map((batch) => (
                            <SelectItem key={batch.id} value={batch.id}>
                              {batch.name} ({batch.currentStrength}/
                              {batch.maxCapacity})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {bt?.selectBatchDescription ||
                          "Select the batch to transfer the student to"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {bt?.reasonForTransfer || "Reason for Transfer"}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={
                          bt?.reasonPlaceholder ||
                          "Provide a detailed reason for the transfer request..."
                        }
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {bt?.minCharacters || "Minimum 10 characters required"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="effectiveDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {bt?.effectiveDateLabel || "Effective Date"}
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-start font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="me-2 h-4 w-4" />
                            {field.value
                              ? format(field.value, "PPP")
                              : bt?.pickDate || "Pick a date"}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          autoFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      {bt?.effectiveDateDescription ||
                        "When the transfer should take effect"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowTransferDialog(false)}
                >
                  {bt?.cancel || "Cancel"}
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && (
                    <CircleCheck className="me-2 h-4 w-4 animate-spin" />
                  )}
                  {bt?.submitRequest || "Submit Transfer Request"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Reject Transfer Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {bt?.rejectDialog || "Reject Transfer Request"}
            </DialogTitle>
            <DialogDescription>
              {bt?.rejectDialogDescription ||
                "Provide a reason for rejecting this transfer request"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedTransfer && (
              <Alert>
                <TriangleAlert className="h-4 w-4" />
                <AlertTitle>
                  {bt?.transferDetails || "Transfer Details"}
                </AlertTitle>
                <AlertDescription>
                  {bt?.studentLabel || "Student:"}{" "}
                  {getStudentName(selectedTransfer.studentId)}
                  <br />
                  {bt?.fromLabel || "From:"}{" "}
                  {getBatchName(selectedTransfer.fromBatchId)}
                  <br />
                  {bt?.toLabel || "To:"}{" "}
                  {getBatchName(selectedTransfer.toBatchId)}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {bt?.rejectionReason || "Rejection Reason"}
              </label>
              <Textarea
                placeholder={
                  bt?.rejectionPlaceholder || "Enter reason for rejection..."
                }
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
            >
              {bt?.cancel || "Cancel"}
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectionReason}
            >
              {bt?.rejectTransfer || "Reject Transfer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
