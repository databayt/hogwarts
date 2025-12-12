"use client"

import { motion } from "motion/react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, ChevronRight } from "lucide-react"
import Link from "next/link"
import { getIcon } from "./config"
import type { MetricCardProps, MetricCardVariant } from "./types"

interface MetricCardExtendedProps extends MetricCardProps {
  variant?: MetricCardVariant
}

export function MetricCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon,
  iconName,
  iconColor = "text-primary",
  description,
  href,
  className,
  variant = "default",
}: MetricCardExtendedProps) {
  const Icon = icon || getIcon(iconName)

  if (variant === "compact") {
    return <MetricCardCompact {...{ title, value, icon, iconName, iconColor, href, className }} />
  }

  if (variant === "mini") {
    return <MetricCardMini {...{ title, value, icon, iconName, href, className }} />
  }

  if (variant === "detailed") {
    return (
      <MetricCardDetailed
        {...{ title, value, change, changeType, icon, iconName, iconColor, description, href, className }}
      />
    )
  }

  const content = (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300",
        href && "hover:shadow-md hover:border-primary/30 cursor-pointer",
        className
      )}
    >
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
              <div
                className={cn(
                  "flex items-center gap-1 text-sm font-medium",
                  changeType === "positive" && "text-emerald-600 dark:text-emerald-400",
                  changeType === "negative" && "text-destructive",
                  changeType === "neutral" && "text-muted-foreground"
                )}
              >
                {changeType === "positive" && <TrendingUp className="h-4 w-4" />}
                {changeType === "negative" && <TrendingDown className="h-4 w-4" />}
                <span>
                  {changeType === "positive" ? "+" : ""}
                  {change}%
                </span>
                {description && (
                  <span className="text-muted-foreground ml-1">{description}</span>
                )}
              </div>
            )}
          </div>
          {Icon && (
            <div
              className={cn(
                "rounded-xl p-3 bg-muted/50 transition-colors",
                "group-hover:bg-primary/10",
                iconColor
              )}
            >
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

function MetricCardCompact({
  title,
  value,
  icon,
  iconName,
  iconColor = "text-primary",
  href,
  className,
}: MetricCardProps) {
  const Icon = icon || getIcon(iconName)

  const content = (
    <Card
      className={cn(
        "group transition-all duration-300",
        href && "hover:shadow-md hover:border-primary/30 cursor-pointer",
        className
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className={cn("rounded-lg p-2 bg-muted/50", iconColor)}>
              <Icon className="h-4 w-4" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground truncate">{title}</p>
            <p className="text-xl font-bold text-foreground">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }
  return content
}

function MetricCardMini({
  title,
  value,
  icon,
  iconName,
  href,
  className,
}: MetricCardProps) {
  const Icon = icon || getIcon(iconName)

  const content = (
    <div
      className={cn(
        "flex items-center gap-2 p-2 rounded-lg bg-muted/30",
        href && "hover:bg-muted/50 cursor-pointer",
        className
      )}
    >
      {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      <span className="text-sm text-muted-foreground">{title}:</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }
  return content
}

function MetricCardDetailed({
  title,
  value,
  change,
  changeType = "neutral",
  icon,
  iconName,
  iconColor = "text-primary",
  description,
  href,
  className,
}: MetricCardProps) {
  const Icon = icon || getIcon(iconName)

  const content = (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300",
        href && "hover:shadow-md hover:border-primary/30 cursor-pointer",
        className
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          {Icon && (
            <div className={cn("rounded-xl p-3 bg-muted/50", iconColor)}>
              <Icon className="h-6 w-6" />
            </div>
          )}
          {change !== undefined && (
            <div
              className={cn(
                "flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full",
                changeType === "positive" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                changeType === "negative" && "bg-destructive/10 text-destructive",
                changeType === "neutral" && "bg-muted text-muted-foreground"
              )}
            >
              {changeType === "positive" && <TrendingUp className="h-3 w-3" />}
              {changeType === "negative" && <TrendingDown className="h-3 w-3" />}
              <span>
                {changeType === "positive" ? "+" : ""}
                {change}%
              </span>
            </div>
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
          {description && (
            <p className="text-sm text-muted-foreground mt-2">{description}</p>
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
