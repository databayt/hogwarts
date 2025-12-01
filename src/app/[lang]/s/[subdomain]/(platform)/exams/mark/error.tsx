"use client"

import { ExamErrorBoundary } from "@/components/platform/exams/error-boundary"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function MarkError({ error, reset }: ErrorProps) {
  return (
    <ExamErrorBoundary
      error={error}
      reset={reset}
      title="Unable to load Marking Dashboard"
      description="An error occurred while loading the marking system. Please try again."
    />
  )
}
