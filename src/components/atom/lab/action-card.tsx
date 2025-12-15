"use client"

import * as React from "react"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

import { IconWrapper } from "./icon-wrapper"
import type { BaseVariant } from "./types"

interface ActionCardProps {
  /**
   * Icon element
   */
  icon: React.ReactNode
  /**
   * Main title
   */
  title: string
  /**
   * Description text
   */
  description: string
  /**
   * Call-to-action button
   */
  action: React.ReactNode
  /**
   * Visual variant
   * @default "primary"
   */
  variant?: BaseVariant
  /**
   * Make card dismissible
   * @default false
   */
  dismissible?: boolean
  /**
   * Dismiss handler
   */
  onDismiss?: () => void
  /**
   * Additional CSS classes
   */
  className?: string
}

/**
 * ActionCard - Call-to-action prompt card
 *
 * Horizontal layout with icon, content, and action button.
 * Perfect for onboarding, feature highlights, or quick actions.
 *
 * @example
 * ```tsx
 * <ActionCard
 *   icon={<FileText />}
 *   title="Create Your First Exam"
 *   description="Generate exam papers with AI in minutes"
 *   action={<Button>Get Started</Button>}
 *   variant="primary"
 *   dismissible
 *   onDismiss={() => console.log('dismissed')}
 * />
 * ```
 */
export function ActionCard({
  icon,
  title,
  description,
  action,
  variant = "primary",
  dismissible = false,
  onDismiss,
  className,
}: ActionCardProps) {
  const [dismissed, setDismissed] = React.useState(false)

  const handleDismiss = () => {
    setDismissed(true)
    onDismiss?.()
  }

  if (dismissed) return null

  return (
    <Card
      className={cn("hover:bg-accent/50 relative transition-colors", className)}
    >
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className="shrink-0">
            <IconWrapper icon={icon} variant={variant} size="lg" />
          </div>

          {/* Content */}
          <div className="flex-1 space-y-1">
            <h4>{title}</h4>
            <p className="muted">{description}</p>
          </div>

          {/* Action */}
          <div className="shrink-0">{action}</div>

          {/* Dismiss button */}
          {dismissible && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 h-8 w-8 shrink-0"
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
