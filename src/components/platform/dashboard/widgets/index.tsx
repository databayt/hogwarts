"use client"

import * as React from "react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Calendar, Clock, TrendingUp, TrendingDown, ChevronRight, Bell, Users, BookOpen, GraduationCap, DollarSign } from "lucide-react"
import type { ElementType } from "react"
import Link from "next/link"

// ============================================================================
// Activity Rings - Apple-style circular progress indicators
// ============================================================================

interface ActivityRingData {
  label: string
  value: number
  color: string
  current: number
  target: number
  unit: string
}

interface ActivityRingsProps {
  activities: ActivityRingData[]
  title?: string
  className?: string
}

function CircleProgress({ data, index, size }: { data: ActivityRingData; index: number; size: number }) {
  const strokeWidth = 12
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const progress = ((100 - data.value) / 100) * circumference

  const gradientId = `gradient-${data.label.toLowerCase().replace(/\s+/g, '-')}-${index}`

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay: index * 0.15, ease: "easeOut" }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-label={`${data.label} - ${data.value}%`}
      >
        <title>{`${data.label} - ${data.value}%`}</title>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: data.color, stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: data.color, stopOpacity: 0.6 }} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: progress }}
          transition={{ duration: 1.5, delay: index * 0.15, ease: "easeInOut" }}
          strokeLinecap="round"
          style={{ filter: "drop-shadow(0 0 4px rgba(0,0,0,0.1))" }}
        />
      </svg>
    </motion.div>
  )
}

export function ActivityRings({ activities, title, className }: ActivityRingsProps) {
  const sizes = [160, 130, 100] // Outer to inner

  return (
    <Card className={cn("p-6", className)}>
      {title && (
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className="p-0">
        <div className="flex items-center gap-6">
          <div className="relative h-[160px] w-[160px]">
            {activities.slice(0, 3).map((activity, index) => (
              <CircleProgress
                key={activity.label}
                data={activity}
                index={index}
                size={sizes[index] || 80}
              />
            ))}
          </div>
          <div className="flex flex-col gap-3">
            {activities.slice(0, 3).map((activity) => (
              <motion.div
                key={activity.label}
                className="flex flex-col"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {activity.label}
                </span>
                <span className="text-lg font-semibold" style={{ color: activity.color }}>
                  {activity.current}/{activity.target}
                  <span className="ml-1 text-sm text-muted-foreground">{activity.unit}</span>
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Welcome Banner - Personalized greeting with date/time
// ============================================================================

interface WelcomeBannerProps {
  userName?: string
  role?: string
  greeting?: string
  subtitle?: string
  className?: string
}

export function WelcomeBanner({ userName, role, greeting, subtitle, className }: WelcomeBannerProps) {
  const [currentTime, setCurrentTime] = React.useState<string>("")
  const [currentDate, setCurrentDate] = React.useState<string>("")

  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
      setCurrentDate(now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }))
    }
    updateTime()
    const interval = setInterval(updateTime, 60000)
    return () => clearInterval(interval)
  }, [])

  const getGreeting = () => {
    if (greeting) return greeting
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 18) return "Good afternoon"
    return "Good evening"
  }

  return (
    <Card className={cn("bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <motion.h2
              className="text-2xl font-semibold text-foreground"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {getGreeting()}{userName ? `, ${userName}` : ""}
            </motion.h2>
            <motion.p
              className="text-muted-foreground mt-1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {subtitle || `Welcome to your ${role || 'dashboard'}`}
            </motion.p>
          </div>
          <div className="text-right hidden sm:block">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-2xl font-medium text-foreground">{currentTime}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{currentDate}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Metric Card - Beautiful stat card with icon and trend
// ============================================================================

interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  changeType?: "positive" | "negative" | "neutral"
  icon?: ElementType
  iconColor?: string
  description?: string
  href?: string
  className?: string
}

export function MetricCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  iconColor = "text-primary",
  description,
  href,
  className,
}: MetricCardProps) {
  const content = (
    <Card className={cn(
      "group relative overflow-hidden transition-all duration-300",
      href && "hover:shadow-md hover:border-primary/30 cursor-pointer",
      className
    )}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <motion.p
              className="text-3xl font-bold text-foreground"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {value}
            </motion.p>
            {change !== undefined && (
              <div className={cn(
                "flex items-center gap-1 text-sm font-medium",
                changeType === "positive" && "text-emerald-600 dark:text-emerald-400",
                changeType === "negative" && "text-destructive",
                changeType === "neutral" && "text-muted-foreground"
              )}>
                {changeType === "positive" && <TrendingUp className="h-4 w-4" />}
                {changeType === "negative" && <TrendingDown className="h-4 w-4" />}
                <span>{changeType === "positive" ? "+" : ""}{change}%</span>
                {description && (
                  <span className="text-muted-foreground ml-1">{description}</span>
                )}
              </div>
            )}
          </div>
          {Icon && (
            <div className={cn(
              "rounded-xl p-3 bg-muted/50 transition-colors",
              "group-hover:bg-primary/10",
              iconColor
            )}>
              <Icon className="h-6 w-6" />
            </div>
          )}
        </div>
        {href && (
          <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
      </CardContent>
    </Card>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }
  return content
}

// ============================================================================
// Schedule Item - For timetable/calendar items
// ============================================================================

interface ScheduleItemProps {
  time: string
  title: string
  subtitle?: string
  badge?: string
  badgeVariant?: "default" | "secondary" | "destructive" | "outline"
  isActive?: boolean
  className?: string
}

export function ScheduleItem({
  time,
  title,
  subtitle,
  badge,
  badgeVariant = "default",
  isActive,
  className
}: ScheduleItemProps) {
  return (
    <div className={cn(
      "flex items-center gap-4 p-3 rounded-lg border transition-colors",
      isActive && "bg-primary/5 border-primary/30",
      !isActive && "hover:bg-muted/50",
      className
    )}>
      <div className="flex-shrink-0 w-16 text-center">
        <span className={cn(
          "text-sm font-medium",
          isActive ? "text-primary" : "text-muted-foreground"
        )}>
          {time}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{title}</p>
        {subtitle && (
          <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
        )}
      </div>
      {badge && (
        <Badge variant={badgeVariant}>{badge}</Badge>
      )}
    </div>
  )
}

// ============================================================================
// Announcement Card - For school announcements
// ============================================================================

interface AnnouncementCardProps {
  title: string
  content: string
  date: string | Date
  author?: string
  priority?: "high" | "normal" | "low"
  href?: string
  className?: string
}

export function AnnouncementCard({
  title,
  content,
  date,
  author,
  priority = "normal",
  href,
  className
}: AnnouncementCardProps) {
  const formattedDate = (() => {
    if (!date) return "-"
    if (typeof date === 'string') return date
    try {
      return date.toLocaleDateString()
    } catch {
      return "-"
    }
  })()

  return (
    <div className={cn(
      "p-4 rounded-lg border transition-colors hover:bg-muted/50",
      priority === "high" && "border-l-4 border-l-destructive",
      className
    )}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-medium text-foreground line-clamp-1">{title}</h4>
        {priority === "high" && (
          <Badge variant="destructive" className="flex-shrink-0">Urgent</Badge>
        )}
      </div>
      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{content}</p>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{formattedDate}</span>
        {author && <span>by {author}</span>}
      </div>
    </div>
  )
}

// ============================================================================
// Progress Card - For tracking goals/completion
// ============================================================================

interface ProgressCardProps {
  title: string
  current: number
  total: number
  unit?: string
  icon?: ElementType
  color?: string
  showPercentage?: boolean
  className?: string
}

export function ProgressCard({
  title,
  current,
  total,
  unit = "",
  icon: Icon,
  color = "bg-primary",
  showPercentage = true,
  className,
}: ProgressCardProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0

  return (
    <Card className={cn("p-4", className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
        </div>
        {showPercentage && (
          <span className="text-sm font-medium text-foreground">{percentage}%</span>
        )}
      </div>
      <Progress value={percentage} className={cn("h-2", `[&>div]:${color}`)} />
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>{current} {unit}</span>
        <span>of {total} {unit}</span>
      </div>
    </Card>
  )
}

// ============================================================================
// Quick Actions Grid - Shortcut buttons
// ============================================================================

interface QuickActionItem {
  label: string
  icon: ElementType
  href: string
  color?: string
}

interface QuickActionsGridProps {
  actions: QuickActionItem[]
  title?: string
  columns?: 2 | 3 | 4
  className?: string
}

export function QuickActionsGrid({
  actions,
  title,
  columns = 4,
  className
}: QuickActionsGridProps) {
  return (
    <Card className={className}>
      {title && (
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className={cn(!title && "pt-6")}>
        <div className={cn(
          "grid gap-3",
          columns === 2 && "grid-cols-2",
          columns === 3 && "grid-cols-3",
          columns === 4 && "grid-cols-2 sm:grid-cols-4"
        )}>
          {actions.map((action) => (
            <Link key={action.label} href={action.href}>
              <Button
                variant="outline"
                className={cn(
                  "w-full h-auto py-4 flex flex-col gap-2 hover:bg-primary/5 hover:border-primary/30",
                  action.color
                )}
              >
                <action.icon className="h-5 w-5" />
                <span className="text-xs font-medium">{action.label}</span>
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Chart Card Wrapper - Consistent styling for charts
// ============================================================================

interface ChartCardProps {
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
}

export function ChartCard({ title, description, children, footer, className }: ChartCardProps) {
  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex-1">
        {children}
      </CardContent>
      {footer && (
        <div className="px-6 pb-6 pt-0 text-sm text-muted-foreground">
          {footer}
        </div>
      )}
    </Card>
  )
}

// ============================================================================
// Empty State - For sections with no data
// ============================================================================

interface EmptyStateProps {
  icon?: ElementType
  title: string
  description?: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className
}: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-8 px-4 text-center",
      className
    )}>
      {Icon && (
        <div className="rounded-full bg-muted p-4 mb-4">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
      )}
      <h3 className="font-medium text-foreground mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mb-4 max-w-sm">{description}</p>
      )}
      {action && (
        action.href ? (
          <Link href={action.href}>
            <Button variant="outline" size="sm">{action.label}</Button>
          </Link>
        ) : (
          <Button variant="outline" size="sm" onClick={action.onClick}>
            {action.label}
          </Button>
        )
      )}
    </div>
  )
}

// Export all components
export {
  type ActivityRingData,
  type ActivityRingsProps,
  type WelcomeBannerProps,
  type MetricCardProps,
  type ScheduleItemProps,
  type AnnouncementCardProps,
  type ProgressCardProps,
  type QuickActionItem,
  type QuickActionsGridProps,
  type ChartCardProps,
  type EmptyStateProps,
}
