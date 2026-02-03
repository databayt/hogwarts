"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface GridCardProps {
  /** Icon element or path to SVG in /public/anthropic */
  icon?: React.ReactNode | string
  /** Avatar for people cards - takes priority over icon */
  avatar?: {
    src?: string | null
    fallback: string
  }
  /** Main title */
  title: string
  /** Primary description text */
  description?: string
  /** Secondary description for additional info */
  subtitle?: string
  /** Click handler */
  onClick?: () => void
  /** Optional href for Link */
  href?: string
  /** Additional class names */
  className?: string
}

function GridCardInner({
  icon,
  avatar,
  title,
  description,
  subtitle,
  onClick,
  href,
  className,
}: GridCardProps) {
  const cardContent = (
    <div
      className={cn(
        "bg-background hover:border-primary text-foreground relative overflow-hidden rounded-lg border p-2 transition-[border-color] duration-200",
        (onClick || href) && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <div className="flex h-[180px] flex-col justify-between rounded-sm p-6">
        {/* Avatar or Icon at top */}
        <div className="text-foreground">
          {avatar ? (
            <Avatar className="h-12 w-12">
              {avatar.src && <AvatarImage src={avatar.src} alt={title} />}
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                {avatar.fallback}
              </AvatarFallback>
            </Avatar>
          ) : typeof icon === "string" ? (
            <Image
              src={icon}
              alt=""
              width={48}
              height={48}
              className="h-12 w-12"
            />
          ) : (
            icon
          )}
        </div>

        {/* Title + Description at bottom */}
        <div className="space-y-1">
          <h4 className="text-foreground truncate font-medium">{title}</h4>
          {description && (
            <p className="text-muted-foreground truncate text-sm">
              {description}
            </p>
          )}
          {subtitle && (
            <p className="text-muted-foreground/70 truncate text-xs">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  )

  if (href) {
    return <Link href={href}>{cardContent}</Link>
  }

  return cardContent
}

export const GridCard = React.memo(GridCardInner)

/**
 * Grid container component
 */
interface GridContainerProps {
  children: React.ReactNode
  columns?: 1 | 2 | 3 | 4
  className?: string
}

export function GridContainer({
  children,
  columns = 3,
  className,
}: GridContainerProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  }

  return (
    <div className={cn("grid gap-4", gridCols[columns], className)}>
      {children}
    </div>
  )
}

/**
 * Empty state for grid view
 */
interface GridEmptyStateProps {
  title?: string
  description?: string
  action?: React.ReactNode
  icon?: React.ReactNode
}

export function GridEmptyState({
  title = "No items found",
  description = "Try adjusting your search or filters",
  action,
  icon,
}: GridEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && <div className="text-muted-foreground mb-4">{icon}</div>}
      <h3 className="font-medium">{title}</h3>
      <p className="text-muted-foreground mt-1 max-w-sm text-sm">
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
