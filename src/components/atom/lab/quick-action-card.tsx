"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

import type { CardSize } from "./types"

interface QuickAction {
  /**
   * Action icon
   */
  icon: React.ReactNode
  /**
   * Action label
   */
  label: string
  /**
   * Click handler
   */
  onClick: () => void
  /**
   * Disabled state
   */
  disabled?: boolean
}

interface QuickActionCardProps {
  /**
   * Card title
   */
  title?: string
  /**
   * Quick actions list
   */
  actions: QuickAction[]
  /**
   * Grid columns (2, 3, or 4)
   * @default 2
   */
  columns?: 2 | 3 | 4
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
   * Additional CSS classes
   */
  className?: string
}

/**
 * QuickActionCard - Grid of quick action buttons
 *
 * Perfect for lab shortcuts, frequently used actions, or navigation tiles.
 * Displays actions in a responsive grid with icons and labels.
 *
 * @example
 * ```tsx
 * <QuickActionCard
 *   title="Quick Actions"
 *   actions={[
 *     {
 *       icon: <Plus className="h-5 w-5" />,
 *       label: "Create New",
 *       onClick: () => router.push('/create')
 *     },
 *     {
 *       icon: <Upload className="h-5 w-5" />,
 *       label: "Upload",
 *       onClick: () => setUploadModalOpen(true)
 *     },
 *     {
 *       icon: <Share className="h-5 w-5" />,
 *       label: "Share",
 *       onClick: () => handleShare()
 *     },
 *     {
 *       icon: <Download className="h-5 w-5" />,
 *       label: "Export",
 *       onClick: () => handleExport()
 *     }
 *   ]}
 *   columns={2}
 * />
 * ```
 */
export function QuickActionCard({
  title,
  actions,
  columns = 2,
  size = "md",
  loading = false,
  className,
}: QuickActionCardProps) {
  const sizeClasses = {
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
    xl: "p-8",
  }

  const gridClasses = {
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-4",
  }

  return (
    <Card className={cn("transition-colors", className)}>
      {title && (
        <CardHeader className={cn(sizeClasses[size], "pb-3")}>
          {loading ? (
            <Skeleton className="h-5 w-32" />
          ) : (
            <h5 className="text-foreground font-medium">{title}</h5>
          )}
        </CardHeader>
      )}
      <CardContent className={cn(sizeClasses[size], title && "pt-0")}>
        {loading ? (
          <div className={cn("grid gap-3", gridClasses[columns])}>
            {Array.from({
              length: columns === 4 ? 4 : columns === 3 ? 3 : 2,
            }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="mx-auto h-10 w-10 rounded-lg" />
                <Skeleton className="mx-auto h-4 w-16" />
              </div>
            ))}
          </div>
        ) : (
          <div className={cn("grid gap-3", gridClasses[columns])}>
            {actions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                className={cn(
                  "h-auto flex-col gap-2 py-4",
                  "hover:bg-accent hover:text-accent-foreground",
                  "transition-colors"
                )}
                onClick={action.onClick}
                disabled={action.disabled}
              >
                <div className="bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground flex h-10 w-10 items-center justify-center rounded-lg transition-colors">
                  {action.icon}
                </div>
                <span className="text-sm font-medium">{action.label}</span>
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
