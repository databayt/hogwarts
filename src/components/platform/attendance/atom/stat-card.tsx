"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { ElementType } from "react"
import {
  Users,
  CircleCheck,
  CircleAlert,
  Clock,
  TrendingUp,
  Calendar,
  UserCheck,
  UserX,
  UserMinus,
  Activity,
} from "lucide-react"

// Icon map for string-based icon names (prevents Server Component serialization issues)
const iconMap: Record<string, ElementType> = {
  Users,
  CircleCheck,
  CircleAlert,
  Clock,
  TrendingUp,
  Calendar,
  UserCheck,
  UserX,
  UserMinus,
  Activity,
}

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon?: ElementType
  iconName?: string
  trend?: "up" | "down" | "neutral"
  trendValue?: string
  className?: string
  variant?: "default" | "success" | "warning" | "danger" | "info"
}

const variantStyles = {
  default: {
    value: "text-foreground",
    icon: "text-muted-foreground",
  },
  success: {
    value: "text-green-600 dark:text-green-500",
    icon: "text-green-500",
  },
  warning: {
    value: "text-yellow-600 dark:text-yellow-500",
    icon: "text-yellow-500",
  },
  danger: {
    value: "text-red-600 dark:text-red-500",
    icon: "text-red-500",
  },
  info: {
    value: "text-blue-600 dark:text-blue-500",
    icon: "text-blue-500",
  },
}

export function StatCard({
  title,
  value,
  description,
  icon: IconProp,
  iconName,
  className,
  variant = "default",
}: StatCardProps) {
  const styles = variantStyles[variant]
  // Prefer iconName (string) over icon (component) to avoid serialization issues
  const Icon = iconName ? iconMap[iconName] : IconProp

  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className={cn("h-4 w-4", styles.icon)} />}
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-bold", styles.value)}>{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}
