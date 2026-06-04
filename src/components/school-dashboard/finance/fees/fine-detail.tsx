// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { formatCurrency } from "@/lib/i18n-format"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { Locale } from "@/components/internationalization/config"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { payFine, updateFine, waiveFine } from "./actions"

interface FineDetailProps {
  fine: {
    id: string
    studentName: string
    studentId: string
    fineType: string
    amount: number
    reason: string
    dueDate: string
    isPaid: boolean
    paidAmount: number | null
    paidDate: string | null
    isWaived: boolean
    waivedBy: string | null
    waivedDate: string | null
    waiverReason: string | null
    createdAt: string
  }
  lang: Locale
  currency?: string
}

const FINE_TYPE_COLORS: Record<string, string> = {
  LATE_FEE: "bg-orange-500/10 text-orange-500",
  LIBRARY_FINE: "bg-blue-500/10 text-blue-500",
  DISCIPLINE_FINE: "bg-red-500/10 text-red-500",
  DAMAGE_FINE: "bg-purple-500/10 text-purple-500",
  OTHER: "bg-gray-500/10 text-gray-500",
}

export function FineDetail({ fine, lang, currency = "USD" }: FineDetailProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [waiveDialogOpen, setWaiveDialogOpen] = useState(false)
  const [payDialogOpen, setPayDialogOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const { dictionary } = useDictionary()
  const ff = (dictionary as any)?.finance?.fineForm as
    | Record<string, string>
    | undefined
  const fc = (dictionary as any)?.finance?.common as
    | Record<string, string>
    | undefined

  const status = fine.isPaid
    ? "PAID"
    : fine.isWaived
      ? "WAIVED"
      : new Date(fine.dueDate) < new Date()
        ? "OVERDUE"
        : "PENDING"

  const statusColor: Record<string, string> = {
    PAID: "bg-green-500/10 text-green-500",
    WAIVED: "bg-blue-500/10 text-blue-500",
    OVERDUE: "bg-red-500/10 text-red-500",
    PENDING: "bg-yellow-500/10 text-yellow-500",
  }

  function handleWaive(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const reason = formData.get("waiverReason") as string

    startTransition(async () => {
      const result = await waiveFine(fine.id, reason)
      if (result.success) {
        toast.success(ff?.fineWaived || "Fine waived successfully")
        setWaiveDialogOpen(false)
        router.refresh()
      } else {
        toast.error(result.error || ff?.failedWaive || "Failed to waive fine")
      }
    })
  }

  function handlePay(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const amount = parseFloat(formData.get("amount") as string)
    const method = formData.get("paymentMethod") as string

    startTransition(async () => {
      const result = await payFine(fine.id, amount, method)
      if (result.success) {
        toast.success(ff?.finePaid || "Fine payment recorded")
        setPayDialogOpen(false)
        router.refresh()
      } else {
        toast.error(result.error || ff?.failedPay || "Failed to record payment")
      }
    })
  }

  function handleUpdate(formData: FormData) {
    startTransition(async () => {
      const result = await updateFine(fine.id, formData)
      if (result.success) {
        toast.success(ff?.fineUpdated || "Fine updated")
        setEditMode(false)
        router.refresh()
      } else {
        toast.error(result.error || ff?.failedUpdate || "Failed to update fine")
      }
    })
  }

  const isResolved = fine.isPaid || fine.isWaived

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {ff?.fineDetails || "Fine Details"}
          </h1>
          <p className="text-muted-foreground">{fine.studentName}</p>
        </div>
        <div className="flex gap-2">
          {!isResolved && (
            <>
              <Button variant="outline" onClick={() => setEditMode(!editMode)}>
                {editMode ? fc?.cancel || "Cancel" : fc?.edit || "Edit"}
              </Button>
              <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="default">
                    {ff?.recordPayment || "Record Payment"}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handlePay}>
                    <DialogHeader>
                      <DialogTitle>
                        {ff?.recordFinePayment || "Record Fine Payment"}
                      </DialogTitle>
                      <DialogDescription>
                        {ff?.recordFinePaymentDesc ||
                          "Record a payment for this fine"}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="pay-amount">
                          {ff?.amount || "Amount"}
                        </Label>
                        <Input
                          id="pay-amount"
                          name="amount"
                          type="number"
                          step="0.01"
                          min={0.01}
                          defaultValue={fine.amount}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="paymentMethod">
                          {ff?.paymentMethod || "Payment Method"}
                        </Label>
                        <Select name="paymentMethod" defaultValue="CASH">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CASH">
                              {ff?.cash || "Cash"}
                            </SelectItem>
                            <SelectItem value="BANK_TRANSFER">
                              {ff?.bankTransfer || "Bank Transfer"}
                            </SelectItem>
                            <SelectItem value="CREDIT_CARD">
                              {ff?.creditCard || "Credit Card"}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={isPending}>
                        {isPending
                          ? fc?.saving || "Saving..."
                          : ff?.confirmPayment || "Confirm Payment"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
              <Dialog open={waiveDialogOpen} onOpenChange={setWaiveDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    {ff?.waiveFine || "Waive Fine"}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleWaive}>
                    <DialogHeader>
                      <DialogTitle>
                        {ff?.waiveFineTitle || "Waive Fine"}
                      </DialogTitle>
                      <DialogDescription>
                        {ff?.waiveFineDesc ||
                          "Provide a reason for waiving this fine"}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <Label htmlFor="waiverReason">
                        {ff?.reason || "Reason"} *
                      </Label>
                      <Textarea
                        id="waiverReason"
                        name="waiverReason"
                        required
                        placeholder={
                          ff?.waiverReasonPlaceholder ||
                          "Reason for waiving this fine..."
                        }
                        rows={3}
                        className="mt-2"
                      />
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={isPending}>
                        {isPending
                          ? fc?.saving || "Saving..."
                          : ff?.confirmWaive || "Confirm Waive"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </>
          )}
          <Button
            variant="outline"
            onClick={() => router.push(`/${lang}/finance/fees/fines`)}
          >
            {fc?.back || "Back"}
          </Button>
        </div>
      </div>

      {/* Edit Mode */}
      {editMode && !isResolved ? (
        <Card>
          <CardHeader>
            <CardTitle>{ff?.editFine || "Edit Fine"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={handleUpdate} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fineType">{ff?.fineType || "Fine Type"}</Label>
                <Select name="fineType" defaultValue={fine.fineType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LATE_FEE">
                      {ff?.lateFee || "Late Fee"}
                    </SelectItem>
                    <SelectItem value="LIBRARY_FINE">
                      {ff?.libraryFine || "Library Fine"}
                    </SelectItem>
                    <SelectItem value="DISCIPLINE_FINE">
                      {ff?.disciplineFine || "Discipline Fine"}
                    </SelectItem>
                    <SelectItem value="DAMAGE_FINE">
                      {ff?.damageFine || "Damage Fine"}
                    </SelectItem>
                    <SelectItem value="OTHER">
                      {ff?.other || "Other"}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">{ff?.amount || "Amount"}</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  min={0.01}
                  defaultValue={fine.amount}
                  required
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="reason">{ff?.reason || "Reason"}</Label>
                <Textarea
                  id="reason"
                  name="reason"
                  defaultValue={fine.reason}
                  required
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">{ff?.dueDate || "Due Date"}</Label>
                <Input
                  id="dueDate"
                  name="dueDate"
                  type="date"
                  required
                  defaultValue={
                    new Date(fine.dueDate).toISOString().split("T")[0]
                  }
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={isPending}>
                  {isPending ? fc?.saving || "Saving..." : fc?.save || "Save"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        /* Detail View */
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{ff?.fineInformation || "Fine Information"}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {ff?.fineType || "Fine Type"}
                </span>
                <Badge
                  variant="outline"
                  className={FINE_TYPE_COLORS[fine.fineType] ?? ""}
                >
                  {fine.fineType === "LATE_FEE"
                    ? ff?.lateFee || "Late Fee"
                    : fine.fineType === "LIBRARY_FINE"
                      ? ff?.libraryFine || "Library Fine"
                      : fine.fineType === "DISCIPLINE_FINE"
                        ? ff?.disciplineFine || "Discipline Fine"
                        : fine.fineType === "DAMAGE_FINE"
                          ? ff?.damageFine || "Damage Fine"
                          : ff?.other || "Other"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {ff?.amount || "Amount"}
                </span>
                <span className="font-medium tabular-nums">
                  {formatCurrency(fine.amount, lang, currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {ff?.status || "Status"}
                </span>
                <Badge variant="outline" className={statusColor[status]}>
                  {status === "PAID"
                    ? ff?.statusPaid || "Paid"
                    : status === "WAIVED"
                      ? ff?.statusWaived || "Waived"
                      : status === "OVERDUE"
                        ? ff?.statusOverdue || "Overdue"
                        : ff?.statusPending || "Pending"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {ff?.dueDate || "Due Date"}
                </span>
                <span className="tabular-nums">
                  {new Date(fine.dueDate).toLocaleDateString(
                    lang === "ar" ? "ar-SA" : "en-US"
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {ff?.createdAt || "Created"}
                </span>
                <span className="tabular-nums">
                  {new Date(fine.createdAt).toLocaleDateString(
                    lang === "ar" ? "ar-SA" : "en-US"
                  )}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{ff?.reason || "Reason"}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{fine.reason}</p>
            </CardContent>
          </Card>

          {fine.isPaid && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {ff?.paymentInformation || "Payment Information"}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {ff?.paidAmount || "Paid Amount"}
                  </span>
                  <span className="font-medium tabular-nums">
                    {formatCurrency(fine.paidAmount ?? 0, lang, currency)}
                  </span>
                </div>
                {fine.paidDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {ff?.paidDate || "Paid Date"}
                    </span>
                    <span className="tabular-nums">
                      {new Date(fine.paidDate).toLocaleDateString(
                        lang === "ar" ? "ar-SA" : "en-US"
                      )}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {fine.isWaived && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {ff?.waiverInformation || "Waiver Information"}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                {fine.waiverReason && (
                  <div>
                    <span className="text-muted-foreground text-sm">
                      {ff?.waiverReason || "Waiver Reason"}
                    </span>
                    <p className="mt-1">{fine.waiverReason}</p>
                  </div>
                )}
                {fine.waivedDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {ff?.waivedDate || "Waived Date"}
                    </span>
                    <span className="tabular-nums">
                      {new Date(fine.waivedDate).toLocaleDateString(
                        lang === "ar" ? "ar-SA" : "en-US"
                      )}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
