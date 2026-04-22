"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useTransition } from "react"
import { toast } from "sonner"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { setPreferredPaymentMethod } from "./actions"

interface MethodOption {
  value: string
  label: string
}

interface Props {
  studentId: string
  currentMethod: string | null
  options: MethodOption[]
  dictionary?: {
    noneLabel?: string
    updatedToast?: string
    failedToast?: string
    placeholder?: string
  }
}

export function PreferredMethodPicker({
  studentId,
  currentMethod,
  options,
  dictionary = {},
}: Props) {
  const [value, setValue] = useState<string>(currentMethod ?? "none")
  const [isPending, startTransition] = useTransition()

  const onChange = (next: string) => {
    setValue(next)
    startTransition(async () => {
      const res = await setPreferredPaymentMethod(
        studentId,
        next === "none" ? null : next
      )
      if (res.success) {
        toast.success(dictionary.updatedToast || "Preferred method updated.")
      } else {
        toast.error(dictionary.failedToast || "Failed to update method.")
        setValue(currentMethod ?? "none")
      }
    })
  }

  return (
    <Select value={value} onValueChange={onChange} disabled={isPending}>
      <SelectTrigger className="w-full sm:w-64">
        <SelectValue placeholder={dictionary.placeholder || "Pick a method"} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">{dictionary.noneLabel || "None"}</SelectItem>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
