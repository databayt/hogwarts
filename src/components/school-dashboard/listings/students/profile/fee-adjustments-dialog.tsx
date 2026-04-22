"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Dialog wrapper around the admin fee-adjustments controls. Triggered from the
// student profile Fees tab; only visible when the current admin has
// `fees:approve`. Replaces the retired wizard `fees` step (issue #265).
import { useEffect, useState, useTransition } from "react"
import { Settings2 } from "lucide-react"
import { toast } from "sonner"

import type {
  FeePreview,
  FeePreviewScholarshipCandidate,
} from "@/lib/fee-preview"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"

import {
  applyFeeAdjustments,
  canApplyFeeAdjustments,
  getStudentAcademicGradeId,
  getStudentFeeAssignments,
  getStudentFeePreview,
  type StudentFeeAssignmentSummary,
} from "./fee-adjustments-actions"

interface FeeAdjustmentsDialogProps {
  studentId: string
  locale: string
  dictionary?: {
    triggerLabel?: string
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
    cancel?: string
    saving?: string
    savedToast?: string
    failedToast?: string
    reasonRequired?: string
    noAssignmentsYet?: string
    noGradeSelected?: string
    currentSummary?: string
  }
  onSaved?: () => void
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

export function FeeAdjustmentsDialog({
  studentId,
  locale,
  dictionary: d = {},
  onSaved,
}: FeeAdjustmentsDialogProps) {
  const [canApply, setCanApply] = useState(false)
  const [open, setOpen] = useState(false)
  const [academicGradeId, setAcademicGradeId] = useState<string | null>(null)
  const [preview, setPreview] = useState<FeePreview | null>(null)
  const [assignments, setAssignments] = useState<StudentFeeAssignmentSummary[]>(
    []
  )
  const [isLoading, setIsLoading] = useState(false)
  const [scholarshipId, setScholarshipId] = useState<string>("none")
  const [waiver, setWaiver] = useState(false)
  const [overrideAmount, setOverrideAmount] = useState<string>("")
  const [overrideReason, setOverrideReason] = useState<string>("")
  const [isPending, startTransition] = useTransition()

  // Gate the trigger — only admins with fees:approve see it.
  useEffect(() => {
    canApplyFeeAdjustments().then(setCanApply)
  }, [])

  // Load grade + preview + assignments when the dialog opens. Fetching the
  // grade here (instead of taking it as a prop) keeps the profile page from
  // having to thread academicGradeId through the tab tree.
  useEffect(() => {
    if (!open) return
    let cancelled = false
    setIsLoading(true)
    ;(async () => {
      const gradeRes = await getStudentAcademicGradeId(studentId)
      if (cancelled) return
      const grade =
        gradeRes.success && gradeRes.data ? gradeRes.data.academicGradeId : null
      setAcademicGradeId(grade)

      if (!grade) {
        setIsLoading(false)
        return
      }
      const [previewRes, assignRes] = await Promise.all([
        getStudentFeePreview(grade, studentId),
        getStudentFeeAssignments(studentId),
      ])
      if (cancelled) return
      if (previewRes.success && previewRes.data) setPreview(previewRes.data)
      if (assignRes.success && assignRes.data) {
        setAssignments(assignRes.data)
        const first = assignRes.data[0]
        if (first?.scholarshipId) setScholarshipId(first.scholarshipId)
        const existingOverride = first?.discounts.find(
          (x) => x.type === "ADMIN_OVERRIDE"
        )
        if (existingOverride) {
          setOverrideAmount(String(existingOverride.amount))
          setOverrideReason(existingOverride.reason ?? "")
        }
      }
      setIsLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [open, studentId])

  if (!canApply) return null

  const scholarships: FeePreviewScholarshipCandidate[] =
    preview?.scholarships ?? []
  const currency = preview?.currency ?? "USD"
  const subtotal = assignments.reduce((s, a) => s + a.subtotal, 0)
  const showControls = assignments.length > 0

  const onWaiverChange = (checked: boolean) => {
    setWaiver(checked)
    setOverrideAmount(checked ? String(subtotal) : "")
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
        setOpen(false)
        onSaved?.()
      } else {
        toast.error(d.failedToast || "Failed to save adjustments.")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings2 className="me-2 h-4 w-4" />
          {d.triggerLabel || "Adjust fees"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{d.title || "Admin Adjustments"}</DialogTitle>
          <DialogDescription>
            {d.description ||
              "Apply scholarship, waiver, or a custom override. Changes write immediately to the student's fee assignments."}
          </DialogDescription>
        </DialogHeader>

        {!academicGradeId ? (
          <Alert>
            <AlertDescription>
              {d.noGradeSelected ||
                "No academic grade assigned to this student yet."}
            </AlertDescription>
          </Alert>
        ) : isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : !showControls ? (
          <Alert>
            <AlertDescription>
              {d.noAssignmentsYet ||
                "Fee assignments have not been created yet for this student."}
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
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
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            {d.cancel || "Cancel"}
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isPending || !showControls || !academicGradeId}
          >
            {isPending ? d.saving || "Saving…" : d.saveAdjustments || "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
