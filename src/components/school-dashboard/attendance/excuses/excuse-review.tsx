"use client"

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
import {
  getExcuseById,
  getPendingExcuses,
  reviewExcuse,
} from "@/components/school-dashboard/attendance/actions"

// Excuse reason labels
const EXCUSE_REASON_LABELS: Record<string, { en: string; ar: string }> = {
  MEDICAL: { en: "Medical", ar: "طبي" },
  FAMILY_EMERGENCY: { en: "Family Emergency", ar: "طوارئ عائلية" },
  RELIGIOUS: { en: "Religious", ar: "ديني" },
  SCHOOL_ACTIVITY: { en: "School Activity", ar: "نشاط مدرسي" },
  TRANSPORTATION: { en: "Transportation", ar: "مواصلات" },
  WEATHER: { en: "Weather", ar: "طقس" },
  OTHER: { en: "Other", ar: "أخرى" },
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

  const isArabic = locale === "ar"

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
    return isArabic
      ? date.toLocaleDateString("ar-SA", {
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
                {isArabic ? "طلبات الأعذار المعلقة" : "Pending Excuse Requests"}
              </CardTitle>
              <CardDescription>
                {isArabic
                  ? "راجع طلبات الأعذار المقدمة من أولياء الأمور"
                  : "Review excuse requests submitted by parents"}
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
              <p>
                {isArabic
                  ? "لا توجد طلبات أعذار معلقة"
                  : "No pending excuse requests"}
              </p>
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
                          {EXCUSE_REASON_LABELS[excuse.reason]?.[
                            isArabic ? "ar" : "en"
                          ] || excuse.reason}
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
                            {excuse.attachments.length}{" "}
                            {isArabic ? "مرفق" : "attachment(s)"}
                          </span>
                        </div>
                      )}
                    </div>
                    <Button onClick={() => handleReview(excuse)} size="sm">
                      {isArabic ? "مراجعة" : "Review"}
                    </Button>
                  </div>
                  <div className="text-muted-foreground mt-2 border-t pt-2 text-xs">
                    {isArabic ? "مقدم من:" : "Submitted by:"}{" "}
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
          dir={isArabic ? "rtl" : "ltr"}
        >
          <DialogHeader>
            <DialogTitle>
              {isArabic ? "مراجعة طلب العذر" : "Review Excuse Request"}
            </DialogTitle>
            <DialogDescription>
              {isArabic
                ? "راجع التفاصيل وقرر الموافقة أو الرفض"
                : "Review the details and decide to approve or reject"}
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
                    {isArabic ? "الطالب:" : "Student:"}
                  </span>
                  <p className="font-medium">{selectedExcuse.studentName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    {isArabic ? "الفصل:" : "Class:"}
                  </span>
                  <p className="font-medium">{selectedExcuse.className}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    {isArabic ? "تاريخ الغياب:" : "Absence Date:"}
                  </span>
                  <p className="font-medium">
                    {formatDate(selectedExcuse.date)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    {isArabic ? "السبب:" : "Reason:"}
                  </span>
                  <p className="font-medium">
                    {EXCUSE_REASON_LABELS[selectedExcuse.reason]?.[
                      isArabic ? "ar" : "en"
                    ] || selectedExcuse.reason}
                  </p>
                </div>
              </div>

              {selectedExcuse.description && (
                <div>
                  <span className="text-muted-foreground text-sm">
                    {isArabic ? "الوصف:" : "Description:"}
                  </span>
                  <p className="bg-muted mt-1 rounded-lg p-3 text-sm">
                    {selectedExcuse.description}
                  </p>
                </div>
              )}

              {selectedExcuse.attachments.length > 0 && (
                <div>
                  <span className="text-muted-foreground text-sm">
                    {isArabic ? "المرفقات:" : "Attachments:"}
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
                        {isArabic ? `مرفق ${i + 1}` : `Attachment ${i + 1}`}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <span className="text-muted-foreground text-sm">
                  {isArabic
                    ? "ملاحظات المراجعة (اختياري):"
                    : "Review Notes (Optional):"}
                </span>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder={
                    isArabic
                      ? "أضف ملاحظات للمراجعة..."
                      : "Add notes for the review..."
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
              {isArabic ? "إلغاء" : "Cancel"}
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
                  {isArabic ? "رفض" : "Reject"}
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
                  {isArabic ? "موافقة" : "Approve"}
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
        className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center p-0 text-xs"
      >
        {count > 9 ? "9+" : count}
      </Badge>
    </Button>
  )
}
