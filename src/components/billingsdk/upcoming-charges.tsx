"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { Calendar } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { useBillingText } from "./use-billing-text"

export interface ChargeItem {
  id: string
  description: string
  amount: string
  date: string
  type: "prorated" | "recurring" | "one-time"
}

export interface UpcomingChargesProps {
  className?: string
  title?: string
  description?: string
  nextBillingDate: string
  totalAmount: string
  charges: ChargeItem[]
}

export function UpcomingCharges({
  className,
  title,
  description,
  nextBillingDate,
  totalAmount,
  charges,
}: UpcomingChargesProps) {
  const b = useBillingText()
  const getChargeTypeBadge = (type: ChargeItem["type"]) => {
    switch (type) {
      case "prorated":
        return <Badge variant="secondary">{b.upcoming.prorated}</Badge>
      case "recurring":
        return <Badge variant="default">{b.upcoming.recurring}</Badge>
      case "one-time":
        return <Badge variant="outline">{b.upcoming.oneTime}</Badge>
      default:
        return <Badge variant="outline">{b.upcoming.unknown}</Badge>
    }
  }

  return (
    <Card className={cn("mx-auto w-full max-w-2xl", className)}>
      <CardHeader>
        <CardTitle>{title ?? b.dashboard.upcomingCharges}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-muted/30 rounded-lg border p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="text-muted-foreground h-5 w-5" />
              <div>
                <p className="text-muted-foreground text-sm">
                  {b.upcoming.nextBillingDate}
                </p>
                <p className="font-semibold">{nextBillingDate}</p>
              </div>
            </div>
            <div className="text-end">
              <p className="text-muted-foreground text-sm">
                {b.upcoming.total}
              </p>
              <p className="text-2xl font-bold tabular-nums">{totalAmount}</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold">{b.upcoming.breakdown}</h3>
          <div className="space-y-2">
            {charges.map((charge) => (
              <div
                key={charge.id}
                className="hover:bg-muted/50 rounded-lg border p-3 transition-colors"
              >
                <div className="mb-1.5 flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="font-medium">{charge.description}</span>
                    {getChargeTypeBadge(charge.type)}
                  </div>
                  <span className="shrink-0 font-semibold tabular-nums">
                    {charge.amount}
                  </span>
                </div>
                <p className="text-muted-foreground text-sm">{charge.date}</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
