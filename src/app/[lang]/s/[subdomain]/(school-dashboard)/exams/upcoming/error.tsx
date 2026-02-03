"use client"

import { ExamErrorBoundary } from "@/components/school-dashboard/exams/error-boundary"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function UpcomingError({ error, reset }: ErrorProps) {
  return (
    <ExamErrorBoundary
      error={error}
      reset={reset}
      title="Unable to load Upcoming Exams"
      description="An error occurred while loading the upcoming exams list. Please try again."
    />
  )
}
