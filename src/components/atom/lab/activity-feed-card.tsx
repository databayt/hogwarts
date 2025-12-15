import * as React from "react"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

import type { CardSize } from "./types"

interface ActivityItem {
  /**
   * User/actor avatar
   */
  avatar?: string
  /**
   * Activity title/actor name
   */
  title: string
  /**
   * Activity description
   */
  description: string
  /**
   * Timestamp
   */
  timestamp: string
  /**
   * Optional icon or badge
   */
  icon?: React.ReactNode
  /**
   * Activity type for color coding
   */
  type?: "default" | "success" | "warning" | "error"
}

interface ActivityFeedCardProps {
  /**
   * Card title
   */
  title?: string
  /**
   * Card description
   */
  description?: string
  /**
   * List of activities
   */
  activities: ActivityItem[]
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
   * Show avatars
   * @default true
   */
  showAvatars?: boolean
  /**
   * Additional CSS classes
   */
  className?: string
}

/**
 * ActivityFeedCard - Activity log with timestamps
 *
 * Perfect for displaying recent activities, system logs, or user actions.
 * Shows avatar, title, description, and timestamp in a feed format.
 *
 * @example
 * ```tsx
 * <ActivityFeedCard
 *   title="Recent Activity"
 *   description="Latest updates from your team"
 *   activities={[
 *     {
 *       avatar: "/avatars/user1.png",
 *       title: "John Doe",
 *       description: "Created a new exam paper",
 *       timestamp: "2 hours ago",
 *       type: "success"
 *     },
 *     {
 *       title: "System",
 *       description: "Backup completed successfully",
 *       timestamp: "5 hours ago",
 *       type: "success"
 *     }
 *   ]}
 *   maxItems={10}
 *   action={<Button variant="ghost" size="sm">View All</Button>}
 * />
 * ```
 */
export function ActivityFeedCard({
  title = "Activity Feed",
  description,
  activities,
  maxItems = 5,
  size = "md",
  loading = false,
  action,
  emptyMessage = "No recent activity",
  showAvatars = true,
  className,
}: ActivityFeedCardProps) {
  const sizeClasses = {
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
    xl: "p-8",
  }

  const typeColors = {
    default: "bg-muted",
    success: "bg-chart-2/10",
    warning: "bg-chart-3/10",
    error: "bg-destructive/10",
  }

  const displayedActivities = activities.slice(0, maxItems)
  const isEmpty = !loading && activities.length === 0

  // Generate initials from title
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Card className={cn("transition-colors", className)}>
      <CardHeader className={cn(sizeClasses[size], "pb-3")}>
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            {loading ? (
              <>
                <Skeleton className="h-5 w-32" />
                {description && <Skeleton className="h-4 w-48" />}
              </>
            ) : (
              <>
                <CardTitle>{title}</CardTitle>
                {description && (
                  <CardDescription>{description}</CardDescription>
                )}
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
              <div key={i} className="flex items-start gap-3">
                {showAvatars && (
                  <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                )}
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : isEmpty ? (
          <div className="flex items-center justify-center py-8">
            <p className="muted text-center">{emptyMessage}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedActivities.map((activity, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-start gap-3 rounded-lg p-3 transition-colors",
                  typeColors[activity.type || "default"]
                )}
              >
                {showAvatars && (
                  <Avatar className="h-10 w-10 shrink-0">
                    {activity.avatar && (
                      <AvatarImage src={activity.avatar} alt={activity.title} />
                    )}
                    <AvatarFallback>
                      {activity.icon || getInitials(activity.title)}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="leading-none">{activity.title}</p>
                    <small className="muted shrink-0 whitespace-nowrap">
                      {activity.timestamp}
                    </small>
                  </div>
                  <p className="muted line-clamp-2">{activity.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
