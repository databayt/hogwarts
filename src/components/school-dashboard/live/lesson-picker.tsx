"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface LessonPickerLabels {
  label: string
  placeholder: string
  suggested: string
}

/**
 * A compact, phone-first lesson select. The suggested lesson is marked and
 * may be preselected by the caller, but picking — or accepting — a lesson
 * saves nothing: the caller decides what to do with `onChange`.
 */
export function LessonPicker({
  id,
  lessons,
  value,
  onChange,
  suggestedId,
  labels,
  disabled,
}: {
  id: string
  lessons: { id: string; name: string }[]
  value: string
  onChange: (lessonId: string) => void
  suggestedId?: string | null
  labels: LessonPickerLabels
  disabled?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{labels.label}</Label>
      <Select
        value={value || undefined}
        onValueChange={onChange}
        disabled={disabled || lessons.length === 0}
      >
        <SelectTrigger id={id} className="h-12 w-full">
          <SelectValue placeholder={labels.placeholder} />
        </SelectTrigger>
        <SelectContent>
          {lessons.map((l) => (
            <SelectItem key={l.id} value={l.id}>
              {l.name}
              {l.id === suggestedId ? ` · ${labels.suggested}` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
