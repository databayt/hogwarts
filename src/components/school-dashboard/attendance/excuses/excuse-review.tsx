"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState, useTransition } from "react"
import { format } from "date-fns"
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  Loader2,
  Paperclip,
  User,
  XCircle,
} from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
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
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import {
  getExcuseById,
  getPendingExcuses,
  reviewExcuse,
} from "@/components/school-dashboard/attendance/actions"

// Fallback labels when dictionary is not loaded
const EXCUSE_REASON_FALLBACK: Record<string, string> = {
  MEDICAL: "Medical",
  FAMILY_EMERGENCY: "Family Emergency",
  RELIGIOUS: "Religious",
  SCHOOL_ACTIVITY: "School Activity",
  TRANSPORTATION: "Transportation",
  WEATHER: "Weather",
  OTHER: "Other",
}

// Map reason codes to dictionary keys
const EXCUSE_REASON_KEY_MAP: Record<string, string> = {
  MEDICAL: "medical",
  FAMILY_EMERGENCY: "familyEmergency",
  RELIGIOUS: "religious",
  SCHOOL_ACTIVITY: "schoolActivity",
  TRANSPORTATION: "transportation",
  WEATHER: "weather",
  OTHER: "other",
}

interface PendingExcuse {
  id: string
  attendanceId: string
  studentId: string
  studentName: string
  className: string
  date: string
  reason: string
  description: string | null
  attachments: string[]
  submittedBy: string
  submitterName: string | null
  submittedAt: string
}

interface ExcuseReviewListProps {
  classId?: string
  locale?: string
}

export function ExcuseReviewList({
  classId,
  locale = "en",
}: ExcuseReviewListProps) {
  const [excuses, setExcuses] = useState<PendingExcuse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedExcuse, setSelectedExcuse] = useState<PendingExcuse | null>(
    null
  )
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false)
  const [reviewNotes, setReviewNotes] = useState("")
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const { dictionary } = useDictionary()
  const t = (dictionary?.school?.attendance as any)?.excuseReview as
    | Record<string, any>
    | undefined
  const reasonsDict = t?.excuseReasons as Record<string, string> | undefined

  // Fetch pending excuses
  useEffect(() => {
    const fetchExcuses = async () => {
      setIsLoading(true)
      const result = await getPendingExcuses({ classId })
      if (result.success && result.data) {
        setExcuses(result.data.excuses)
      }
      setIsLoading(false)
    }
    fetchExcuses()
  }, [classId])

  const handleReview = (excuse: PendingExcuse) => {
    setSelectedExcuse(excuse)
    setReviewNotes("")
    setError(null)
    setIsReviewDialogOpen(true)
  }

  const handleSubmitReview = (status: "APPROVED" | "REJECTED") => {
    if (!selectedExcuse) return

    startTransition(async () => {
      const result = await reviewExcuse({
        excuseId: selectedExcuse.id,
        status,
        reviewNotes: reviewNotes || undefined,
      })

      if (result.success) {
        // Remove from list
        setExcuses((prev) => prev.filter((e) => e.id !== selectedExcuse.id))
        setIsReviewDialogOpen(false)
        setSelectedExcuse(null)
      } else {
        setError(result.error)
      }
    })
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return locale === "ar"
      ? date.toLocaleDateString(locale, {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : format(date, "PPP")
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="mt-2 h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {t?.pendingRequests || "Pending Excuse Requests"}
              </CardTitle>
              <CardDescription>
                {t?.reviewDescription ||
                  "Review excuse requests submitted by parents"}
              </CardDescription>
            </div>
            {excuses.length > 0 && (
              <Badge variant="secondary" className="px-3 py-1 text-lg">
                {excuses.length}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {excuses.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">
              <CheckCircle className="mx-auto mb-3 h-12 w-12 text-green-500 opacity-50" />
              <p>{t?.noRequests || "No pending excuse requests"}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {excuses.map((excuse) => (
                <div
                  key={excuse.id}
                  className="hover:bg-muted/50 rounded-lg border p-4 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="text-muted-foreground h-4 w-4" />
                        <span className="font-medium">
                          {excuse.studentName}
                        </span>
                        <Badge variant="outline">{excuse.className}</Badge>
                      </div>
                      <div className="text-muted-foreground flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(excuse.date)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="text-muted-foreground h-4 w-4" />
                        <Badge>
                          {reasonsDict?.[
                            EXCUSE_REASON_KEY_MAP[excuse.reason]
                          ] ||
                            EXCUSE_REASON_FALLBACK[excuse.reason] ||
                            excuse.reason}
                        </Badge>
                      </div>
                      {excuse.description && (
                        <p className="text-muted-foreground mt-2 line-clamp-2 text-sm">
                          {excuse.description}
                        </p>
                      )}
                      {excuse.attachments.length > 0 && (
                        <div className="text-muted-foreground flex items-center gap-1 text-sm">
                          <Paperclip className="h-3 w-3" />
                          <span>
                            {(
                              t?.attachmentCount || "{count} attachment(s)"
                            ).replace(
                              "{count}",
                              String(excuse.attachments.length)
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                    <Button onClick={() => handleReview(excuse)} size="sm">
                      {t?.review || "Review"}
                    </Button>
                  </div>
                  <div className="text-muted-foreground mt-2 border-t pt-2 text-xs">
                    {t?.submittedBy || "Submitted by:"}{" "}
                    {excuse.submitterName || "Unknown"} -{" "}
                    {formatDate(excuse.submittedAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent
          className="sm:max-w-[500px]"
          dir={locale === "ar" ? "rtl" : "ltr"}
        >
          <DialogHeader>
            <DialogTitle>
              {t?.reviewTitle || "Review Excuse Request"}
            </DialogTitle>
            <DialogDescription>
              {"Review the details and decide to approve or reject"}
            </DialogDescription>
          </DialogHeader>

          {selectedExcuse && (
            <div className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">
                    {t?.student || "Student:"}
                  </span>
                  <p className="font-medium">{selectedExcuse.studentName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    {t?.class || "Class:"}
                  </span>
                  <p className="font-medium">{selectedExcuse.className}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    {t?.absenceDate || "Absence Date:"}
                  </span>
                  <p className="font-medium">
                    {formatDate(selectedExcuse.date)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    {t?.reason || "Reason:"}
                  </span>
                  <p className="font-medium">
                    {reasonsDict?.[
                      EXCUSE_REASON_KEY_MAP[selectedExcuse.reason]
                    ] ||
                      EXCUSE_REASON_FALLBACK[selectedExcuse.reason] ||
                      selectedExcuse.reason}
                  </p>
                </div>
              </div>

              {selectedExcuse.description && (
                <div>
                  <span className="text-muted-foreground text-sm">
                    {t?.description || "Description:"}
                  </span>
                  <p className="bg-muted mt-1 rounded-lg p-3 text-sm">
                    {selectedExcuse.description}
                  </p>
                </div>
              )}

              {selectedExcuse.attachments.length > 0 && (
                <div>
                  <span className="text-muted-foreground text-sm">
                    {t?.attachments || "Attachments:"}
                  </span>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {selectedExcuse.attachments.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary flex items-center gap-1 text-sm hover:underline"
                      >
                        <Paperclip className="h-3 w-3" />
                        {t?.attachment || "Attachment"} {i + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <span className="text-muted-foreground text-sm">
                  {t?.reviewNotes || "Review Notes (Optional):"}
                </span>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder={
                    t?.reviewNotesPlaceholder ||
                    "Add notes about your review decision..."
                  }
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsReviewDialogOpen(false)}
              disabled={isPending}
            >
              {t?.cancel || "Cancel"}
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleSubmitReview("REJECTED")}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <XCircle className="me-2 h-4 w-4" />
                  {t?.rejectExcuse || "Reject"}
                </>
              )}
            </Button>
            <Button
              onClick={() => handleSubmitReview("APPROVED")}
              disabled={isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle className="me-2 h-4 w-4" />
                  {t?.approveExcuse || "Approve"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Compact pending excuses badge for sidebar/dashboard
interface PendingExcusesBadgeProps {
  count: number
  onClick?: () => void
}

export function PendingExcusesBadge({
  count,
  onClick,
}: PendingExcusesBadgeProps) {
  if (count === 0) return null

  return (
    <Button variant="ghost" size="sm" onClick={onClick} className="relative">
      <FileText className="h-5 w-5" />
      <Badge
        variant="destructive"
        className="absolute -end-1 -top-1 flex h-5 w-5 items-center justify-center p-0 text-xs"
      >
        {count > 9 ? "9+" : count}
      </Badge>
    </Button>
  )
}
