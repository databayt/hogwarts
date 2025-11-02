import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { IconWrapper } from "./icon-wrapper"
import { ProgressStat } from "./progress-stat"
import type { CardSize } from "./types"

interface ProgressCardProps {
  /**
   * Current progress value (0-100)
   */
  value: number
  /**
   * Maximum value
   * @default 100
   */
  max?: number
  /**
   * The descriptive label
   */
  label: string
  /**
   * Optional icon element
   */
  icon?: React.ReactNode
  /**
   * Visual variant
   * @default "primary"
   */
  variant?: "default" | "primary" | "success" | "warning" | "danger"
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
   * Enable hover effect
   * @default false
   */
  hoverable?: boolean
  /**
   * Additional CSS classes
   */
  className?: string
}

/**
 * ProgressCard - Progress tracking card with optional icon
 *
 * @example
 * ```tsx
 * <ProgressCard
 *   icon={<CheckCircle />}
 *   label="Attendance Rate"
 *   value={94}
 *   variant="success"
 *   size="lg"
 *   onClick={() => router.push('/attendance')}
 *   hoverable
 * />
 * ```
 */
export function ProgressCard({
  value,
  max = 100,
  label,
  icon,
  variant = "primary",
  size = "md",
  loading = false,
  onClick,
  hoverable = false,
  className,
}: ProgressCardProps) {
  const sizeClasses = {
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
    xl: "p-8",
  }

  const isInteractive = onClick || hoverable

  return (
    <Card
      className={cn(
        "transition-colors",
        isInteractive && "cursor-pointer hover:bg-accent/50",
        className
      )}
      onClick={onClick}
    >
      {icon && (
        <CardHeader className={cn(sizeClasses[size], "pb-2")}>
          {loading ? (
            <Skeleton className="h-10 w-10 rounded-lg" />
          ) : (
            <IconWrapper icon={icon} variant="primary" />
          )}
        </CardHeader>
      )}
      <CardContent className={cn(sizeClasses[size])}>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-4 w-20" />
          </div>
        ) : (
          <ProgressStat
            value={value}
            max={max}
            label={label}
            variant={variant}
          />
        )}
      </CardContent>
    </Card>
  )
}
