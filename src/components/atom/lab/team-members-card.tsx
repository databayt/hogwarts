'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import type { CardSize } from "./types"

interface TeamMember {
  /**
   * Member avatar URL
   */
  avatar?: string
  /**
   * Member name
   */
  name: string
  /**
   * Member role/title
   */
  role: string
  /**
   * Online status
   */
  status?: "online" | "offline" | "away" | "busy"
  /**
   * Optional badge or tag
   */
  badge?: React.ReactNode
  /**
   * Click handler for member
   */
  onClick?: () => void
}

interface TeamMembersCardProps {
  /**
   * Card title
   */
  title?: string
  /**
   * Card description
   */
  description?: string
  /**
   * List of team members
   */
  members: TeamMember[]
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
   * Show status indicators
   * @default true
   */
  showStatus?: boolean
  /**
   * Additional CSS classes
   */
  className?: string
}

const statusColors = {
  online: "bg-chart-2",
  offline: "bg-muted",
  away: "bg-chart-3",
  busy: "bg-destructive",
}

const statusLabels = {
  online: "Online",
  offline: "Offline",
  away: "Away",
  busy: "Busy",
}

/**
 * TeamMembersCard - Team roster with status indicators
 *
 * Perfect for displaying team members, staff directory, or active participants.
 * Shows avatar, name, role, and optional online status.
 *
 * @example
 * ```tsx
 * <TeamMembersCard
 *   title="Team Members"
 *   description="8 members online"
 *   members={[
 *     {
 *       avatar: "/avatars/sarah.png",
 *       name: "Sarah Johnson",
 *       role: "Mathematics Teacher",
 *       status: "online",
 *       onClick: () => router.push('/profile/sarah')
 *     },
 *     {
 *       name: "John Smith",
 *       role: "Science Teacher",
 *       status: "busy",
 *       badge: <Badge variant="outline">Lead</Badge>
 *     }
 *   ]}
 *   maxItems={10}
 *   action={<Button variant="ghost" size="sm">View All</Button>}
 * />
 * ```
 */
export function TeamMembersCard({
  title = "Team Members",
  description,
  members,
  maxItems = 5,
  size = "md",
  loading = false,
  action,
  emptyMessage = "No team members",
  showStatus = true,
  className,
}: TeamMembersCardProps) {
  const sizeClasses = {
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
    xl: "p-8",
  }

  const displayedMembers = members.slice(0, maxItems)
  const isEmpty = !loading && members.length === 0

  // Generate initials from name
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
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        ) : isEmpty ? (
          <div className="flex items-center justify-center py-8">
            <p className="muted text-center">{emptyMessage}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedMembers.map((member, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg transition-colors",
                  member.onClick && "cursor-pointer hover:bg-accent/50"
                )}
                onClick={member.onClick}
              >
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    {member.avatar && (
                      <AvatarImage src={member.avatar} alt={member.name} />
                    )}
                    <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                  </Avatar>
                  {showStatus && member.status && (
                    <span
                      className={cn(
                        "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background",
                        statusColors[member.status]
                      )}
                      title={statusLabels[member.status]}
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="font-medium text-foreground leading-none truncate">
                    {member.name}
                  </p>
                  <p className="muted truncate">{member.role}</p>
                </div>
                {member.badge}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
