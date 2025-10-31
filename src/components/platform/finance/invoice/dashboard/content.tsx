"use client";
import { Button } from "@/components/ui/button";
import { ChartInvoice } from "./chart-invoice";
import { ChartConfig } from "@/components/ui/chart";
import { useEffect, useState } from "react";
import type { UserInvoice } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { RecentInvoicesCard, StatsCards } from "./card";

import { chartConfig } from "./config";
import { type Locale } from '@/components/internationalization/config'
import { type Dictionary } from '@/components/internationalization/dictionaries'

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
  });

  const fetchData = async () => {
    try {
      const response = await fetch("/api/dashboard");
      const responseData = await response.json();

      console.log("responseData",responseData)
      if (response.status === 200) {
        setData({
          totalRevenue: responseData.totalRevenue,
          totalInvoice: responseData.totalInvoice,
          paidInvoice: responseData.paidInvoice,
          UnpaidInvoice: responseData.UnpaidInvoice,
          recentInvoice: responseData.recentInvoice || [],
          chartData: responseData.chartData || [],
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

   const columns: ColumnDef<UserInvoice>[] = [
    {
      accessorKey: "invoice_no",
      header: "Invoice No",
    },
    {
      accessorKey: "invoice_date",
      header: "Date",
      cell: ({ row }) => {
         return format(row.original.invoice_date, "PP");
      },
    }, 
    {
      accessorKey: "total",
      header: "Amount",
      cell: ({ row }) => {
        const totalAmountInCurrencyFormat = new Intl.NumberFormat("en-us", {
          style: "currency",
          currency: row.original.currency,
        }).format(row.original.total);

        return totalAmountInCurrencyFormat;
      },
    },
    {
       accessorKey : "status",
       header : "Status",
       cell : ({row})=>{
        return <Badge>{row.original.status}</Badge>
       }
    },
  ];

  const d = dictionary?.finance?.invoice

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
        />

        {/***chart */}
        <ChartInvoice chartConfig={chartConfig} chartData={data.chartData} />

        {/***latest 10 Invoice last 30days */}
        <RecentInvoicesCard
          className="lg:col-span-2"
          data={data?.recentInvoice as unknown as UserInvoice[]}
          columns={columns}
        />
      </div>
      </div>
    </div>
  );
}
