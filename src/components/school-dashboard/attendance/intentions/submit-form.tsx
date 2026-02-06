/**
 * Absence Intention Submit Form
 *
 * Form for students/parents to submit planned absence notifications.
 */
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { CalendarIcon, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

import { submitAbsenceIntention } from "./actions"
import { excuseReasonValues, type ExcuseReasonType } from "./validation"

interface SubmitFormProps {
  locale?: string
  studentId?: string // Pre-filled if viewing as parent for specific student
  students?: Array<{ id: string; name: string }> // List of students if guardian has multiple
  onSuccess?: () => void
}

// Reason labels
const reasonLabels: Record<string, { en: string; ar: string }> = {
  MEDICAL: { en: "Medical", ar: "طبي" },
  FAMILY_EMERGENCY: { en: "Family Emergency", ar: "طوارئ عائلية" },
  RELIGIOUS: { en: "Religious", ar: "ديني" },
  SCHOOL_ACTIVITY: { en: "School Activity", ar: "نشاط مدرسي" },
  TRANSPORTATION: { en: "Transportation", ar: "مواصلات" },
  WEATHER: { en: "Weather", ar: "طقس" },
  OTHER: { en: "Other", ar: "أخرى" },
}

export function IntentionSubmitForm({
  locale = "en",
  studentId: initialStudentId,
  students = [],
  onSuccess,
}: SubmitFormProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)

  // Form state
  const [studentId, setStudentId] = React.useState(initialStudentId || "")
  const [dateFrom, setDateFrom] = React.useState<Date | undefined>()
  const [dateTo, setDateTo] = React.useState<Date | undefined>()
  const [reason, setReason] = React.useState<ExcuseReasonType | "">("")
  const [description, setDescription] = React.useState("")
  const [notifyTeachers, setNotifyTeachers] = React.useState(true)
  const [notifyGuardians, setNotifyGuardians] = React.useState(true)

  const isRTL = locale === "ar"

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Basic validation
    if (!studentId && students.length === 0) {
      setError("Student is required")
      return
    }
    if (!dateFrom) {
      setError("Start date is required")
      return
    }
    if (!dateTo) {
      setError("End date is required")
      return
    }
    if (!reason) {
      setError("Reason is required")
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const result = await submitAbsenceIntention({
        studentId: studentId || initialStudentId || "",
        dateFrom,
        dateTo,
        reason: reason as ExcuseReasonType,
        description: description || undefined,
        attachments: [],
        notifyTeachers,
        notifyGuardians,
      })

      if (result.success) {
        setSuccess(true)
        // Reset form
        setDateFrom(undefined)
        setDateTo(undefined)
        setReason("")
        setDescription("")
        onSuccess?.()
        // Refresh after success
        setTimeout(() => {
          router.refresh()
        }, 2000)
      } else {
        setError(result.error)
      }
    } catch {
      setError("An unexpected error occurred")
    } finally {
      setSubmitting(false)
    }
  }

  // Calculate days count when dates change
  const daysCount = React.useMemo(() => {
    if (!dateFrom || !dateTo) return 0
    let count = 0
    const current = new Date(dateFrom)
    const end = new Date(dateTo)
    while (current <= end) {
      const day = current.getDay()
      if (day !== 0 && day !== 6) count++
      current.setDate(current.getDate() + 1)
    }
    return count
  }, [dateFrom, dateTo])

  if (success) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <svg
                className="h-6 w-6 text-green-600 dark:text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold">Intention Submitted</h3>
            <p className="text-muted-foreground text-sm">
              Your absence intention has been submitted and is awaiting review.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit Absence Intention</CardTitle>
        <CardDescription>
          Notify the school about a planned absence in advance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          {/* Student Selection (if multiple students) */}
          {students.length > 0 && (
            <div className="space-y-2">
              <Label>Student</Label>
              <Select value={studentId} onValueChange={setStudentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Date Range */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full ps-3 text-start font-normal",
                      !dateFrom && "text-muted-foreground"
                    )}
                  >
                    {dateFrom ? (
                      dateFrom.toLocaleDateString(isRTL ? "ar-SA" : "en-US")
                    ) : (
                      <span>Pick a date</span>
                    )}
                    <CalendarIcon className="ms-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    disabled={(date) => {
                      const today = new Date()
                      today.setHours(0, 0, 0, 0)
                      return date < today
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-col space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full ps-3 text-start font-normal",
                      !dateTo && "text-muted-foreground"
                    )}
                  >
                    {dateTo ? (
                      dateTo.toLocaleDateString(isRTL ? "ar-SA" : "en-US")
                    ) : (
                      <span>Pick a date</span>
                    )}
                    <CalendarIcon className="ms-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    disabled={(date) => {
                      if (dateFrom) return date < dateFrom
                      const today = new Date()
                      today.setHours(0, 0, 0, 0)
                      return date < today
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Days count indicator */}
          {daysCount > 0 && (
            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              School days affected: <strong>{daysCount}</strong>{" "}
              {daysCount === 1 ? "day" : "days"}
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label>Reason</Label>
            <Select
              value={reason}
              onValueChange={(v) => setReason(v as ExcuseReasonType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                {excuseReasonValues.map((r) => (
                  <SelectItem key={r} value={r}>
                    {reasonLabels[r][isRTL ? "ar" : "en"]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>
              Additional Details{" "}
              <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              placeholder="Provide any additional information that may be helpful..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Notification Preferences */}
          <div className="space-y-4">
            <div className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label className="text-base">Notify Teachers</Label>
                <p className="text-muted-foreground text-sm">
                  Automatically notify homeroom teachers about this absence
                </p>
              </div>
              <Switch
                checked={notifyTeachers}
                onCheckedChange={setNotifyTeachers}
              />
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Submit button */}
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {submitting ? "Submitting..." : "Submit Intention"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
