'use client'

import { useMemo, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatAmount } from '@/components/banking/lib/utils'
import { cn } from '@/lib/utils'
import type { BankAccount, BankingDictionary } from '../types'

interface DoughnutChartImprovedProps {
  accounts: BankAccount[]
  dictionary?: BankingDictionary
  isLoading?: boolean
  showLegend?: boolean
  className?: string
}

// Use CSS variables for theme-aware colors
const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
]

interface CustomTooltipProps {
  active?: boolean
  payload?: any[]
  label?: string
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0]
    return (
      <Card className="shadow-lg">
        <CardContent className="p-3">
          <p className="text-sm font-medium">{data.name}</p>
          <p className="text-lg font-bold">{formatAmount(data.value)}</p>
          <p className="text-xs text-muted-foreground">
            {data.payload.percentage.toFixed(1)}% of total
          </p>
        </CardContent>
      </Card>
    )
  }
  return null
}

interface CustomLegendProps {
  payload?: any[]
}

const CustomLegend = ({ payload }: CustomLegendProps) => {
  if (!payload) return null

  return (
    <ul className="flex flex-col gap-2 mt-4">
      {payload.map((entry, index) => (
        <li key={`legend-${index}`} className="flex items-center gap-2">
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs text-muted-foreground flex-1">{entry.value}</span>
          <span className="text-xs font-medium tabular-nums">
            {formatAmount(entry.payload.value)}
          </span>
        </li>
      ))}
    </ul>
  )
}

export function DoughnutChartImproved({
  accounts,
  dictionary,
  isLoading = false,
  showLegend = false,
  className
}: DoughnutChartImprovedProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  // Prepare chart data
  const chartData = useMemo(() => {
    const total = accounts.reduce((sum, acc) => sum + acc.currentBalance, 0)

    return accounts.map((account, index) => ({
      name: account.name,
      value: account.currentBalance,
      percentage: (account.currentBalance / total) * 100,
      color: CHART_COLORS[index % CHART_COLORS.length]
    }))
  }, [accounts])

  if (isLoading) {
    return (
      <div className={cn("relative", className)}>
        <Skeleton className="h-full w-full rounded-full" />
      </div>
    )
  }

  if (accounts.length === 0) {
    return (
      <div className={cn(
        "flex items-center justify-center h-full w-full rounded-full bg-muted/50",
        className
      )}>
        <p className="text-xs text-muted-foreground text-center p-4">
          {dictionary?.chartNoData || 'No data'}
        </p>
      </div>
    )
  }

  const handlePieEnter = (_: any, index: number) => {
    setActiveIndex(index)
  }

  const handlePieLeave = () => {
    setActiveIndex(null)
  }

  return (
    <div className={cn("relative", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="90%"
            paddingAngle={2}
            dataKey="value"
            animationBegin={0}
            animationDuration={600}
            onMouseEnter={handlePieEnter}
            onMouseLeave={handlePieLeave}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                stroke="none"
                style={{
                  filter: activeIndex === index ? 'brightness(1.1)' : 'brightness(1)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              />
            ))}
          </Pie>
          <Tooltip
            content={<CustomTooltip />}
            wrapperStyle={{ outline: 'none' }}
          />
          {showLegend && <Legend content={<CustomLegend />} />}
        </PieChart>
      </ResponsiveContainer>

      {/* Center text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            {dictionary?.chartTitle || 'Total'}
          </p>
          <p className="text-sm font-semibold">
            {accounts.length}
          </p>
        </div>
      </div>

      {/* Screen reader accessible description */}
      <div className="sr-only" role="img" aria-label="Account balance distribution chart">
        {chartData.map((item, index) => (
          <span key={index}>
            {item.name}: {formatAmount(item.value)} ({item.percentage.toFixed(1)}% of total).
          </span>
        ))}
      </div>
    </div>
  )
}