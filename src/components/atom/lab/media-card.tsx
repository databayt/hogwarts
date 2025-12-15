"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

import type { CardSize } from "./types"

interface MediaCardProps {
  /**
   * Media element (Avatar, Image, or custom component)
   */
  media: React.ReactNode
  /**
   * Primary title
   */
  title: string
  /**
   * Optional subtitle
   */
  subtitle?: string
  /**
   * Optional trailing element (Badge, Button, etc.)
   */
  trailing?: React.ReactNode
  /**
   * Card size variant
   * @default "md"
   */
  size?: CardSize
  /**
   * Loading state (shows skeleton)
   */
  loading?: boolean
  /**
   * Click handler for navigation
   */
  onClick?: () => void
  /**
   * Additional CSS classes
   */
  className?: string
}

/**
 * MediaCard - Card with image/avatar and content
 *
 * Perfect for user profiles, recent uploads, gallery items,
 * or any card that needs visual media.
 *
 * @example
 * ```tsx
 * <MediaCard
 *   media={<Avatar src={user.image} />}
 *   title={user.name}
 *   subtitle={user.role}
 *   trailing={<Badge>{user.status}</Badge>}
 *   onClick={() => router.push(`/users/${user.id}`)}
 * />
 * ```
 */
export function MediaCard({
  media,
  title,
  subtitle,
  trailing,
  size = "md",
  loading = false,
  onClick,
  className,
}: MediaCardProps) {
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
        isInteractive && "hover:bg-accent/50 cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <CardContent className={cn(sizeClasses[size])}>
        {loading ? (
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            {/* Media */}
            <div className="shrink-0">{media}</div>

            {/* Content */}
            <div className="min-w-0 flex-1 space-y-0.5">
              <h5 className="text-foreground truncate font-medium">{title}</h5>
              {subtitle && <p className="muted truncate">{subtitle}</p>}
            </div>

            {/* Trailing */}
            {trailing && <div className="shrink-0">{trailing}</div>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
