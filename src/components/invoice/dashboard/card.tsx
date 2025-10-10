"use client";

import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "./data-table";
import { ColumnDef } from "@tanstack/react-table";
import type { UserInvoice } from "@prisma/client";
import { STATS_CARD_DEFS } from "./config";

interface StatCardProps {
  title: string;
  value: ReactNode;
  subtitle?: string;
  className?: string;
}

export function StatCard({ title, value, subtitle = "last 30 days", className }: StatCardProps) {
  return (
    <Card className={`grid gap-3 shadow-none border-none bg-muted ${className ?? ""}`}>
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div>
          <p className="text-lg">{value}</p>
          <span className="text-muted-foreground text-xs">{subtitle}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export interface StatsData {
  totalRevenue: string | number;
  totalInvoice: number | string;
  paidInvoice: number | string;
  UnpaidInvoice: number | string;
}

export function StatsCards({ stats }: { stats: StatsData }) {
  return (
    <>
      {STATS_CARD_DEFS.map((def) => (
        <StatCard
          key={def.key}
          title={def.title}
          value={stats[def.key as keyof StatsData]}
        />
      ))}
    </>
  );
}

interface RecentInvoicesCardProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  emptyText?: string;
  className?: string;
}

export function RecentInvoicesCard({
  data,
  columns,
  emptyText = "No invoice found",
  className,
}: RecentInvoicesCardProps<UserInvoice>) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Recent Invoice</CardTitle>
      </CardHeader>
      <CardContent>
        {data?.length === 0 ? (
          <p className="py-4 text-center">{emptyText}</p>
        ) : (
          <DataTable data={data} columns={columns} />
        )}
      </CardContent>
    </Card>
  );
}


