// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { Locale } from "@/components/internationalization/config"

import { issueFine } from "./actions"

const FINE_TYPES = [
  { value: "LATE_FEE", label: "Late Fee" },
  { value: "LIBRARY_FINE", label: "Library Fine" },
  { value: "DISCIPLINE_FINE", label: "Discipline Fine" },
  { value: "DAMAGE_FINE", label: "Damage Fine" },
  { value: "OTHER", label: "Other" },
] as const

interface FineFormProps {
  students: Array<{
    id: string
    givenName: string | null
    surname: string | null
  }>
  lang: Locale
}

export function FineForm({ students, lang }: FineFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await issueFine(formData)
      if (result.success) {
        toast.success("Fine issued successfully")
        router.push(`/${lang}/finance/fees/fines`)
      } else {
        toast.error(result.error || "Failed to issue fine")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
      <div className="space-y-2">
        <Label htmlFor="studentId">Student</Label>
        <Select name="studentId" required>
          <SelectTrigger id="studentId">
            <SelectValue placeholder="Select a student" />
          </SelectTrigger>
          <SelectContent>
            {students.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {[s.givenName, s.surname].filter(Boolean).join(" ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="fineType">Fine Type</Label>
        <Select name="fineType" required>
          <SelectTrigger id="fineType">
            <SelectValue placeholder="Select fine type" />
          </SelectTrigger>
          <SelectContent>
            {FINE_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Amount</Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          min="0.01"
          step="0.01"
          required
          placeholder="0.00"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reason">Reason</Label>
        <Textarea
          id="reason"
          name="reason"
          required
          placeholder="Describe the reason for this fine"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="dueDate">Due Date</Label>
        <Input id="dueDate" name="dueDate" type="date" required />
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Issuing..." : "Issue Fine"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/${lang}/finance/fees/fines`)}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
