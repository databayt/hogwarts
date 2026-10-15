// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Plan an absence — a guardian (or student) tells the school ahead of time.
 * Approved intentions auto-excuse the days when attendance is marked.
 */
"use client"

import * as React from "react"
import { CalendarIcon, Check, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
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
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { formatInstant, plural } from "../overview/format"
import { getSchoolWorkingDays, submitAbsenceIntention } from "./actions"
import { countSchoolDays, DEFAULT_WORKING_DAYS } from "./school-days"
import { excuseReasonValues, type ExcuseReasonType } from "./validation"

interface SubmitFormProps {
  locale?: string
  studentId?: string // Pre-filled if viewing as parent for specific student
  students?: Array<{ id: string; name: string }> // List of students if guardian has multiple
  onSuccess?: () => void
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Dict = Record<string, any>

function startOfToday(): Date {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

export function IntentionSubmitForm({
  locale = "ar",
  studentId: initialStudentId,
  students = [],
  onSuccess,
}: SubmitFormProps) {
  const { dictionary } = useDictionary()
  const root = ((dictionary as Dict | undefined)?.attendanceToday?.intentions ??
    {}) as Dict
  const t = (root.form ?? {}) as Dict
  const errors = (t.errors ?? {}) as Dict

  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)

  const [studentId, setStudentId] = React.useState(
    initialStudentId || (students.length === 1 ? students[0].id : "")
  )
  const [dateFrom, setDateFrom] = React.useState<Date | undefined>()
  const [dateTo, setDateTo] = React.useState<Date | undefined>()
  const [reason, setReason] = React.useState<ExcuseReasonType | "">("")
  const [description, setDescription] = React.useState("")
  const [notifyTeachers, setNotifyTeachers] = React.useState(true)

  const showDate = (d: Date) =>
    formatInstant(d, locale, {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    })

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const target = studentId || initialStudentId || ""
    if (!target) return setError(errors.student ?? "Choose a student.")
    if (!dateFrom) return setError(errors.from ?? "Choose the first day.")
    if (!dateTo) return setError(errors.to ?? "Choose the last day.")
    if (!reason) return setError(errors.reason ?? "Choose a reason.")

    setSubmitting(true)
    setError(null)
    try {
      const result = await submitAbsenceIntention({
        studentId: target,
        dateFrom,
        dateTo,
        reason: reason as ExcuseReasonType,
        description: description || undefined,
        attachments: [],
        notifyTeachers,
        notifyGuardians: true,
      })
      if (result.success) {
        setSuccess(true)
        setDateFrom(undefined)
        setDateTo(undefined)
        setReason("")
        setDescription("")
        onSuccess?.()
      } else {
        setError(errors.failed ?? "It couldn't be sent. Try again.")
      }
    } catch {
      setError(errors.failed ?? "It couldn't be sent. Try again.")
    } finally {
      setSubmitting(false)
    }
  }

  // Same count the server stores — the school's own working week.
  const [workingDays, setWorkingDays] = React.useState(DEFAULT_WORKING_DAYS)
  React.useEffect(() => {
    getSchoolWorkingDays().then(setWorkingDays).catch(() => {})
  }, [])
  const daysCount = React.useMemo(
    () =>
      dateFrom && dateTo ? countSchoolDays(dateFrom, dateTo, workingDays) : 0,
    [dateFrom, dateTo, workingDays]
  )

  if (success) {
    return (
      <div className="bg-card flex flex-col items-center gap-3 rounded-2xl border px-6 py-10 text-center">
        <span className="flex size-10 items-center justify-center rounded-full bg-emerald-500/10">
          <Check className="size-5 text-emerald-600 dark:text-emerald-400" />
        </span>
        <div className="space-y-1">
          <p className="font-medium">{t.successTitle ?? "Sent"}</p>
          <p className="text-muted-foreground text-sm">
            {t.successDesc ?? "The school will review your planned absence."}
          </p>
        </div>
        <Button
          variant="ghost"
          className="rounded-full"
          onClick={() => setSuccess(false)}
        >
          {t.another ?? "Plan another"}
        </Button>
      </div>
    )
  }

  return (
    <form
      onSubmit={onSubmit}
      className="bg-card space-y-5 rounded-2xl border p-5"
      noValidate
    >
      {students.length > 1 && (
        <div className="space-y-2">
          <Label>{t.student ?? "Student"}</Label>
          <Select value={studentId} onValueChange={setStudentId}>
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={t.selectStudent ?? "Choose a student"}
              />
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

      <div className="grid gap-4 sm:grid-cols-2">
        {(
          [
            {
              key: "from",
              label: t.from ?? "First day",
              value: dateFrom,
              set: setDateFrom,
              disabled: (date: Date) => date < startOfToday(),
            },
            {
              key: "to",
              label: t.to ?? "Last day",
              value: dateTo,
              set: setDateTo,
              disabled: (date: Date) => date < (dateFrom ?? startOfToday()),
            },
          ] as const
        ).map((field) => (
          <div key={field.key} className="flex flex-col gap-2">
            <Label>{field.label}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full justify-between font-normal",
                    !field.value && "text-muted-foreground"
                  )}
                >
                  {field.value
                    ? showDate(field.value)
                    : (t.pickDate ?? "Pick a date")}
                  <CalendarIcon className="size-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={field.value}
                  onSelect={field.set}
                  disabled={field.disabled}
                  autoFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        ))}
      </div>

      {daysCount > 0 && (
        <p className="text-muted-foreground text-sm">
          {t.schoolDays ?? "School days affected"}:{" "}
          <span className="text-foreground font-medium">
            {plural(root.days, daysCount, locale)}
          </span>
        </p>
      )}

      <div className="space-y-2">
        <Label>{t.reason ?? "Reason"}</Label>
        <Select
          value={reason}
          onValueChange={(v) => setReason(v as ExcuseReasonType)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t.selectReason ?? "Choose a reason"} />
          </SelectTrigger>
          <SelectContent>
            {excuseReasonValues.map((r) => (
              <SelectItem key={r} value={r}>
                {root.reasons?.[r] ?? r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>
          {t.details ?? "Details"}{" "}
          <span className="text-muted-foreground font-normal">
            ({t.optional ?? "optional"})
          </span>
        </Label>
        <Textarea
          placeholder={t.detailsPlaceholder}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <Label htmlFor="intention-notify">
            {t.notifyTeachers ?? "Tell the teachers"}
          </Label>
          <p className="text-muted-foreground text-xs">
            {t.notifyTeachersDesc ??
              "The section's teachers get a notice about this absence."}
          </p>
        </div>
        <Switch
          id="intention-notify"
          checked={notifyTeachers}
          onCheckedChange={setNotifyTeachers}
        />
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <Button
        type="submit"
        className="w-full rounded-full"
        disabled={submitting}
      >
        {submitting && <Loader2 className="me-2 size-4 animate-spin" />}
        {submitting
          ? (t.submitting ?? "Sending…")
          : (t.submit ?? "Send to school")}
      </Button>
    </form>
  )
}
