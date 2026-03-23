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
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { issueFine } from "./actions"

const getFineTypes = (ff?: Record<string, string>) =>
  [
    { value: "LATE_FEE", label: ff?.lateFee || "Late Fee" },
    { value: "LIBRARY_FINE", label: ff?.libraryFine || "Library Fine" },
    {
      value: "DISCIPLINE_FINE",
      label: ff?.disciplineFine || "Discipline Fine",
    },
    { value: "DAMAGE_FINE", label: ff?.damageFine || "Damage Fine" },
    { value: "OTHER", label: ff?.other || "Other" },
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
  const { dictionary } = useDictionary()
  const ff = (dictionary as any)?.finance?.fineForm as
    | Record<string, string>
    | undefined
  const fc = (dictionary as any)?.finance?.common as
    | Record<string, string>
    | undefined

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await issueFine(formData)
      if (result.success) {
        toast.success(ff?.fineIssuedSuccessfully || "Fine issued successfully")
        router.push(`/${lang}/finance/fees/fines`)
      } else {
        toast.error(
          result.error || ff?.failedIssueFine || "Failed to issue fine"
        )
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
      <div className="space-y-2">
        <Label htmlFor="studentId">{ff?.studentLabel || "Student"}</Label>
        <Select name="studentId" required>
          <SelectTrigger id="studentId">
            <SelectValue
              placeholder={ff?.selectStudent || "Select a student"}
            />
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
        <Label htmlFor="fineType">{ff?.fineType || "Fine Type"}</Label>
        <Select name="fineType" required>
          <SelectTrigger id="fineType">
            <SelectValue
              placeholder={ff?.selectFineType || "Select fine type"}
            />
          </SelectTrigger>
          <SelectContent>
            {getFineTypes(ff).map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">{ff?.amount || "Amount"}</Label>
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
        <Label htmlFor="reason">{ff?.reason || "Reason"}</Label>
        <Textarea
          id="reason"
          name="reason"
          required
          placeholder={
            ff?.reasonPlaceholder || "Describe the reason for this fine"
          }
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="dueDate">{ff?.dueDate || "Due Date"}</Label>
        <Input id="dueDate" name="dueDate" type="date" required />
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? ff?.issuing || "Issuing..."
            : ff?.issueFine || "Issue Fine"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/${lang}/finance/fees/fines`)}
        >
          {fc?.cancel || "Cancel"}
        </Button>
      </div>
    </form>
  )
}
