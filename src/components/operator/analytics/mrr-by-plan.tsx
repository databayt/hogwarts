"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Locale } from "@/components/internationalization/config";
import { formatCurrency, formatPercentage } from "@/lib/i18n-format";

interface MRRByPlanProps {
  data: {
    BASIC: number;
    PREMIUM: number;
    ENTERPRISE: number;
  };
  lang: Locale;
}

export function MRRByPlan({ data, lang }: MRRByPlanProps) {
  const chartData = [
    { name: "Basic", value: data.BASIC, fill: "hsl(var(--chart-1))" },
    { name: "Premium", value: data.PREMIUM, fill: "hsl(var(--chart-2))" },
    { name: "Enterprise", value: data.ENTERPRISE, fill: "hsl(var(--chart-3))" },
  ];

  const total = data.BASIC + data.PREMIUM + data.ENTERPRISE;

  return (
    <Card>
      <CardHeader>
        <CardTitle>MRR by Plan</CardTitle>
        <CardDescription>Distribution of monthly recurring revenue across plans</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total MRR</span>
          <span className="text-2xl font-bold">{formatCurrency(total, lang, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="name"
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(value) => formatCurrency(value, lang, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  const percentage = total > 0 ? (data.value / total) : 0;
                  return (
                    <div className="rounded-lg border bg-background p-3 shadow-lg">
                      <div className="grid gap-2">
                        <span className="font-semibold">{data.name}</span>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold">{formatCurrency(data.value, lang, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                          <span className="text-xs text-muted-foreground">{formatPercentage(percentage, lang)} of total</span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="value" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 grid grid-cols-3 gap-4">
          {chartData.map((item) => {
            const percentage = total > 0 ? (item.value / total) : 0;
            return (
              <div key={item.name} className="flex flex-col">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-sm"
                    style={{ backgroundColor: item.fill }}
                  />
                  <span className="text-xs text-muted-foreground">{item.name}</span>
                </div>
                <span className="text-sm font-semibold">{formatPercentage(percentage, lang, { maximumFractionDigits: 0 })}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
