import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { CardSize } from "./types"

interface ProfileCardProps {
  /**
   * Avatar element
   */
  avatar: React.ReactNode
  /**
   * User name
   */
  name: string
  /**
   * User role/title
   */
  role?: string
  /**
   * Additional info (email, location, etc.)
   */
  info?: string
  /**
   * Action buttons
   */
  actions?: React.ReactNode
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
 * ProfileCard - User profile card with avatar and details
 *
 * Perfect for team members, user directories, or contact lists.
 * Displays avatar, name, role, and optional actions.
 *
 * @example
 * ```tsx
 * <ProfileCard
 *   avatar={<Avatar src={user.avatar} fallback={user.initials} />}
 *   name="Sarah Johnson"
 *   role="Mathematics Teacher"
 *   info="sarah.j@school.edu"
 *   actions={
 *     <div className="flex gap-2">
 *       <Button size="sm" variant="outline">Message</Button>
 *       <Button size="sm">View Profile</Button>
 *     </div>
 *   }
 *   onClick={() => router.push(`/profile/${user.id}`)}
 * />
 * ```
 */
export function ProfileCard({
  avatar,
  name,
  role,
  info,
  actions,
  size = "md",
  loading = false,
  onClick,
  className,
}: ProfileCardProps) {
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
            <Skeleton className="h-16 w-16 rounded-full mx-auto" />
            <div className="space-y-1 text-center">
              <Skeleton className="h-5 w-32 mx-auto" />
              <Skeleton className="h-4 w-24 mx-auto" />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Avatar */}
            <div className="flex justify-center">{avatar}</div>

            {/* Info */}
            <div className="space-y-1 text-center">
              <h4 className="font-semibold text-foreground">{name}</h4>
              {role && <p className="muted">{role}</p>}
              {info && <p className="muted">{info}</p>}
            </div>

            {/* Actions */}
            {actions && (
              <div className="flex justify-center gap-2">{actions}</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
