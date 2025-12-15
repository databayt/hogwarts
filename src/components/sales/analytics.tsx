/**
 * Lead analytics dashboard component
 * Displays key metrics and insights about leads
 */

"use client"

import { useEffect, useState } from "react"
import { Award, Target, TrendingUp, Users } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

import { getLeadAnalytics } from "./actions"
import { LEAD_SOURCE, LEAD_STATUS } from "./constants"

interface AnalyticsProps {
  className?: string
}

export function LeadAnalytics({ className = "" }: AnalyticsProps) {
  const [analytics, setAnalytics] = useState<{
    totalLeads: number
    newLeadsThisWeek: number
    statusDistribution?: Array<{ status: string; _count: number }>
    sourceDistribution?: Array<{ source: string; _count: number }>
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const result = await getLeadAnalytics()
        if (result.success && result.data) {
          setAnalytics({
            totalLeads: result.data.totalLeads,
            newLeadsThisWeek: result.data.newLeadsThisWeek,
            statusDistribution: result.data.statusDistribution?.map((s) => ({
              status: s.status,
              _count: s.count,
            })),
            sourceDistribution: result.data.topSources?.map((s) => ({
              source: s.source,
              _count: s.count,
            })),
          })
        }
      } catch (error) {
        console.error("Failed to fetch analytics:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  if (isLoading) {
    return (
      <>
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="h-fit shadow-none">
            <CardContent className="flex flex-col items-start p-2.5">
              <Skeleton className="mb-1.5 h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-4 w-20" />
            </CardContent>
          </Card>
        ))}
      </>
    )
  }

  if (!analytics) {
    return null
  }

  // Calculate conversion rate (mock calculation)
  const conversionRate =
    analytics.totalLeads > 0
      ? Math.round(
          ((analytics.statusDistribution?.find((s) => s.status === "CLOSED_WON")
            ?._count || 0) /
            analytics.totalLeads) *
            100
        )
      : 0

  return (
    <>
      {/* Total Leads Card */}
      <Card className="h-fit shadow-none">
        <CardContent className="flex flex-col items-start p-2.5">
          <Users className="text-muted-foreground mb-1.5 h-8 w-8" />
          <div className="text-3xl leading-tight font-bold">
            {analytics.totalLeads}
          </div>
          <p className="text-muted-foreground text-sm">Total Leads</p>
        </CardContent>
      </Card>

      {/* New This Week Card */}
      <Card className="h-fit shadow-none">
        <CardContent className="flex flex-col items-start p-2.5">
          <TrendingUp className="text-muted-foreground mb-1.5 h-8 w-8" />
          <div className="text-3xl leading-tight font-bold">
            {analytics.newLeadsThisWeek}
          </div>
          <p className="text-muted-foreground text-sm">New This Week</p>
        </CardContent>
      </Card>

      {/* Conversion Rate Card */}
      <Card className="h-fit shadow-none">
        <CardContent className="flex flex-col items-start p-2.5">
          <Target className="text-muted-foreground mb-1.5 h-8 w-8" />
          <div className="text-3xl leading-tight font-bold">
            {conversionRate}%
          </div>
          <p className="text-muted-foreground text-sm">Conversion Rate</p>
        </CardContent>
      </Card>

      {/* Top Source Card */}
      <Card className="h-fit shadow-none">
        <CardContent className="flex flex-col items-start p-2.5">
          <Award className="text-muted-foreground mb-1.5 h-8 w-8" />
          <div className="text-3xl leading-tight font-bold">
            {analytics.sourceDistribution?.[0]?.source
              ? LEAD_SOURCE[
                  analytics.sourceDistribution[0]
                    .source as keyof typeof LEAD_SOURCE
                ]
              : "N/A"}
          </div>
          <p className="text-muted-foreground text-sm">Top Source</p>
        </CardContent>
      </Card>
    </>
  )
}
