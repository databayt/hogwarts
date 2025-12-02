"use client"

import * as React from "react"
import {
  Users,
  UserCheck,
  Clock,
  CircleCheck,
  ListOrdered,
  CircleX,
  GraduationCap,
  TrendingUp
} from "lucide-react"
import { TrendingStats } from "../trending-stats"
import { ProgressStats, ProgressStatStacked } from "../progress-stats"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { TrendingStatItem, AdmissionStatsData } from "../types"

interface AdmissionStatsProps {
  /** Admission data */
  data: AdmissionStatsData
  /** Dictionary for i18n */
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
  /** Loading state */
  loading?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * AdmissionStats - Pre-configured stats for admission dashboard
 *
 * @example
 * ```tsx
 * <AdmissionStats
 *   data={{
 *     totalApplications: 250,
 *     submitted: 200,
 *     underReview: 50,
 *     selected: 100,
 *     waitlisted: 25,
 *     rejected: 25,
 *     admitted: 75,
 *   }}
 * />
 * ```
 */
export function AdmissionStats({
  data,
  dictionary,
  loading = false,
  className,
}: AdmissionStatsProps) {
  const labels = dictionary || {}

  const conversionRate = data.totalApplications > 0
    ? ((data.admitted / data.totalApplications) * 100).toFixed(1)
    : "0"

  const items: TrendingStatItem[] = [
    {
      label: labels.totalApplications || "Total Applications",
      value: data.totalApplications,
      icon: <Users className="h-4 w-4" />,
    },
    {
      label: labels.submitted || "Submitted",
      value: data.submitted,
      icon: <UserCheck className="h-4 w-4" />,
      variant: "success",
    },
    {
      label: labels.underReview || "Under Review",
      value: data.underReview,
      icon: <Clock className="h-4 w-4" />,
      variant: "warning",
    },
    {
      label: labels.selected || "Selected",
      value: data.selected,
      icon: <CircleCheck className="h-4 w-4" />,
      variant: "success",
    },
    {
      label: labels.waitlisted || "Waitlisted",
      value: data.waitlisted,
      icon: <ListOrdered className="h-4 w-4" />,
      variant: "warning",
    },
    {
      label: labels.rejected || "Rejected",
      value: data.rejected,
      icon: <CircleX className="h-4 w-4" />,
      variant: "danger",
    },
    {
      label: labels.admitted || "Admitted",
      value: data.admitted,
      icon: <GraduationCap className="h-4 w-4" />,
      variant: "primary",
    },
    {
      label: labels.conversionRate || "Conversion Rate",
      value: `${conversionRate}%`,
      icon: <TrendingUp className="h-4 w-4" />,
    },
  ]

  return (
    <TrendingStats
      items={items}
      variant="default"
      loading={loading}
      className={className}
    />
  )
}

interface AdmissionPipelineProps {
  /** Admission data */
  data: AdmissionStatsData
  /** Title */
  title?: string
  /** Dictionary for i18n */
  dictionary?: {
    submitted?: string
    underReview?: string
    selected?: string
    waitlisted?: string
    admitted?: string
    applicationPipeline?: string
  }
  /** Additional CSS classes */
  className?: string
}

/**
 * AdmissionPipeline - Stacked progress view of admission pipeline
 */
export function AdmissionPipeline({
  data,
  title,
  dictionary,
  className,
}: AdmissionPipelineProps) {
  const labels = dictionary || {}

  const items = [
    {
      label: labels.submitted || "Submitted",
      value: data.submitted,
      color: "bg-blue-500",
    },
    {
      label: labels.underReview || "Under Review",
      value: data.underReview,
      color: "bg-amber-500",
    },
    {
      label: labels.selected || "Selected",
      value: data.selected,
      color: "bg-emerald-500",
    },
    {
      label: labels.waitlisted || "Waitlisted",
      value: data.waitlisted,
      color: "bg-orange-500",
    },
    {
      label: labels.admitted || "Admitted",
      value: data.admitted,
      color: "bg-purple-500",
    },
  ]

  return (
    <ProgressStatStacked
      items={items}
      total={data.totalApplications}
      title={title || labels.applicationPipeline || "Application Pipeline"}
      className={className}
    />
  )
}

interface SeatUtilizationProps {
  /** Seats filled */
  seatsFilled: number
  /** Seats available */
  seatsAvailable: number
  /** Dictionary for i18n */
  dictionary?: {
    seatUtilization?: string
    seatsFilled?: string
    seatsAvailable?: string
    utilized?: string
  }
  /** Additional CSS classes */
  className?: string
}

/**
 * SeatUtilization - Progress card showing seat utilization
 */
export function SeatUtilization({
  seatsFilled,
  seatsAvailable,
  dictionary,
  className,
}: SeatUtilizationProps) {
  const labels = dictionary || {}
  const totalSeats = seatsFilled + seatsAvailable
  const utilizationRate = totalSeats > 0 ? (seatsFilled / totalSeats) * 100 : 0

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{labels.seatUtilization || "Seat Utilization"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              {labels.seatsFilled || "Seats Filled"}
            </p>
            <p className="text-2xl font-bold">
              {seatsFilled} / {totalSeats}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">
              {labels.seatsAvailable || "Available"}
            </p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {seatsAvailable}
            </p>
          </div>
        </div>
        <Progress value={utilizationRate} className="h-2" />
        <p className="text-sm text-muted-foreground text-center">
          {utilizationRate.toFixed(1)}% {labels.utilized || "utilized"}
        </p>
      </CardContent>
    </Card>
  )
}

interface AdmissionDashboardFullProps {
  /** Admission data */
  data: AdmissionStatsData
  /** Dictionary for i18n */
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
  /** Loading state */
  loading?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * AdmissionDashboardFull - Complete admission dashboard with stats, pipeline, and seat utilization
 */
export function AdmissionDashboardFull({
  data,
  dictionary,
  loading = false,
  className,
}: AdmissionDashboardFullProps) {
  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Stats Grid */}
        <AdmissionStats data={data} dictionary={dictionary} loading={loading} />

        {/* Seat Utilization */}
        {data.seatsFilled !== undefined && (
          <SeatUtilization
            seatsFilled={data.seatsFilled}
            seatsAvailable={data.totalSeats ? data.totalSeats - data.seatsFilled : 0}
            dictionary={dictionary}
          />
        )}

        {/* Application Pipeline */}
        <AdmissionPipeline data={data} dictionary={dictionary} />
      </div>
    </div>
  )
}
