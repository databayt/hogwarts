"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { ExamErrorBoundary } from "@/components/school-dashboard/exams/error-boundary"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GenerateError({ error, reset }: ErrorProps) {
  return (
    <ExamErrorBoundary
      error={error}
      reset={reset}
      title="Unable to load Exam Generator"
      description="An error occurred while loading the exam generation tools. Please try again."
    />
  )
}
