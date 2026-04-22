"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState, useTransition } from "react"
import { toast } from "sonner"

import type {
  FeePreview,
  FeePreviewScholarshipCandidate,
} from "@/lib/fee-preview"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"

import {
  applyFeeAdjustments,
  getStudentFeeAssignments,
  type StudentFeeAssignmentSummary,
} from "./actions"

interface AdminControlsDict {
  title?: string
  description?: string
  scholarshipLabel?: string
  scholarshipNone?: string
  overrideLabel?: string
  overrideHelper?: string
  overrideReasonLabel?: string
  overrideReasonPlaceholder?: string
  waiverCheckbox?: string
  saveAdjustments?: string
  saving?: string
  savedToast?: string
  failedToast?: string
  reasonRequired?: string
  noAssignmentsYet?: string
  currentSummary?: string
  currentSummaryLine?: string
}

interface Props {
  studentId: string
  scholarships: FeePreviewScholarshipCandidate[]
  currency: string
  locale: string
  dictionary?: AdminControlsDict
}

function formatMoney(value: number, currency: string, locale: string) {
  try {
    return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value)
  } catch {
    return `${value.toFixed(2)} ${currency}`
  }
}

export function StudentFeeAdminControls({
  studentId,
  scholarships,
  currency,
  locale,
  dictionary: d = {},
}: Props) {
  const [isLoading, setIsLoading] = useState(true)
  const [assignments, setAssignments] = useState<StudentFeeAssignmentSummary[]>(
    []
  )
  const [scholarshipId, setScholarshipId] = useState<string>("none")
  const [waiver, setWaiver] = useState(false)
  const [overrideAmount, setOverrideAmount] = useState<string>("")
  const [overrideReason, setOverrideReason] = useState<string>("")
  const [isPending, startTransition] = useTransition()

  const loadAssignments = () => {
    setIsLoading(true)
    getStudentFeeAssignments(studentId)
      .then((res) => {
        if (res.success && res.data) {
          setAssignments(res.data)
          // Prefill from first assignment
          const first = res.data[0]
          if (first?.scholarshipId) setScholarshipId(first.scholarshipId)
          const existingOverride = first?.discounts.find(
            (x) => x.type === "ADMIN_OVERRIDE"
          )
          if (existingOverride) {
            setOverrideAmount(String(existingOverride.amount))
            setOverrideReason(existingOverride.reason ?? "")
          }
        }
      })
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    loadAssignments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId])

  const subtotal = assignments.reduce((s, a) => s + a.subtotal, 0)
  const showControls = assignments.length > 0

  const onWaiverChange = (checked: boolean) => {
    setWaiver(checked)
    if (checked) {
      setOverrideAmount(String(subtotal))
    } else {
      setOverrideAmount("")
    }
  }

  const onSubmit = () => {
    const parsedOverride = Number(overrideAmount)
    const hasOverride = !Number.isNaN(parsedOverride) && parsedOverride > 0
    if (hasOverride && overrideReason.trim().length < 5) {
      toast.error(d.reasonRequired || "Reason must be at least 5 characters.")
      return
    }
    startTransition(async () => {
      const res = await applyFeeAdjustments(studentId, {
        scholarshipId: scholarshipId === "none" ? null : scholarshipId,
        overrideAmount: hasOverride ? parsedOverride : null,
        overrideReason: hasOverride ? overrideReason.trim() : null,
      })
      if (res.success) {
        toast.success(d.savedToast || "Fee adjustments saved.")
        loadAssignments()
      } else {
        toast.error(d.failedToast || "Failed to save adjustments.")
      }
    })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">
          {d.title || "Admin Adjustments"}
        </CardTitle>
        <p className="text-muted-foreground text-xs">
          {d.description ||
            "Apply scholarship, waiver, or a custom override. Changes write immediately to the student's fee assignments."}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : !showControls ? (
          <Alert>
            <AlertDescription>
              {d.noAssignmentsYet ||
                "Fee assignments have not been created yet. Finish the enrollment step and return here."}
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="rounded-md border p-3 text-sm">
              <div className="text-muted-foreground mb-1 text-xs font-medium">
                {d.currentSummary || "Current summary"}
              </div>
              {assignments.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between gap-4"
                >
                  <span>{a.feeStructureName}</span>
                  <span className="tabular-nums">
                    {formatMoney(a.finalAmount, currency, locale)}
                    {a.totalDiscount > 0 && (
                      <span className="text-muted-foreground ms-2 text-xs">
                        (−{formatMoney(a.totalDiscount, currency, locale)})
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="scholarship">
                {d.scholarshipLabel || "Scholarship"}
              </Label>
              <Select
                value={scholarshipId}
                onValueChange={setScholarshipId}
                disabled={isPending}
              >
                <SelectTrigger id="scholarship">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    {d.scholarshipNone || "None"}
                  </SelectItem>
                  {scholarships.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="waiver"
                checked={waiver}
                onCheckedChange={(v) => onWaiverChange(v === true)}
                disabled={isPending}
              />
              <Label htmlFor="waiver" className="text-sm font-normal">
                {d.waiverCheckbox || "Waive all fees for this student"}
              </Label>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="override">
                {d.overrideLabel || "Override amount"}
              </Label>
              <Input
                id="override"
                type="number"
                min={0}
                step="0.01"
                value={overrideAmount}
                onChange={(e) => setOverrideAmount(e.target.value)}
                disabled={isPending || waiver}
                placeholder="0.00"
              />
              <p className="text-muted-foreground text-xs">
                {d.overrideHelper ||
                  "Absolute amount to subtract from the fee subtotal."}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="override-reason">
                {d.overrideReasonLabel || "Reason"}
              </Label>
              <Textarea
                id="override-reason"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                disabled={isPending}
                placeholder={
                  d.overrideReasonPlaceholder ||
                  "Auditable reason (min 5 characters)."
                }
                rows={2}
              />
            </div>

            <Button onClick={onSubmit} disabled={isPending} className="w-full">
              {isPending
                ? d.saving || "Saving…"
                : d.saveAdjustments || "Save Adjustments"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
