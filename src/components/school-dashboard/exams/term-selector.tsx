"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useRouter, useSearchParams } from "next/navigation"
import { CalendarDays } from "lucide-react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useDictionary } from "@/components/internationalization/use-dictionary"

interface TermOption {
  id: string
  label: string
  isActive: boolean
}

interface TermSelectorProps {
  terms: TermOption[]
  currentTermId?: string
}

export function TermSelector({ terms, currentTermId }: TermSelectorProps) {
  const { dictionary } = useDictionary()
  const t = dictionary?.school?.exams?.termSelector
  const router = useRouter()
  const searchParams = useSearchParams()

  const value = searchParams.get("termId") || currentTermId || "all"

  const handleChange = (termId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (termId === "all") {
      params.delete("termId")
    } else {
      params.set("termId", termId)
    }
    router.push(`?${params.toString()}`)
  }

  if (terms.length === 0) return null

  return (
    <Select value={value} onValueChange={handleChange}>
      <SelectTrigger className="w-[200px]">
        <CalendarDays className="me-2 h-4 w-4" />
        <SelectValue placeholder={t?.allTime ?? "All Time"} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{t?.allTime ?? "All Time"}</SelectItem>
        {terms.map((term) => (
          <SelectItem key={term.id} value={term.id}>
            {term.label}
            {term.isActive && ` (${t?.current ?? "Current"})`}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
