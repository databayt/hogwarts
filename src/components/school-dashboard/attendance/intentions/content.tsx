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

// Get reason display label
function getReasonLabel(reason: string): string {
  const labels: Record<string, string> = {
    MEDICAL: "Medical",
    FAMILY_EMERGENCY: "Family Emergency",
    RELIGIOUS: "Religious",
    SCHOOL_ACTIVITY: "School Activity",
    TRANSPORTATION: "Transportation",
    WEATHER: "Weather",
    OTHER: "Other",
  }
  return labels[reason] || reason
}

export default function IntentionsContent({
  locale = "en",
}: IntentionsContentProps) {
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
              Absence Intentions
            </h1>
            <p className="text-muted-foreground text-sm">
              Review planned absence notifications from students and parents
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {pendingCount}
            </div>
            <p className="text-muted-foreground text-xs">Awaiting review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <Check className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {approvedCount}
            </div>
            <p className="text-muted-foreground text-xs">This period</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <X className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {rejectedCount}
            </div>
            <p className="text-muted-foreground text-xs">This period</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                {intentionStatusValues.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.charAt(0) + status.slice(1).toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Intentions List */}
      <Card>
        <CardHeader>
          <CardTitle>Intentions</CardTitle>
          <CardDescription>Pre-submitted absence notifications</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-muted-foreground py-8 text-center">
              Loading...
            </div>
          ) : intentions.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">
              <FileText className="mx-auto mb-3 h-12 w-12 opacity-50" />
              <p>No intentions found</p>
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
                        Note: {intention.reviewNotes}
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
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => handleReview(intention, "REJECTED")}
                      >
                        <X className="me-1 h-4 w-4" />
                        Reject
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
                ? "Approve Intention"
                : "Reject Intention"}
            </DialogTitle>
            <DialogDescription>
              {selectedIntention && (
                <>
                  {reviewAction === "APPROVED"
                    ? "Approve the absence intention for"
                    : "Reject the absence intention for"}{" "}
                  <strong>{selectedIntention.studentName}</strong> (
                  {formatDate(selectedIntention.dateFrom, locale)}
                  {selectedIntention.daysCount > 1 &&
                    ` - ${formatDate(selectedIntention.dateTo, locale)}`}
                  )
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">Notes (optional)</label>
            <Textarea
              className="mt-2"
              placeholder={
                reviewAction === "APPROVED"
                  ? "Any notes for the student/parent..."
                  : "Reason for rejection..."
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
              Cancel
            </Button>
            <Button
              onClick={confirmReview}
              disabled={processing}
              variant={reviewAction === "APPROVED" ? "default" : "destructive"}
            >
              {processing
                ? "Processing..."
                : reviewAction === "APPROVED"
                  ? "Approve"
                  : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
