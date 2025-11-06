"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ExpenseChartProps {
  expenseCategories: {
    category: string
    amount: number
    percentage: number
  }[]
  className?: string
}

const COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
  '#06b6d4', // cyan
  '#84cc16', // lime
]

export function ExpenseChart({ expenseCategories, className }: ExpenseChartProps) {
  // Sort categories by amount for better visualization
  const sortedCategories = [...expenseCategories].sort((a, b) => b.amount - a.amount)

  // Take top 8 categories and group the rest as "Other"
  const topCategories = sortedCategories.slice(0, 8)
  const otherCategories = sortedCategories.slice(8)

  if (otherCategories.length > 0) {
    const otherAmount = otherCategories.reduce((sum, cat) => sum + cat.amount, 0)
    const otherPercentage = otherCategories.reduce((sum, cat) => sum + cat.percentage, 0)
    topCategories.push({
      category: 'Other',
      amount: otherAmount,
      percentage: otherPercentage
    })
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload[0]) return null

    const data = payload[0]
    return (
      <div className="bg-background border rounded-lg shadow-lg p-3">
        <p className="font-semibold">{data.name || data.payload.category}</p>
        <p className="text-sm">
          Amount: SDG {new Intl.NumberFormat('en-SD').format(data.value)}
        </p>
        <p className="text-sm">
          Percentage: {data.payload.percentage.toFixed(1)}%
        </p>
      </div>
    )
  }

  // Custom label for pie chart
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }: any) => {
    if (percentage < 5) return null // Don't show label for small slices

    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${percentage.toFixed(0)}%`}
      </text>
    )
  }

  // Format Y-axis ticks
  const formatYAxis = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`
    }
    return value.toString()
  }

  // Calculate total
  const totalExpenses = topCategories.reduce((sum, cat) => sum + cat.amount, 0)

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Expense Breakdown</CardTitle>
        <CardDescription>
          Distribution of expenses by category
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pie" className="w-full">
          <TabsList className="grid w-full max-w-[200px] grid-cols-2">
            <TabsTrigger value="pie">Pie Chart</TabsTrigger>
            <TabsTrigger value="bar">Bar Chart</TabsTrigger>
          </TabsList>

          <TabsContent value="pie" className="mt-4">
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={topCategories}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="amount"
                  nameKey="category"
                >
                  {topCategories.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="middle"
                  align="right"
                  layout="vertical"
                  iconType="circle"
                  formatter={(value: string) => (
                    <span className="text-sm">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="bar" className="mt-4">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart
                data={topCategories}
                layout="horizontal"
                margin={{ left: 100 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  type="number"
                  tick={{ fill: 'currentColor', fontSize: 12 }}
                  tickFormatter={formatYAxis}
                />
                <YAxis
                  type="category"
                  dataKey="category"
                  tick={{ fill: 'currentColor', fontSize: 12 }}
                  width={90}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="amount" fill="#3b82f6">
                  {topCategories.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>

        {/* Summary Stats */}
        <div className="mt-6 pt-6 border-t">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium">Total Expenses</span>
            <span className="text-lg font-bold">
              SDG {new Intl.NumberFormat('en-SD').format(totalExpenses)}
            </span>
          </div>

          {/* Top 3 Categories */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Top Categories</p>
            {topCategories.slice(0, 3).map((cat, index) => (
              <div key={cat.category} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index] }}
                  />
                  <span className="text-sm">{cat.category}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium">
                    SDG {new Intl.NumberFormat('en-SD').format(cat.amount)}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">
                    ({cat.percentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}