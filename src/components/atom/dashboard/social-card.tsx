import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Heart, MessageCircle, Share2, Eye, ThumbsUp, Users } from "lucide-react"
import type { CardSize } from "./types"

interface SocialMetric {
  /**
   * Metric type
   */
  type: "likes" | "comments" | "shares" | "views" | "reactions" | "followers"
  /**
   * Metric value
   */
  value: number | string
  /**
   * Trend indicator (optional)
   */
  trend?: {
    value: number
    isPositive: boolean
  }
}

interface SocialCardProps {
  /**
   * Card title
   */
  title?: string
  /**
   * Social metrics list
   */
  metrics: SocialMetric[]
  /**
   * Card size variant
   * @default "md"
   */
  size?: CardSize
  /**
   * Loading state
   */
  loading?: boolean
  /**
   * Click handler
   */
  onClick?: () => void
  /**
   * Additional CSS classes
   */
  className?: string
}

const metricIcons = {
  likes: Heart,
  comments: MessageCircle,
  shares: Share2,
  views: Eye,
  reactions: ThumbsUp,
  followers: Users,
}

const metricLabels = {
  likes: "Likes",
  comments: "Comments",
  shares: "Shares",
  views: "Views",
  reactions: "Reactions",
  followers: "Followers",
}

/**
 * SocialCard - Social engagement metrics card
 *
 * Perfect for social media analytics, content engagement, or community metrics.
 * Displays multiple social metrics with icons and optional trends.
 *
 * @example
 * ```tsx
 * <SocialCard
 *   title="Post Engagement"
 *   metrics={[
 *     { type: "likes", value: 1234, trend: { value: 12, isPositive: true } },
 *     { type: "comments", value: 89, trend: { value: 5, isPositive: true } },
 *     { type: "shares", value: 456, trend: { value: 8, isPositive: false } },
 *     { type: "views", value: "12.5K" }
 *   ]}
 *   onClick={() => router.push('/analytics')}
 * />
 * ```
 */
export function SocialCard({
  title,
  metrics,
  size = "md",
  loading = false,
  onClick,
  className,
}: SocialCardProps) {
  const sizeClasses = {
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
    xl: "p-8",
  }

  const isInteractive = !!onClick

  return (
    <Card
      className={cn(
        "transition-colors",
        isInteractive && "cursor-pointer hover:bg-accent/50",
        className
      )}
      onClick={onClick}
    >
      {title && (
        <CardHeader className={cn(sizeClasses[size], "pb-3")}>
          {loading ? (
            <Skeleton className="h-5 w-32" />
          ) : (
            <h5 className="font-medium text-foreground">{title}</h5>
          )}
        </CardHeader>
      )}
      <CardContent className={cn(sizeClasses[size], title && "pt-0")}>
        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {metrics.map((metric, index) => {
              const Icon = metricIcons[metric.type]
              const label = metricLabels[metric.type]

              return (
                <div key={index} className="space-y-1">
                  <div className="flex items-center gap-1.5 muted">
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="text-xs">{label}</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <h4 className="font-bold text-foreground">
                      {typeof metric.value === "number"
                        ? metric.value.toLocaleString()
                        : metric.value}
                    </h4>
                    {metric.trend && (
                      <span
                        className={cn(
                          "text-xs font-medium",
                          metric.trend.isPositive
                            ? "text-chart-2"
                            : "text-chart-5"
                        )}
                      >
                        {metric.trend.isPositive ? "+" : ""}
                        {metric.trend.value}%
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
