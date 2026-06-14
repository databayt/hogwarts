// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export type RecentSale = {
  /** School name */
  name: string
  /** School domain (used as the secondary line) */
  email: string
  /** Pre-formatted amount, e.g. "+$299.00" */
  amount: string
}

interface RecentSalesProps {
  title: string
  description: string
  sales: RecentSale[]
  emptyLabel: string
}

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?"
  )
}

export function RecentSales({
  title,
  description,
  sales,
  emptyLabel,
}: RecentSalesProps) {
  return (
    <Card className="bg-muted h-full border-none shadow-none">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {sales.length === 0 ? (
          <p className="text-muted-foreground text-sm">{emptyLabel}</p>
        ) : (
          <div className="space-y-8">
            {sales.map((sale, index) => (
              <div key={index} className="flex items-center">
                <Avatar className="h-9 w-9">
                  <AvatarFallback>{initials(sale.name)}</AvatarFallback>
                </Avatar>
                <div className="ms-4 space-y-1">
                  <p className="text-sm leading-none font-medium">
                    {sale.name}
                  </p>
                  <p className="text-muted-foreground text-sm">{sale.email}</p>
                </div>
                <div className="ms-auto font-medium tabular-nums">
                  {sale.amount}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
