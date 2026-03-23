// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Absence Intentions Content Component
 *
 * Main dashboard for managing pre-absence notifications.
 * Features:
 * - List of all intentions with filtering
 * - Quick approve/reject actions
 * - Status badges and statistics
 */
"use client"

import * as React from "react"
import { CalendarClock, Check, Clock, FileText, Filter, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { getAbsenceIntentions, reviewAbsenceIntention } from "./actions"
import { intentionStatusValues } from "./validation"

interface IntentionsContentProps {
  locale?: string
  schoolId: string
}

interface Intention {
  id: string
  studentId: string
  studentName: string
  dateFrom: Date
  dateTo: Date
  daysCount: number
  reason: string
  description: string | null
  status: string
  submittedAt: Date
  reviewedAt: Date | null
  reviewNotes: string | null
}

// Format date for display
function formatDate(date: Date, locale: string): string {
  return new Date(date).toLocaleDateString(
    locale === "ar" ? "ar-SA" : "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  )
}

// Get status badge variant
function getStatusVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "APPROVED":
      return "default"
    case "REJECTED":
      return "destructive"
    case "PENDING":
    default:
      return "secondary"
  }
}

export default function IntentionsContent({
  locale = "en",
}: IntentionsContentProps) {
  const { dictionary } = useDictionary()
  const t = (dictionary?.school?.attendance as any)?.intentions as
    | Record<string, any>
    | undefined
  const reasons = t?.reasons as Record<string, string> | undefined

  const [intentions, setIntentions] = React.useState<Intention[]>([])
  const [loading, setLoading] = React.useState(true)
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL")
  const [selectedIntention, setSelectedIntention] =
    React.useState<Intention | null>(null)
  const [reviewDialogOpen, setReviewDialogOpen] = React.useState(false)
  const [reviewNotes, setReviewNotes] = React.useState("")
  const [reviewAction, setReviewAction] = React.useState<
    "APPROVED" | "REJECTED"
  >("APPROVED")
  const [processing, setProcessing] = React.useState(false)

  // Get reason display label
  function getReasonLabel(reason: string): string {
    const defaultLabels: Record<string, string> = {
      MEDICAL: "Medical",
      FAMILY_EMERGENCY: "Family Emergency",
      RELIGIOUS: "Religious",
      SCHOOL_ACTIVITY: "School Activity",
      TRANSPORTATION: "Transportation",
      WEATHER: "Weather",
      OTHER: "Other",
    }
    const key = reason.toLowerCase().replace(/_/g, "") as string
    // Try dictionary reasons first (medical, family, travel, etc.)
    if (reasons) {
      const dictKey =
        reason === "FAMILY_EMERGENCY" ? "family" : reason.toLowerCase()
      if (reasons[dictKey]) return reasons[dictKey]
    }
    return defaultLabels[reason] || reason
  }

  // Stats
  const pendingCount = intentions.filter((i) => i.status === "PENDING").length
  const approvedCount = intentions.filter((i) => i.status === "APPROVED").length
  const rejectedCount = intentions.filter((i) => i.status === "REJECTED").length

  // Fetch intentions
  const fetchIntentions = React.useCallback(async () => {
    setLoading(true)
    try {
      const filterStatus =
        statusFilter !== "ALL"
          ? (statusFilter as "PENDING" | "APPROVED" | "REJECTED")
          : undefined

      const result = await getAbsenceIntentions(
        filterStatus ? { status: filterStatus } : undefined
      )

      if (result.success && result.data) {
        setIntentions(result.data.intentions)
      }
    } catch (error) {
      console.error("Error fetching intentions:", error)
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  React.useEffect(() => {
    fetchIntentions()
  }, [fetchIntentions])

  // Handle review action
  const handleReview = (
    intention: Intention,
    action: "APPROVED" | "REJECTED"
  ) => {
    setSelectedIntention(intention)
    setReviewAction(action)
    setReviewNotes("")
    setReviewDialogOpen(true)
  }

  const confirmReview = async () => {
    if (!selectedIntention) return

    setProcessing(true)
    try {
      const result = await reviewAbsenceIntention({
        intentionId: selectedIntention.id,
        status: reviewAction,
        reviewNotes: reviewNotes || undefined,
      })

      if (result.success) {
        setReviewDialogOpen(false)
        fetchIntentions()
      }
    } catch (error) {
      console.error("Error reviewing intention:", error)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-purple-100 p-3 dark:bg-purple-900/30">
            <CalendarClock className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="scroll-m-20 text-2xl font-semibold tracking-tight">
              {t?.title || "Absence Intentions"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {t?.description ||
                "Review planned absence notifications from students and parents"}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t?.pending || "Pending"}
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {pendingCount}
            </div>
            <p className="text-muted-foreground text-xs">
              {t?.awaitingReview || "Awaiting review"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t?.approved || "Approved"}
            </CardTitle>
            <Check className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {approvedCount}
            </div>
            <p className="text-muted-foreground text-xs">
              {t?.thisPeriod || "This period"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t?.rejected || "Rejected"}
            </CardTitle>
            <X className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {rejectedCount}
            </div>
            <p className="text-muted-foreground text-xs">
              {t?.thisPeriod || "This period"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" />
            {t?.filters || "Filters"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t?.allStatuses || "All Statuses"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">
                  {t?.allStatuses || "All Statuses"}
                </SelectItem>
                <SelectItem value="PENDING">
                  {t?.statusPending || "Pending"}
                </SelectItem>
                <SelectItem value="APPROVED">
                  {t?.statusApproved || "Approved"}
                </SelectItem>
                <SelectItem value="REJECTED">
                  {t?.statusRejected || "Rejected"}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Intentions List */}
      <Card>
        <CardHeader>
          <CardTitle>{t?.intentionsLabel || "Intentions"}</CardTitle>
          <CardDescription>
            {t?.preSubmitted || "Pre-submitted absence notifications"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-muted-foreground py-8 text-center">
              {t?.loading || "Loading..."}
            </div>
          ) : intentions.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">
              <FileText className="mx-auto mb-3 h-12 w-12 opacity-50" />
              <p>{t?.noIntentions || "No intentions found"}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {intentions.map((intention) => (
                <div
                  key={intention.id}
                  className={cn(
                    "flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between",
                    intention.status === "PENDING" &&
                      "border-yellow-200 bg-yellow-50/50 dark:border-yellow-900 dark:bg-yellow-900/10"
                  )}
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">
                        {intention.studentName}
                      </span>
                      <Badge variant={getStatusVariant(intention.status)}>
                        {intention.status}
                      </Badge>
                      <Badge variant="outline">
                        {getReasonLabel(intention.reason)}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {formatDate(intention.dateFrom, locale)}
                      {intention.daysCount > 1 &&
                        ` - ${formatDate(intention.dateTo, locale)}`}
                      <span className="ms-2 text-xs">
                        ({intention.daysCount} day
                        {intention.daysCount > 1 ? "s" : ""})
                      </span>
                    </p>
                    {intention.description && (
                      <p className="text-muted-foreground text-sm">
                        {intention.description}
                      </p>
                    )}
                    {intention.reviewNotes && (
                      <p className="text-muted-foreground text-xs italic">
                        {intention.reviewNotes}
                      </p>
                    )}
                  </div>

                  {intention.status === "PENDING" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReview(intention, "APPROVED")}
                      >
                        <Check className="me-1 h-4 w-4" />
                        {t?.approve || "Approve"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => handleReview(intention, "REJECTED")}
                      >
                        <X className="me-1 h-4 w-4" />
                        {t?.reject || "Reject"}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === "APPROVED"
                ? t?.approveTitle || "Approve Intention"
                : t?.rejectTitle || "Reject Intention"}
            </DialogTitle>
            <DialogDescription>
              {selectedIntention && (
                <>
                  {reviewAction === "APPROVED"
                    ? t?.approveDescription ||
                      "Are you sure you want to approve this absence intention?"
                    : t?.rejectDescription ||
                      "Are you sure you want to reject this absence intention?"}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">
              {t?.notesOptional || "Notes (optional)"}
            </label>
            <Textarea
              className="mt-2"
              placeholder={
                t?.notesPlaceholder || "Add any notes about your decision..."
              }
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReviewDialogOpen(false)}
              disabled={processing}
            >
              {t?.cancel || "Cancel"}
            </Button>
            <Button
              onClick={confirmReview}
              disabled={processing}
              variant={reviewAction === "APPROVED" ? "default" : "destructive"}
            >
              {processing
                ? t?.processing || "Processing..."
                : reviewAction === "APPROVED"
                  ? t?.confirmApprove || "Approve"
                  : t?.confirmReject || "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
