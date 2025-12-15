"use client"

import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import type { ChartCardProps } from "./types"

export function ChartCard({
  title,
  description,
  children,
  footer,
  className,
}: ChartCardProps) {
  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex-1">{children}</CardContent>
      {footer && (
        <div className="text-muted-foreground px-6 pt-0 pb-6 text-sm">
          {footer}
        </div>
      )}
    </Card>
  )
}
