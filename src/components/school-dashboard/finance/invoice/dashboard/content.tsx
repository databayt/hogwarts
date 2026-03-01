"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState } from "react"
import type { UserInvoice } from "@prisma/client"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChartConfig } from "@/components/ui/chart"
import { type Locale } from "@/components/internationalization/config"
import { type Dictionary } from "@/components/internationalization/dictionaries"

import { RecentInvoicesCard, StatsCards } from "./card"
import { ChartInvoice } from "./chart-invoice"
import { chartConfig } from "./config"

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export function DashboardContent({ dictionary, lang }: Props) {
  const [data, setData] = useState({
    totalRevenue: "$0",
    totalInvoice: 0,
    paidInvoice: 0,
    UnpaidInvoice: 0,
    recentInvoice: [],
    chartData: [],
  })

  const fetchData = async () => {
    try {
      const response = await fetch("/api/dashboard")
      const responseData = await response.json()

      console.log("responseData", responseData)
      if (response.status === 200) {
        setData({
          totalRevenue: responseData.totalRevenue,
          totalInvoice: responseData.totalInvoice,
          paidInvoice: responseData.paidInvoice,
          UnpaidInvoice: responseData.UnpaidInvoice,
          recentInvoice: responseData.recentInvoice || [],
          chartData: responseData.chartData || [],
        })
      }
    } catch (error) {
      console.log(error)
    }
  }

  const fd = (dictionary as any)?.finance
  const ip = fd?.invoicePage as Record<string, string> | undefined

  useEffect(() => {
    fetchData()
  }, [])

  const columns: ColumnDef<UserInvoice>[] = [
    {
      accessorKey: "invoice_no",
      header: ip?.invoiceNo || "Invoice No",
    },
    {
      accessorKey: "invoice_date",
      header: ip?.date || "Date",
      cell: ({ row }) => {
        return format(row.original.invoice_date, "PP")
      },
    },
    {
      accessorKey: "total",
      header: ip?.amount || "Amount",
      cell: ({ row }) => {
        const totalAmountInCurrencyFormat = new Intl.NumberFormat(lang, {
          style: "currency",
          currency: row.original.currency,
        }).format(row.original.total)

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
            totalRevenue: data?.totalRevenue ?? "-",
            totalInvoice: data?.totalInvoice ?? "-",
            paidInvoice: data?.paidInvoice ?? "-",
            UnpaidInvoice: data?.UnpaidInvoice ?? "-",
          }}
          dict={ip}
        />

        {/***chart */}
        <ChartInvoice chartConfig={chartConfig} chartData={data.chartData} />

        {/***latest 10 Invoice last 30days */}
        <RecentInvoicesCard
          className="lg:col-span-2"
          data={data?.recentInvoice as unknown as UserInvoice[]}
          columns={columns}
          emptyText={ip?.noInvoiceFound}
          title={ip?.recentInvoice}
        />
      </div>
    </div>
  )
}
