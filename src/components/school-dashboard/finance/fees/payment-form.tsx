// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use client"

import { useCallback, useEffect, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Check, ChevronsUpDown } from "lucide-react"
import { toast } from "sonner"

import { formatCurrency } from "@/lib/i18n-format"
import { actionErrorMessage } from "@/lib/resolve-action-error"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { SuccessToast } from "@/components/atom/toast"
import type { Locale } from "@/components/internationalization/config"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { recordPayment, searchPayableAssignments } from "./actions"

export interface PayableAssignment {
  id: string
  studentName: string
  feeStructureName: string
  status: string
  finalAmount: number
  totalPaid: number
  remaining: number
}

interface Props {
  lang: string
  /** The newest payable assignments; the picker searches the rest. */
  assignments: PayableAssignment[]
  currency?: string
  /** `?assignment=` — the assignments table's "Record payment". */
  preselectedId?: string
}

const getPaymentMethods = (pf?: Record<string, string>) => [
  { value: "CASH", label: pf?.cash || "Cash" },
  { value: "CHEQUE", label: pf?.cheque || "Cheque" },
  { value: "BANK_TRANSFER", label: pf?.bankTransfer || "Bank Transfer" },
  // P2.2 — ATM deposit, sits next to bank transfer in the dropdown so admins
  // recognise it as an offline reference-capture flow.
  { value: "ATM_DEPOSIT", label: pf?.atmDeposit || "ATM Deposit" },
  { value: "CREDIT_CARD", label: pf?.creditCard || "Credit Card" },
  { value: "DEBIT_CARD", label: pf?.debitCard || "Debit Card" },
  // P1.4 + P3.4 — wallets + Gulf rails added in the enum and surfaced here
  // so admins can manually record an in-person Apple Pay / mada / KNET
  // sale (e.g. a parent who paid at the school terminal).
  { value: "APPLE_PAY", label: pf?.applePay || "Apple Pay" },
  { value: "GOOGLE_PAY", label: pf?.googlePay || "Google Pay" },
  { value: "MADA", label: pf?.mada || "mada" },
  { value: "KNET", label: pf?.knet || "KNET" },
  { value: "UPI", label: pf?.upi || "UPI" },
  { value: "NET_BANKING", label: pf?.netBanking || "Net Banking" },
  { value: "WALLET", label: pf?.wallet || "Wallet" },
  { value: "OTHER", label: pf?.other || "Other" },
]

// P2.1 — Offline methods that land in PENDING_VERIFICATION on record and
// surface the deposit-slip + bank fields so admins can capture the
// reconciliation evidence. Keep this in lockstep with the server-side set
// in `recordPayment` (fees/actions.ts).
const OFFLINE_METHODS = new Set(["BANK_TRANSFER", "CHEQUE", "ATM_DEPOSIT"])

export default function PaymentForm({
  lang,
  assignments,
  currency = "USD",
  preselectedId,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const { dictionary } = useDictionary()
  const pf = (dictionary as any)?.finance?.paymentForm as
    | Record<string, string>
    | undefined
  const fc = (dictionary as any)?.finance?.common as
    | Record<string, string>
    | undefined
  const [selected, setSelected] = useState<PayableAssignment | undefined>(() =>
    assignments.find((a) => a.id === preselectedId)
  )
  const selectedId = selected?.id ?? ""
  const [pickerOpen, setPickerOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [options, setOptions] = useState(assignments)
  const [searching, setSearching] = useState(false)
  // cmdk's highlighted item. Async results replace the list, which clears
  // cmdk's own pick — without this, Enter does nothing after a search.
  const [active, setActive] = useState("")
  const [amount, setAmount] = useState("")
  const [amountError, setAmountError] = useState("")
  // P2.1 — controlled paymentMethod so we can conditionally render the
  // offline reference + deposit-slip fields without a re-mount.
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH")
  const requiresVerification = OFFLINE_METHODS.has(paymentMethod)

  // Server search, debounced; an empty box goes back to the first page.
  useEffect(() => {
    const term = search.trim()
    if (!term) {
      setOptions(assignments)
      setActive(assignments[0]?.id ?? "")
      setSearching(false)
      return
    }
    let alive = true
    setSearching(true)
    const timer = setTimeout(() => {
      searchPayableAssignments(term).then((rows) => {
        if (!alive) return
        setOptions(rows)
        setActive(rows[0]?.id ?? "")
        setSearching(false)
      })
    }, 250)
    return () => {
      alive = false
      clearTimeout(timer)
    }
  }, [search, assignments])

  const optionLabel = (a: PayableAssignment) =>
    `${a.studentName} — ${a.feeStructureName} — ${formatCurrency(
      a.remaining,
      lang as Locale,
      currency
    )} ${pf?.remaining || "remaining"}`

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
            formatCurrency(selected.remaining, lang as Locale, currency)
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
          SuccessToast(
            pf?.paymentRecordedSuccessfully || "Payment recorded successfully"
          )
          router.push(`/${lang}/finance/fees/payments`)
        } else {
          toast.error(
            actionErrorMessage(
              result.error,
              dictionary,
              pf?.failedRecordPayment || "Failed to record payment"
            )
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
            <input type="hidden" name="feeAssignmentId" value={selectedId} />
            <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="feeAssignmentId"
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={pickerOpen}
                  className="w-full justify-between font-normal"
                >
                  <span className="truncate">
                    {selected ? (
                      <bdi dir="auto">{optionLabel(selected)}</bdi>
                    ) : (
                      <span className="text-muted-foreground">
                        {pf?.selectFeeAssignmentPlaceholder ||
                          "Select a fee assignment"}
                      </span>
                    )}
                  </span>
                  <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-(--radix-popover-trigger-width) p-0"
                align="start"
              >
                {/* The server filters; cmdk must not filter the page again. */}
                <Command
                  shouldFilter={false}
                  value={active}
                  onValueChange={setActive}
                >
                  <CommandInput
                    value={search}
                    onValueChange={setSearch}
                    placeholder={
                      pf?.searchAssignment || "Search by student or fee…"
                    }
                  />
                  <CommandList>
                    {!searching && (
                      <CommandEmpty>
                        {pf?.noMatchingAssignments || "No open fee matches."}
                      </CommandEmpty>
                    )}
                    <CommandGroup>
                      {options.map((a) => (
                        <CommandItem
                          key={a.id}
                          value={a.id}
                          onSelect={() => {
                            setSelected(a)
                            setAmount("")
                            setAmountError("")
                            setPickerOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              "size-4",
                              a.id === selectedId ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <bdi
                            dir="auto"
                            className={cn(
                              "truncate",
                              a.status === "OVERDUE" && "text-destructive"
                            )}
                          >
                            {optionLabel(a)}
                          </bdi>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {selected && (
            <div className="bg-muted grid gap-2 rounded-md p-4 sm:grid-cols-3">
              <div>
                <p className="text-muted-foreground text-sm">
                  {pf?.totalAmount || "Total Amount"}
                </p>
                <p className="font-medium">
                  {formatCurrency(
                    selected.finalAmount,
                    lang as Locale,
                    currency
                  )}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">
                  {pf?.totalPaid || "Total Paid"}
                </p>
                <p className="font-medium">
                  {formatCurrency(selected.totalPaid, lang as Locale, currency)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">
                  {pf?.remainingBalance || "Remaining"}
                </p>
                <p className="font-medium">
                  {formatCurrency(selected.remaining, lang as Locale, currency)}
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
            <Select
              name="paymentMethod"
              value={paymentMethod}
              onValueChange={setPaymentMethod}
            >
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
              {requiresVerification
                ? pf?.transferReference || "Transfer Reference *"
                : pf?.transactionId || "Transaction ID"}
            </Label>
            <Input
              id="transactionId"
              name="transactionId"
              required={requiresVerification}
              placeholder={
                requiresVerification
                  ? pf?.transferReferencePlaceholder ||
                    "Bank reference / ATM receipt number"
                  : pf?.optionalReferenceNumber || "Optional reference number"
              }
            />
          </div>

          {/* P2.1 + P2.2 — Offline bank-transfer + ATM-deposit + cheque
              capture. Admin attaches a deposit slip + bank details so the
              reconciliation report can match the entry to the bank
              statement before `markPaymentCleared` posts to the ledger. */}
          {requiresVerification && (
            <>
              <div className="space-y-2">
                <Label htmlFor="bankName">
                  {pf?.bankName || "Bank Name *"}
                </Label>
                <Input
                  id="bankName"
                  name="bankName"
                  required
                  placeholder={pf?.bankNamePlaceholder || "e.g. Emirates NBD"}
                />
              </div>

              {paymentMethod !== "ATM_DEPOSIT" && (
                <div className="space-y-2">
                  <Label htmlFor="depositBankBranch">
                    {pf?.bankBranch || "Branch"}
                  </Label>
                  <Input
                    id="depositBankBranch"
                    name="depositBankBranch"
                    placeholder={
                      pf?.bankBranchPlaceholder || "Branch name or code"
                    }
                  />
                </div>
              )}

              {paymentMethod === "BANK_TRANSFER" && (
                <div className="space-y-2">
                  <Label htmlFor="depositorIban">
                    {pf?.depositorIban || "Sender IBAN"}
                  </Label>
                  <Input
                    id="depositorIban"
                    name="depositorIban"
                    placeholder={pf?.ibanPlaceholder || "AE07 0331 ..."}
                  />
                </div>
              )}

              {paymentMethod === "CHEQUE" && (
                <div className="space-y-2">
                  <Label htmlFor="chequeNumber">
                    {pf?.chequeNumber || "Cheque Number *"}
                  </Label>
                  <Input
                    id="chequeNumber"
                    name="chequeNumber"
                    required
                    placeholder={pf?.chequeNumberPlaceholder || "e.g. 000123"}
                  />
                </div>
              )}

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="depositSlipUrl">
                  {pf?.depositSlip || "Deposit Slip URL"}
                </Label>
                <Input
                  id="depositSlipUrl"
                  name="depositSlipUrl"
                  type="url"
                  placeholder={
                    pf?.depositSlipPlaceholder ||
                    "https://... (upload to S3 then paste URL)"
                  }
                />
                <p className="text-muted-foreground text-xs">
                  {pf?.depositSlipHint ||
                    "Status will be Pending Verification until an admin reconciles against the bank statement."}
                </p>
              </div>
            </>
          )}

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
