import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"
import type { CardSize } from "./types"

interface CollapsibleCardProps {
  /**
   * Card title
   */
  title: string
  /**
   * Optional summary element (visible when collapsed)
   */
  summary?: React.ReactNode
  /**
   * Card content (children)
   */
  children: React.ReactNode
  /**
   * Default open state
   * @default false
   */
  defaultOpen?: boolean
  /**
   * Controlled open state
   */
  open?: boolean
  /**
   * Open state change handler
   */
  onOpenChange?: (open: boolean) => void
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

/**
 * CollapsibleCard - Expandable/collapsible card
 *
 * Perfect for long lists, detailed information, or content
 * that should be hidden by default to save screen space.
 *
 * @example
 * ```tsx
 * <CollapsibleCard
 *   title="Recent Activity"
 *   summary={<p className="muted">{activities.length} activities</p>}
 *   defaultOpen={false}
 * >
 *   <ActivityList items={activities} />
 * </CollapsibleCard>
 * ```
 */
export function CollapsibleCard({
  title,
  summary,
  children,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
  size = "md",
  className,
}: CollapsibleCardProps) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen)

  const isControlled = controlledOpen !== undefined
  const isOpen = isControlled ? controlledOpen : internalOpen

  const handleToggle = () => {
    const newState = !isOpen
    if (!isControlled) {
      setInternalOpen(newState)
    }
    onOpenChange?.(newState)
  }

  const sizeClasses = {
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
    xl: "p-8",
  }

  return (
    <Card className={cn(className)}>
      <CardHeader className={cn(sizeClasses[size])}>
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0 space-y-1">
            <CardTitle>{title}</CardTitle>
            {!isOpen && summary && summary}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggle}
            aria-label={isOpen ? "Collapse" : "Expand"}
            className="shrink-0"
          >
            {isOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      {isOpen && (
        <CardContent
          className={cn(
            sizeClasses[size],
            "pt-0 animate-in slide-in-from-top-2 duration-200"
          )}
        >
          {children}
        </CardContent>
      )}
    </Card>
  )
}
