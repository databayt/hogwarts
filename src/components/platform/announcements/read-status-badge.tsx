"use client"

import { Eye, EyeOff } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface ReadStatusBadgeProps {
  isRead: boolean
  variant?: "default" | "minimal"
  className?: string
}

export function ReadStatusBadge({
  isRead,
  variant = "default",
  className,
}: ReadStatusBadgeProps) {
  if (variant === "minimal") {
    return (
      <div
        className={cn(
          "flex h-2 w-2 rounded-full",
          isRead ? "bg-gray-300" : "bg-blue-500",
          className
        )}
        title={isRead ? "Read" : "Unread"}
      />
    )
  }

  return (
    <Badge
      variant={isRead ? "secondary" : "default"}
      className={cn(
        "gap-1",
        isRead ? "bg-gray-100 text-gray-600" : "bg-blue-100 text-blue-700",
        className
      )}
    >
      {isRead ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
      {isRead ? "Read" : "Unread"}
    </Badge>
  )
}
