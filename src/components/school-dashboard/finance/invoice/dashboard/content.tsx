"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import dynamic from "next/dynamic"
import type { UserInvoice } from "@prisma/client"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { ar, enUS } from "date-fns/locale"

import { Badge } from "@/components/ui/badge"
import { type Locale } from "@/components/internationalization/config"
import { type Dictionary } from "@/components/internationalization/dictionaries"

import { formatCompactMoney } from "../../lib/format-money"
import { RecentInvoicesCard, StatsCards } from "./card"
import { getChartConfig } from "./config"

// recharts is the largest dependency on this route and the chart is a
// client-only canvas anyway — load it after the dashboard paints. The
// placeholder matches the card's own height so nothing shifts.
const ChartInvoice = dynamic(
  () => import("./chart-invoice").then((m) => m.ChartInvoice),
  {
    ssr: false,
    loading: () => (
      <div className="bg-card max-md:bg-muted col-span-2 h-80 rounded-xl border max-md:border-0 lg:h-96" />
    ),
  }
)

interface DashboardData {
  totalRevenue: number
  totalInvoices: number
  paidInvoices: number
  unpaidInvoices: number
  recentInvoices: any[]
  chartData: any[]
  currency?: string
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

  const currency = initialData?.currency ?? "USD"

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
      {/* Phone: an explicit two-column grid. With no columns set, the chart's
          col-span-2 conjured an implicit second track and pushed the whole
          grid past the screen's edge. The four stats sit two across. */}
      <div className="grid gap-6 max-md:grid-cols-2 max-md:gap-3 lg:grid-cols-4">
        <StatsCards
          stats={{
            // Summary tile — abbreviate (SDG 2.4m) so a seven-figure total
            // does not overflow the card.
            totalRevenue: formatCompactMoney(data.totalRevenue, currency, lang),
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
          className="max-md:bg-muted max-md:col-span-2 max-md:border-0 max-md:shadow-none lg:col-span-2"
          data={data.recentInvoice as unknown as UserInvoice[]}
          columns={columns}
          emptyText={ip?.noInvoiceFound}
          title={ip?.recentInvoice}
        />
      </div>
    </div>
  )
}
