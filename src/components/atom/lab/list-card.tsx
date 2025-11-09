'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ListItem } from "./list-item"
import type { CardSize, ListItemData } from "./types"

interface ListCardProps {
  /**
   * Card title
   */
  title: string
  /**
   * Array of list items
   */
  items: ListItemData[]
  /**
   * Optional action element (e.g., "View All" button)
   */
  action?: React.ReactNode
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
   * Maximum items to display
   * @default undefined (show all)
   */
  maxItems?: number
  /**
   * Empty state message
   * @default "No items to display"
   */
  emptyMessage?: string
  /**
   * Additional CSS classes
   */
  className?: string
}

/**
 * ListCard - Activity feed or list card
 *
 * @example
 * ```tsx
 * <ListCard
 *   title="Recent Activity"
 *   items={[
 *     {
 *       icon: <UserPlus />,
 *       title: "New student enrolled",
 *       subtitle: "2 minutes ago",
 *       trailing: <MetricChip label="New" variant="success" />
 *     }
 *   ]}
 *   action={<Button variant="ghost" size="sm">View All</Button>}
 *   size="lg"
 *   maxItems={5}
 * />
 * ```
 */
export function ListCard({
  title,
  items,
  action,
  size = "md",
  loading = false,
  maxItems,
  emptyMessage = "No items to display",
  className,
}: ListCardProps) {
  const sizeClasses = {
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
    xl: "p-8",
  }

  const displayItems = maxItems ? items.slice(0, maxItems) : items

  return (
    <Card className={cn(className)}>
      <CardHeader className={cn(sizeClasses[size])}>
        {loading ? (
          <Skeleton className="h-6 w-32" />
        ) : (
          <>
            <CardTitle>{title}</CardTitle>
            {action && <CardAction>{action}</CardAction>}
          </>
        )}
      </CardHeader>
      <CardContent className={cn("space-y-0", sizeClasses[size], "pt-0")}>
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : displayItems.length > 0 ? (
          displayItems.map((item, index) => (
            <ListItem
              key={index}
              icon={item.icon}
              title={item.title}
              subtitle={item.subtitle}
              trailing={item.trailing}
              onClick={item.onClick}
            />
          ))
        ) : (
          <p className="muted py-3">{emptyMessage}</p>
        )}
      </CardContent>
    </Card>
  )
}
