import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Trophy, Medal, Award } from "lucide-react"
import type { CardSize } from "./types"

interface Performer {
  /**
   * Rank position
   */
  rank: number
  /**
   * Avatar URL
   */
  avatar?: string
  /**
   * Name or title
   */
  name: string
  /**
   * Subtitle (e.g., department, category)
   */
  subtitle?: string
  /**
   * Primary metric value
   */
  value: string | number
  /**
   * Optional metric unit
   */
  unit?: string
  /**
   * Progress percentage (0-100)
   */
  progress?: number
  /**
   * Optional badge
   */
  badge?: React.ReactNode
}

interface TopPerformersCardProps {
  /**
   * Card title
   */
  title?: string
  /**
   * Card description
   */
  description?: string
  /**
   * List of performers
   */
  performers: Performer[]
  /**
   * Maximum items to display
   * @default 5
   */
  maxItems?: number
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
   * Action button in header
   */
  action?: React.ReactNode
  /**
   * Empty state message
   */
  emptyMessage?: string
  /**
   * Show progress bars
   * @default false
   */
  showProgress?: boolean
  /**
   * Show rank medals for top 3
   * @default true
   */
  showMedals?: boolean
  /**
   * Additional CSS classes
   */
  className?: string
}

/**
 * TopPerformersCard - Ranking list with metrics
 *
 * Perfect for leaderboards, top sellers, best performers, or ranked lists.
 * Shows rank, avatar, name, metric value, and optional progress bar.
 *
 * @example
 * ```tsx
 * <TopPerformersCard
 *   title="Top Performers"
 *   description="This month's leaders"
 *   performers={[
 *     {
 *       rank: 1,
 *       avatar: "/avatars/user1.png",
 *       name: "Sarah Johnson",
 *       subtitle: "Mathematics",
 *       value: 98,
 *       unit: "%",
 *       progress: 98
 *     },
 *     {
 *       rank: 2,
 *       name: "John Smith",
 *       subtitle: "Science",
 *       value: 95,
 *       unit: "%",
 *       progress: 95
 *     }
 *   ]}
 *   showProgress={true}
 *   maxItems={5}
 *   action={<Button variant="ghost" size="sm">View All</Button>}
 * />
 * ```
 */
export function TopPerformersCard({
  title = "Top Performers",
  description,
  performers,
  maxItems = 5,
  size = "md",
  loading = false,
  action,
  emptyMessage = "No data available",
  showProgress = false,
  showMedals = true,
  className,
}: TopPerformersCardProps) {
  const sizeClasses = {
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
    xl: "p-8",
  }

  const displayedPerformers = performers.slice(0, maxItems)
  const isEmpty = !loading && performers.length === 0

  // Generate initials from name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  // Get medal icon for top 3
  const getRankIcon = (rank: number) => {
    if (!showMedals) return null
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-chart-3" />
      case 2:
        return <Medal className="h-5 w-5 text-muted-foreground" />
      case 3:
        return <Award className="h-5 w-5 text-chart-5" />
      default:
        return null
    }
  }

  return (
    <Card className={cn("transition-colors", className)}>
      <CardHeader className={cn(sizeClasses[size], "pb-3")}>
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            {loading ? (
              <>
                <Skeleton className="h-5 w-32" />
                {description && <Skeleton className="h-4 w-40" />}
              </>
            ) : (
              <>
                <CardTitle>{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
              </>
            )}
          </div>
          {action && !loading && action}
        </div>
      </CardHeader>
      <CardContent className={cn(sizeClasses[size], "pt-0")}>
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-6 w-6 rounded" />
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-5 w-16" />
                </div>
                {showProgress && <Skeleton className="h-2 w-full" />}
              </div>
            ))}
          </div>
        ) : isEmpty ? (
          <div className="flex items-center justify-center py-8">
            <p className="muted text-center">{emptyMessage}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedPerformers.map((performer, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center gap-3">
                  {/* Rank or Medal */}
                  <div className="flex items-center justify-center w-6 h-6 shrink-0">
                    {getRankIcon(performer.rank) || (
                      <span className="font-semibold text-muted-foreground">
                        #{performer.rank}
                      </span>
                    )}
                  </div>

                  {/* Avatar */}
                  <Avatar className="h-10 w-10 shrink-0">
                    {performer.avatar && (
                      <AvatarImage src={performer.avatar} alt={performer.name} />
                    )}
                    <AvatarFallback>{getInitials(performer.name)}</AvatarFallback>
                  </Avatar>

                  {/* Name & Subtitle */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="font-medium text-foreground leading-none truncate">
                      {performer.name}
                    </p>
                    {performer.subtitle && (
                      <p className="muted truncate">{performer.subtitle}</p>
                    )}
                  </div>

                  {/* Value */}
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground whitespace-nowrap">
                      {typeof performer.value === "number"
                        ? performer.value.toLocaleString()
                        : performer.value}
                      {performer.unit && (
                        <span className="muted ml-1">{performer.unit}</span>
                      )}
                    </p>
                    {performer.badge}
                  </div>
                </div>

                {/* Progress Bar */}
                {showProgress && performer.progress !== undefined && (
                  <Progress
                    value={performer.progress}
                    className="h-2"
                    aria-label={`${performer.name} progress: ${performer.progress}%`}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
