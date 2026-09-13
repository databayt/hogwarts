"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { ReactNode } from "react"
import type { UserInvoice } from "@prisma/client"
import { ColumnDef } from "@tanstack/react-table"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { getStatsCardDefs } from "./config"
import { DataTable } from "./data-table"

interface StatCardProps {
  title: string
  value: ReactNode
  subtitle?: string
  className?: string
}

export function StatCard({
  title,
  value,
  subtitle = "last 30 days",
  className,
}: StatCardProps) {
  return (
    <Card
      className={`bg-muted grid gap-3 border-none shadow-none max-md:gap-1 ${className ?? ""}`}
    >
      {/* Phone: label small and muted over a bold figure, as every other
          stat cell on a phone reads. */}
      <CardHeader className="max-md:px-4 max-md:pt-4 max-md:pb-0">
        <CardTitle className="max-md:text-muted-foreground text-xl max-md:line-clamp-1 max-md:text-xs max-md:font-normal">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="max-md:px-4 max-md:pb-4">
        <div>
          <p className="text-lg max-md:font-bold max-md:tabular-nums">
            {value}
          </p>
          <span className="text-muted-foreground text-xs">{subtitle}</span>
        </div>
      </CardContent>
    </Card>
  )
}

export interface StatsData {
  totalRevenue: string | number
  totalInvoice: number | string
  paidInvoice: number | string
  UnpaidInvoice: number | string
}

export function StatsCards({
  stats,
  dict,
}: {
  stats: StatsData
  dict?: Record<string, string>
}) {
  const titleMap: Record<string, string> = {
    totalRevenue: dict?.totalRevenue || "Total Revenue",
    totalInvoice: dict?.totalInvoice || "Total Invoice",
    paidInvoice: dict?.paidInvoice || "Paid Invoice",
    UnpaidInvoice: dict?.unpaidInvoice || "Unpaid Invoice",
  }
  const defs = getStatsCardDefs(dict)
  return (
    <>
      {defs.map((def) => (
        <StatCard
          key={def.key}
          title={titleMap[def.key] || def.title}
          value={stats[def.key as keyof StatsData]}
          subtitle={dict?.last30Days}
        />
      ))}
    </>
  )
}

interface RecentInvoicesCardProps<TData> {
  data: TData[]
  columns: ColumnDef<TData, unknown>[]
  emptyText?: string
  title?: string
  className?: string
}

export function RecentInvoicesCard({
  data,
  columns,
  emptyText = "No invoice found",
  title,
  className,
}: RecentInvoicesCardProps<UserInvoice>) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title || "Recent Invoice"}</CardTitle>
      </CardHeader>
      <CardContent>
        {data?.length === 0 ? (
          <p className="py-4 text-center">{emptyText}</p>
        ) : (
          <DataTable data={data} columns={columns} />
        )}
      </CardContent>
    </Card>
  )
}
