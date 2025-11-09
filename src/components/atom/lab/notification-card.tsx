'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react"
import type { BaseVariant } from "./types"

interface NotificationCardProps {
  /**
   * Notification title
   */
  title: string
  /**
   * Notification message
   */
  message: string
  /**
   * Notification type
   * @default "info"
   */
  type?: "info" | "success" | "warning" | "error"
  /**
   * Show dismiss button
   * @default true
   */
  dismissible?: boolean
  /**
   * Dismiss handler
   */
  onDismiss?: () => void
  /**
   * Action button
   */
  action?: React.ReactNode
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

const variants = {
  info: "border-chart-1",
  success: "border-chart-2",
  warning: "border-chart-3",
  error: "border-destructive",
}

/**
 * NotificationCard - Alert/notification card with dismiss
 *
 * Perfect for system alerts, status updates, or important messages.
 * Supports multiple notification types with appropriate icons.
 *
 * @example
 * ```tsx
 * <NotificationCard
 *   type="success"
 *   title="Payment Received"
 *   message="Your payment of $99.00 has been processed successfully."
 *   action={<Button size="sm">View Receipt</Button>}
 *   dismissible
 *   onDismiss={() => console.log('dismissed')}
 * />
 * ```
 */
export function NotificationCard({
  title,
  message,
  type = "info",
  dismissible = true,
  onDismiss,
  action,
  className,
}: NotificationCardProps) {
  const [dismissed, setDismissed] = React.useState(false)

  const handleDismiss = () => {
    setDismissed(true)
    onDismiss?.()
  }

  if (dismissed) return null

  const Icon = icons[type]

  return (
    <Card className={cn("border-l-4", variants[type], className)}>
      <CardContent className="p-4">
        <div className="flex gap-3">
          <div className="shrink-0 mt-0.5">
            <Icon className="h-5 w-5 text-foreground" />
          </div>

          <div className="flex-1 min-w-0 space-y-1">
            <h5 className="font-semibold text-foreground">{title}</h5>
            <p className="muted">{message}</p>
            {action && <div className="pt-2">{action}</div>}
          </div>

          {dismissible && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
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
