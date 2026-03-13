// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use client"

import { useCallback, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { recordPayment } from "./actions"

interface Assignment {
  id: string
  studentName: string
  feeStructureName: string
  finalAmount: number
  totalPaid: number
  remaining: number
}

interface Props {
  lang: string
  assignments: Assignment[]
}

const PAYMENT_METHODS = [
  { value: "CASH", label: "Cash" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "CREDIT_CARD", label: "Credit Card" },
  { value: "DEBIT_CARD", label: "Debit Card" },
  { value: "UPI", label: "UPI" },
  { value: "NET_BANKING", label: "Net Banking" },
  { value: "WALLET", label: "Wallet" },
  { value: "OTHER", label: "Other" },
]

export default function PaymentForm({ lang, assignments }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedId, setSelectedId] = useState("")
  const [amount, setAmount] = useState("")
  const [amountError, setAmountError] = useState("")

  const selected = useMemo(
    () => assignments.find((a) => a.id === selectedId),
    [assignments, selectedId]
  )

  const today = useMemo(() => {
    const d = new Date()
    return d.toISOString().split("T")[0]
  }, [])

  const validateAmount = useCallback(
    (value: string) => {
      const num = parseFloat(value)
      if (!value || isNaN(num)) {
        setAmountError("Amount is required")
        return false
      }
      if (num <= 0) {
        setAmountError("Amount must be greater than 0")
        return false
      }
      if (selected && num > selected.remaining) {
        setAmountError(
          `Amount cannot exceed remaining balance (${selected.remaining.toLocaleString(undefined, { minimumFractionDigits: 2 })})`
        )
        return false
      }
      setAmountError("")
      return true
    },
    [selected]
  )

  const handleAmountChange = useCallback(
    (value: string) => {
      setAmount(value)
      if (value) validateAmount(value)
      else setAmountError("")
    },
    [validateAmount]
  )

  const handleSubmit = useCallback(
    async (formData: FormData) => {
      if (!selectedId) {
        toast.error("Please select a fee assignment")
        return
      }
      if (!validateAmount(amount)) return

      startTransition(async () => {
        const result = await recordPayment(formData)
        if (result.success) {
          toast.success("Payment recorded successfully")
          router.push(`/${lang}/finance/fees/payments`)
        } else {
          toast.error(result.error || "Failed to record payment")
        }
      })
    },
    [selectedId, amount, validateAmount, lang, router]
  )

  return (
    <form action={handleSubmit} className="space-y-6">
      {/* Fee Assignment Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Fee Assignment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="feeAssignmentId">Select Fee Assignment *</Label>
            <Select
              name="feeAssignmentId"
              value={selectedId}
              onValueChange={(v) => {
                setSelectedId(v)
                setAmount("")
                setAmountError("")
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a fee assignment" />
              </SelectTrigger>
              <SelectContent>
                {assignments.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.studentName} — {a.feeStructureName} —{" "}
                    {a.remaining.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}{" "}
                    remaining
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selected && (
            <div className="bg-muted grid gap-2 rounded-md p-4 sm:grid-cols-3">
              <div>
                <p className="text-muted-foreground text-sm">Total Amount</p>
                <p className="font-medium">
                  {selected.finalAmount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Total Paid</p>
                <p className="font-medium">
                  {selected.totalPaid.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Remaining</p>
                <p className="font-medium">
                  {selected.remaining.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Details */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount *</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              min={0.01}
              max={selected?.remaining}
              required
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0.00"
            />
            {amountError && (
              <p className="text-destructive text-sm">{amountError}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Payment Method *</Label>
            <Select name="paymentMethod" defaultValue="CASH">
              <SelectTrigger>
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentDate">Payment Date *</Label>
            <Input
              id="paymentDate"
              name="paymentDate"
              type="date"
              required
              defaultValue={today}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="transactionId">Transaction ID</Label>
            <Input
              id="transactionId"
              name="transactionId"
              placeholder="Optional reference number"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Input id="remarks" name="remarks" placeholder="Optional notes" />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending || !selectedId}>
          {isPending ? "Recording..." : "Record Payment"}
        </Button>
      </div>
    </form>
  )
}
