"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type { UserInvoice } from "@prisma/client"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { ar, enUS } from "date-fns/locale"

import { Badge } from "@/components/ui/badge"
import { type Locale } from "@/components/internationalization/config"
import { type Dictionary } from "@/components/internationalization/dictionaries"

import { RecentInvoicesCard, StatsCards } from "./card"
import { ChartInvoice } from "./chart-invoice"
import { getChartConfig } from "./config"

interface DashboardData {
  totalRevenue: number
  totalInvoices: number
  paidInvoices: number
  unpaidInvoices: number
  recentInvoices: any[]
  chartData: any[]
}

interface Props {
  dictionary: Dictionary
  lang: Locale
  initialData?: DashboardData | null
}

export function DashboardContent({ dictionary, lang, initialData }: Props) {
  const fd = (dictionary as any)?.finance
  const ip = fd?.invoicePage as Record<string, string> | undefined
  const dateLocale = lang === "ar" ? ar : enUS

  const data = {
    totalRevenue: initialData?.totalRevenue ?? 0,
    totalInvoice: initialData?.totalInvoices ?? 0,
    paidInvoice: initialData?.paidInvoices ?? 0,
    UnpaidInvoice: initialData?.unpaidInvoices ?? 0,
    recentInvoice: initialData?.recentInvoices ?? [],
    chartData: initialData?.chartData ?? [],
  }

  const columns: ColumnDef<UserInvoice>[] = [
    {
      accessorKey: "invoice_no",
      header: ip?.invoiceNo || "Invoice No",
    },
    {
      accessorKey: "invoice_date",
      header: ip?.date || "Date",
      cell: ({ row }) => {
        return format(row.original.invoice_date, "PP", { locale: dateLocale })
      },
    },
    {
      accessorKey: "total",
      header: ip?.amount || "Amount",
      cell: ({ row }) => {
        const totalAmountInCurrencyFormat = new Intl.NumberFormat(lang, {
          style: "currency",
          currency: row.original.currency,
        }).format(Number(row.original.total))

        return totalAmountInCurrencyFormat
      },
    },
    {
      accessorKey: "status",
      header: ip?.status || "Status",
      cell: ({ row }) => {
        return <Badge>{row.original.status}</Badge>
      },
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-4">
        <StatsCards
          stats={{
            totalRevenue: new Intl.NumberFormat(lang, {
              style: "currency",
              currency: "SAR",
            }).format(data.totalRevenue),
            totalInvoice: data.totalInvoice,
            paidInvoice: data.paidInvoice,
            UnpaidInvoice: data.UnpaidInvoice,
          }}
          dict={ip}
        />

        <ChartInvoice
          chartConfig={getChartConfig(fd?.invoiceConfig?.dashboard)}
          chartData={data.chartData}
        />

        <RecentInvoicesCard
          className="lg:col-span-2"
          data={data.recentInvoice as unknown as UserInvoice[]}
          columns={columns}
          emptyText={ip?.noInvoiceFound}
          title={ip?.recentInvoice}
        />
      </div>
    </div>
  )
}
