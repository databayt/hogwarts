"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface MRRByPlanProps {
  data: {
    BASIC: number;
    PREMIUM: number;
    ENTERPRISE: number;
  };
}

export function MRRByPlan({ data }: MRRByPlanProps) {
  const chartData = [
    { name: "Basic", value: data.BASIC, fill: "hsl(var(--chart-1))" },
    { name: "Premium", value: data.PREMIUM, fill: "hsl(var(--chart-2))" },
    { name: "Enterprise", value: data.ENTERPRISE, fill: "hsl(var(--chart-3))" },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

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
          <span className="text-2xl font-bold">{formatCurrency(total)}</span>
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
              tickFormatter={formatCurrency}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : 0;
                  return (
                    <div className="rounded-lg border bg-background p-3 shadow-lg">
                      <div className="grid gap-2">
                        <span className="font-semibold">{data.name}</span>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold">{formatCurrency(data.value)}</span>
                          <span className="text-xs text-muted-foreground">{percentage}% of total</span>
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
            const percentage = total > 0 ? ((item.value / total) * 100).toFixed(0) : 0;
            return (
              <div key={item.name} className="flex flex-col">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-sm"
                    style={{ backgroundColor: item.fill }}
                  />
                  <span className="text-xs text-muted-foreground">{item.name}</span>
                </div>
                <span className="text-sm font-semibold">{percentage}%</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
