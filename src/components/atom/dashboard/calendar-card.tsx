'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Calendar as CalendarIcon, Clock, MapPin } from "lucide-react"
import type { CardSize } from "./types"

interface CalendarCardProps {
  /**
   * Event title
   */
  title: string
  /**
   * Event date
   */
  date: string
  /**
   * Event time
   */
  time?: string
  /**
   * Event location
   */
  location?: string
  /**
   * Event description
   */
  description?: string
  /**
   * Event status badge
   */
  status?: React.ReactNode
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

/**
 * CalendarCard - Calendar event preview card
 *
 * Perfect for upcoming events, scheduled meetings, or deadline reminders.
 * Displays event details in a clean, organized format.
 *
 * @example
 * ```tsx
 * <CalendarCard
 *   title="Parent-Teacher Conference"
 *   date="March 15, 2025"
 *   time="2:00 PM - 4:00 PM"
 *   location="Room 305"
 *   description="Quarterly progress discussion"
 *   status={<Badge>Upcoming</Badge>}
 *   onClick={() => router.push('/events/123')}
 * />
 * ```
 */
export function CalendarCard({
  title,
  date,
  time,
  location,
  description,
  status,
  size = "md",
  loading = false,
  onClick,
  className,
}: CalendarCardProps) {
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
      <CardContent className={cn(sizeClasses[size])}>
        {loading ? (
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-full" />
          </div>
        ) : (
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <h5 className="font-semibold text-foreground line-clamp-2">{title}</h5>
              {status}
            </div>

            {/* Event Details */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 muted">
                <CalendarIcon className="h-4 w-4 shrink-0" />
                <span>{date}</span>
              </div>

              {time && (
                <div className="flex items-center gap-2 muted">
                  <Clock className="h-4 w-4 shrink-0" />
                  <span>{time}</span>
                </div>
              )}

              {location && (
                <div className="flex items-center gap-2 muted">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span>{location}</span>
                </div>
              )}
            </div>

            {/* Description */}
            {description && (
              <p className="muted line-clamp-2">{description}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
