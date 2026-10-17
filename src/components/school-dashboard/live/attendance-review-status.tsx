"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ErrorToast, SuccessToast } from "@/components/atom/toast"
import { overrideLiveAttendance } from "@/components/school-dashboard/live/actions/attendance-review"

const EDITABLE = ["PRESENT", "LATE", "ABSENT", "EXCUSED"] as const
type Editable = (typeof EDITABLE)[number]

/**
 * One student's mark on the after-class register. Changing it writes through
 * the attendance block (a MANUAL row the sync will never lower again).
 */
export function AttendanceReviewStatus({
  sessionId,
  studentId,
  studentName,
  status,
  statusLabels,
  placeholder,
  savedLabel,
  errorLabel,
}: {
  sessionId: string
  studentId: string
  studentName: string
  status: string | null
  statusLabels: Record<string, string>
  placeholder: string
  savedLabel: string
  errorLabel: string
}) {
  const router = useRouter()
  const [value, setValue] = useState<string | undefined>(status ?? undefined)
  const [pending, startTransition] = useTransition()

  const onChange = (next: string) => {
    const previous = value
    setValue(next)
    startTransition(async () => {
      const res = await overrideLiveAttendance({
        sessionId,
        studentId,
        status: next as Editable,
      })
      if (!res.success) {
        setValue(previous)
        ErrorToast(errorLabel)
        return
      }
      SuccessToast(savedLabel)
      router.refresh()
    })
  }

  return (
    <Select value={value} onValueChange={onChange} disabled={pending}>
      <SelectTrigger
        className="h-8 w-32"
        aria-label={`${studentName}: ${value ? (statusLabels[value] ?? value) : placeholder}`}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {/* A status the register can hold but this menu does not offer
            (SICK, HOLIDAY) still shows as the current value. */}
        {value && !EDITABLE.includes(value as Editable) && (
          <SelectItem value={value} disabled>
            {statusLabels[value] ?? value}
          </SelectItem>
        )}
        {EDITABLE.map((s) => (
          <SelectItem key={s} value={s}>
            {statusLabels[s] ?? s}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
