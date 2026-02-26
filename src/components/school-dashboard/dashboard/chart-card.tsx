"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import * as React from "react"

import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import type { ChartCardProps } from "./types"

function ChartCardInner({
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

export const ChartCard = React.memo(ChartCardInner)
