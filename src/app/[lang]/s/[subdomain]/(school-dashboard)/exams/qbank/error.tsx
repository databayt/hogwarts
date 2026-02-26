"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { ExamErrorBoundary } from "@/components/school-dashboard/exams/error-boundary"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function QBankError({ error, reset }: ErrorProps) {
  return (
    <ExamErrorBoundary
      error={error}
      reset={reset}
      title="Unable to load Question Bank"
      description="An error occurred while loading the question bank. Please try again."
    />
  )
}
