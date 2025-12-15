"use client"

import Link from "next/link"
import { ChevronRight, TrendingDown, TrendingUp } from "lucide-react"
import { motion } from "motion/react"

import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

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
    return (
      <MetricCardCompact
        {...{ title, value, icon, iconName, iconColor, href, className }}
      />
    )
  }

  if (variant === "mini") {
    return (
      <MetricCardMini {...{ title, value, icon, iconName, href, className }} />
    )
  }

  if (variant === "detailed") {
    return (
      <MetricCardDetailed
        {...{
          title,
          value,
          change,
          changeType,
          icon,
          iconName,
          iconColor,
          description,
          href,
          className,
        }}
      />
    )
  }

  const content = (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300",
        href && "hover:border-primary/30 cursor-pointer hover:shadow-md",
        className
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm font-medium">{title}</p>
            <motion.p
              className="text-foreground text-3xl font-bold"
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
                  changeType === "positive" &&
                    "text-emerald-600 dark:text-emerald-400",
                  changeType === "negative" && "text-destructive",
                  changeType === "neutral" && "text-muted-foreground"
                )}
              >
                {changeType === "positive" && (
                  <TrendingUp className="h-4 w-4" />
                )}
                {changeType === "negative" && (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span>
                  {changeType === "positive" ? "+" : ""}
                  {change}%
                </span>
                {description && (
                  <span className="text-muted-foreground ml-1">
                    {description}
                  </span>
                )}
              </div>
            )}
          </div>
          {Icon && (
            <div
              className={cn(
                "bg-muted/50 rounded-xl p-3 transition-colors",
                "group-hover:bg-primary/10",
                iconColor
              )}
            >
              <Icon className="h-6 w-6" />
            </div>
          )}
        </div>
        {href && (
          <div className="absolute right-4 bottom-4 opacity-0 transition-opacity group-hover:opacity-100">
            <ChevronRight className="text-muted-foreground h-5 w-5" />
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
        href && "hover:border-primary/30 cursor-pointer hover:shadow-md",
        className
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className={cn("bg-muted/50 rounded-lg p-2", iconColor)}>
              <Icon className="h-4 w-4" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-muted-foreground truncate text-xs">{title}</p>
            <p className="text-foreground text-xl font-bold">{value}</p>
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
        "bg-muted/30 flex items-center gap-2 rounded-lg p-2",
        href && "hover:bg-muted/50 cursor-pointer",
        className
      )}
    >
      {Icon && <Icon className="text-muted-foreground h-4 w-4" />}
      <span className="text-muted-foreground text-sm">{title}:</span>
      <span className="text-foreground text-sm font-medium">{value}</span>
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
        href && "hover:border-primary/30 cursor-pointer hover:shadow-md",
        className
      )}
    >
      <CardContent className="p-6">
        <div className="mb-4 flex items-start justify-between">
          {Icon && (
            <div className={cn("bg-muted/50 rounded-xl p-3", iconColor)}>
              <Icon className="h-6 w-6" />
            </div>
          )}
          {change !== undefined && (
            <div
              className={cn(
                "flex items-center gap-1 rounded-full px-2 py-1 text-sm font-medium",
                changeType === "positive" &&
                  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                changeType === "negative" &&
                  "bg-destructive/10 text-destructive",
                changeType === "neutral" && "bg-muted text-muted-foreground"
              )}
            >
              {changeType === "positive" && <TrendingUp className="h-3 w-3" />}
              {changeType === "negative" && (
                <TrendingDown className="h-3 w-3" />
              )}
              <span>
                {changeType === "positive" ? "+" : ""}
                {change}%
              </span>
            </div>
          )}
        </div>
        <div>
          <p className="text-muted-foreground mb-1 text-sm font-medium">
            {title}
          </p>
          <p className="text-foreground text-3xl font-bold">{value}</p>
          {description && (
            <p className="text-muted-foreground mt-2 text-sm">{description}</p>
          )}
        </div>
        {href && (
          <div className="absolute right-4 bottom-4 opacity-0 transition-opacity group-hover:opacity-100">
            <ChevronRight className="text-muted-foreground h-5 w-5" />
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
