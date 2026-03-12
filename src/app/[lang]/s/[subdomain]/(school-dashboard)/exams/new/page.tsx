// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

import { createDraftExam } from "@/components/school-dashboard/exams/manage/wizard/actions"

export default function NewExamPage() {
  const router = useRouter()

  useEffect(() => {
    async function create() {
      const result = await createDraftExam()
      if (result.success && result.data) {
        router.replace(`/exams/manage/add/${result.data.id}/information`)
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
