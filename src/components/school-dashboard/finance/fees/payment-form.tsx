// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use client"

import { useCallback, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { formatCurrency } from "@/lib/i18n-format"
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
import type { Locale } from "@/components/internationalization/config"
import { useDictionary } from "@/components/internationalization/use-dictionary"

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

const getPaymentMethods = (pf?: Record<string, string>) => [
  { value: "CASH", label: pf?.cash || "Cash" },
  { value: "CHEQUE", label: pf?.cheque || "Cheque" },
  { value: "BANK_TRANSFER", label: pf?.bankTransfer || "Bank Transfer" },
  { value: "CREDIT_CARD", label: pf?.creditCard || "Credit Card" },
  { value: "DEBIT_CARD", label: pf?.debitCard || "Debit Card" },
  { value: "UPI", label: pf?.upi || "UPI" },
  { value: "NET_BANKING", label: pf?.netBanking || "Net Banking" },
  { value: "WALLET", label: pf?.wallet || "Wallet" },
  { value: "OTHER", label: pf?.other || "Other" },
]

export default function PaymentForm({ lang, assignments }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const { dictionary } = useDictionary()
  const pf = (dictionary as any)?.finance?.paymentForm as
    | Record<string, string>
    | undefined
  const fc = (dictionary as any)?.finance?.common as
    | Record<string, string>
    | undefined
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
        setAmountError(pf?.amountIsRequired || "Amount is required")
        return false
      }
      if (num <= 0) {
        setAmountError(
          pf?.amountMustBePositive || "Amount must be greater than 0"
        )
        return false
      }
      if (selected && num > selected.remaining) {
        setAmountError(
          (
            pf?.amountExceedsRemaining ||
            "Amount cannot exceed remaining balance ({amount})"
          ).replace(
            "{amount}",
            formatCurrency(selected.remaining, lang as Locale)
          )
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
        toast.error(
          pf?.selectAssignmentFirst || "Please select a fee assignment"
        )
        return
      }
      if (!validateAmount(amount)) return

      startTransition(async () => {
        const result = await recordPayment(formData)
        if (result.success) {
          toast.success(
            pf?.paymentRecordedSuccessfully || "Payment recorded successfully"
          )
          router.push(`/${lang}/finance/fees/payments`)
        } else {
          toast.error(
            result.error ||
              pf?.failedRecordPayment ||
              "Failed to record payment"
          )
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
          <CardTitle>{pf?.feeAssignment || "Fee Assignment"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="feeAssignmentId">
              {pf?.selectFeeAssignment || "Select Fee Assignment *"}
            </Label>
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
                <SelectValue
                  placeholder={
                    pf?.selectFeeAssignmentPlaceholder ||
                    "Select a fee assignment"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {assignments.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.studentName} — {a.feeStructureName} —{" "}
                    {formatCurrency(a.remaining, lang as Locale)}{" "}
                    {pf?.remaining || "remaining"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selected && (
            <div className="bg-muted grid gap-2 rounded-md p-4 sm:grid-cols-3">
              <div>
                <p className="text-muted-foreground text-sm">
                  {pf?.totalAmount || "Total Amount"}
                </p>
                <p className="font-medium">
                  {formatCurrency(selected.finalAmount, lang as Locale)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">
                  {pf?.totalPaid || "Total Paid"}
                </p>
                <p className="font-medium">
                  {formatCurrency(selected.totalPaid, lang as Locale)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">
                  {pf?.remainingBalance || "Remaining"}
                </p>
                <p className="font-medium">
                  {formatCurrency(selected.remaining, lang as Locale)}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Details */}
      <Card>
        <CardHeader>
          <CardTitle>{pf?.paymentDetails || "Payment Details"}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="amount">{pf?.amountRequired || "Amount *"}</Label>
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
              placeholder={pf?.amountPlaceholder || "0.00"}
            />
            {amountError && (
              <p className="text-destructive text-sm">{amountError}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentMethod">
              {pf?.paymentMethod || "Payment Method *"}
            </Label>
            <Select name="paymentMethod" defaultValue="CASH">
              <SelectTrigger>
                <SelectValue
                  placeholder={pf?.selectMethod || "Select method"}
                />
              </SelectTrigger>
              <SelectContent>
                {getPaymentMethods(pf).map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentDate">
              {pf?.paymentDate || "Payment Date *"}
            </Label>
            <Input
              id="paymentDate"
              name="paymentDate"
              type="date"
              required
              defaultValue={today}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="transactionId">
              {pf?.transactionId || "Transaction ID"}
            </Label>
            <Input
              id="transactionId"
              name="transactionId"
              placeholder={
                pf?.optionalReferenceNumber || "Optional reference number"
              }
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="remarks">{pf?.remarks || "Remarks"}</Label>
            <Input
              id="remarks"
              name="remarks"
              placeholder={pf?.optionalNotes || "Optional notes"}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          {fc?.cancel || "Cancel"}
        </Button>
        <Button type="submit" disabled={isPending || !selectedId}>
          {isPending
            ? pf?.recording || "Recording..."
            : pf?.recordPayment || "Record Payment"}
        </Button>
      </div>
    </form>
  )
}
