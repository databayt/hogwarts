// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

import { createDraftQuestion } from "@/components/school-dashboard/exams/qbank/wizard/actions"

export default function NewQuestionPage() {
  const router = useRouter()

  useEffect(() => {
    async function create() {
      const result = await createDraftQuestion()
      if (result.success && result.data) {
        router.replace(`/exams/qbank/add/${result.data.id}/question`)
      } else {
        router.back()
      }
    }
    create()
  }, [router])

  return (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  )
}
