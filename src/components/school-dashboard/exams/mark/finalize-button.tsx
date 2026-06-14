"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * One-click "auto-mark + aggregate + publish results" for a specific exam.
 * Runs objective auto-marking, writes ExamResult + gradebook Result per student,
 * and notifies students. Subjective answers still need teacher/AI grading first.
 */
import { useState } from "react"
import { Award, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

import { finalizeExamResults } from "./actions/finalize"

interface Props {
  examId: string
  label: string
  publishingLabel: string
  /** Template containing {count}, replaced with the number of students graded. */
  successTemplate: string
  errorLabel: string
}

export function FinalizeResultsButton({
  examId,
  label,
  publishingLabel,
  successTemplate,
  errorLabel,
}: Props) {
  const [isPending, setIsPending] = useState(false)

  const handleClick = async () => {
    setIsPending(true)
    try {
      const res = await finalizeExamResults(examId, { publish: true })
      if (res.success && res.data) {
        toast.success(
          successTemplate.replace("{count}", String(res.data.studentsGraded))
        )
      } else {
        toast.error((!res.success && res.error) || errorLabel)
      }
    } catch {
      toast.error(errorLabel)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={handleClick}
      disabled={isPending}
    >
      {isPending ? (
        <Loader2 className="me-2 size-4 animate-spin" />
      ) : (
        <Award className="me-2 size-4" />
      )}
      {isPending ? publishingLabel : label}
    </Button>
  )
}
