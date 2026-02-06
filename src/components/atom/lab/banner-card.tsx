"use client"
"use client"

import * as React from "react"
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

import type { CardSize } from "./types"

interface BannerCardProps {
  /**
   * Banner type/variant
   * @default "info"
   */
  variant?: "info" | "success" | "warning" | "error"
  /**
   * Banner title
   */
  title: string
  /**
   * Banner description/message
   */
  description?: string
  /**
   * Custom icon (overrides default variant icon)
   */
  icon?: React.ReactNode
  /**
   * Primary action button
   */
  action?: React.ReactNode
  /**
   * Dismissible banner
   * @default false
   */
  dismissible?: boolean
  /**
   * Dismiss handler
   */
  onDismiss?: () => void
  /**
   * Card size variant
   * @default "md"
   */
  size?: CardSize
  /**
   * Additional CSS classes
   */
  className?: string
}

const icons = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
}

const variantClasses = {
  info: "border-chart-1 bg-chart-1/5",
  success: "border-chart-2 bg-chart-2/5",
  warning: "border-chart-3 bg-chart-3/5",
  error: "border-destructive bg-destructive/5",
}

const iconColors = {
  info: "text-chart-1",
  success: "text-chart-2",
  warning: "text-chart-3",
  error: "text-destructive",
}

/**
 * BannerCard - Prominent announcement/alert banner
 *
 * Perfect for system announcements, important alerts, or call-to-action messages.
 * Displays with color-coded variants and optional dismiss functionality.
 *
 * @example
 * ```tsx
 * <BannerCard
 *   variant="warning"
 *   title="Scheduled Maintenance"
 *   description="System maintenance scheduled for Sunday, 2:00 AM - 4:00 AM. Some features may be unavailable."
 *   action={<Button variant="outline" size="sm">Learn More</Button>}
 *   dismissible
 *   onDismiss={() => console.log('dismissed')}
 * />
 * ```
 *
 * @example
 * ```tsx
 * <BannerCard
 *   variant="success"
 *   title="New Feature Available!"
 *   description="AI-powered exam generation is now live. Try it out today!"
 *   action={<Button size="sm">Get Started</Button>}
 * />
 * ```
 */
export function BannerCard({
  variant = "info",
  title,
  description,
  icon,
  action,
  dismissible = false,
  onDismiss,
  size = "md",
  className,
}: BannerCardProps) {
  const [dismissed, setDismissed] = React.useState(false)

  const sizeClasses = {
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
    xl: "p-8",
  }

  const Icon = icons[variant]

  const handleDismiss = () => {
    setDismissed(true)
    onDismiss?.()
  }

  if (dismissed) return null

  return (
    <Card
      className={cn(
        "border-s-4 transition-colors",
        variantClasses[variant],
        className
      )}
    >
      <CardContent className={cn(sizeClasses[size])}>
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={cn("mt-0.5 shrink-0", iconColors[variant])}>
            {icon || <Icon className="h-5 w-5" />}
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1 space-y-2">
            <h5 className="leading-tight">{title}</h5>
            {description && <p className="muted">{description}</p>}
            {action && <div className="pt-1">{action}</div>}
          </div>

          {/* Dismiss Button */}
          {dismissible && (
            <Button
              variant="ghost"
              size="sm"
              className="-me-2 -mt-1 h-8 w-8 shrink-0 p-0"
              onClick={handleDismiss}
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
