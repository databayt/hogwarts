"use client"

import { AdmissionDashboardFull } from "@/components/platform/shared/stats"
import type { AdmissionStats } from "./types"

interface Props {
  stats: AdmissionStats
  dictionary?: {
    totalApplications?: string
    submitted?: string
    underReview?: string
    selected?: string
    waitlisted?: string
    rejected?: string
    admitted?: string
    conversionRate?: string
    seatUtilization?: string
    seatsFilled?: string
    seatsAvailable?: string
    utilized?: string
    applicationPipeline?: string
  }
}

export function AdmissionDashboard({ stats, dictionary }: Props) {
  return (
    <AdmissionDashboardFull
      data={{
        totalApplications: stats.totalApplications,
        submitted: stats.submitted,
        underReview: stats.underReview,
        selected: stats.selected,
        waitlisted: stats.waitlisted,
        rejected: stats.rejected,
        admitted: stats.admitted,
        seatsFilled: stats.seatsFilled,
        totalSeats: stats.seatsFilled + stats.seatsAvailable,
      }}
      dictionary={dictionary}
    />
  )
}
