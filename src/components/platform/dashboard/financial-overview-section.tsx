"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SectionHeading } from "./section-heading"
import {
  DollarSign,
  Check,
  Clock,
  TriangleAlert,
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  Receipt,
  PiggyBank,
  Coins,
  Building,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { CartesianGrid, Line, LineChart, XAxis, Area, AreaChart } from "recharts"
import { getFinancialOverviewByRole } from "./actions"
import type { DashboardRole } from "./resource-usage-section"

// ============================================================================
// TYPES
// ============================================================================

export interface FinancialStat {
  label: string
  value: string
  change?: string
  changeType?: "positive" | "negative" | "neutral"
  icon?: string
}

export interface FinancialOverviewData {
  stats: FinancialStat[]
  chartData?: { day: string; amount: number; average?: number }[]
}

export interface FinancialOverviewSectionProps {
  role: DashboardRole
  className?: string
}

// ============================================================================
// ROLE-SPECIFIC DESCRIPTIONS
// ============================================================================

const roleDescriptions: Record<DashboardRole, string> = {
  STUDENT: "Your fee payment status and balance",
  TEACHER: "Department budget status (if applicable)",
  GUARDIAN: "Combined fee status for all children",
  STAFF: "Your department's budget overview",
  ACCOUNTANT: "Complete financial dashboard",
  PRINCIPAL: "School-wide budget and financial health",
  ADMIN: "Platform financial metrics",
  DEVELOPER: "Platform revenue and billing metrics",
}

// ============================================================================
// ICON MAPPING
// ============================================================================

const iconMap: Record<string, React.ElementType> = {
  Revenue: DollarSign,
  Collected: Check,
  Pending: Clock,
  Overdue: TriangleAlert,
  Balance: Wallet,
  "Fee Due": CreditCard,
  "Total Paid": Receipt,
  "Next Payment": Clock,
  Budget: PiggyBank,
  Expenses: Coins,
  "Budget Used": Building,
  Available: Check,
  "Total Revenue": DollarSign,
  "Collection Rate": TrendingUp,
  Outstanding: TriangleAlert,
  "Today's Collection": Coins,
}

// ============================================================================
// CHART CONFIG
// ============================================================================

const chartConfig = {
  amount: {
    label: "Amount",
    color: "var(--primary)",
  },
  average: {
    label: "Average",
    color: "var(--primary)",
  },
} satisfies ChartConfig

// ============================================================================
// DEFAULT DATA BY ROLE
// ============================================================================

const defaultDataByRole: Record<DashboardRole, FinancialOverviewData> = {
  STUDENT: {
    stats: [
      { label: "Fee Due", value: "2,500 SAR", icon: "Fee Due" },
      { label: "Total Paid", value: "7,500 SAR", icon: "Total Paid" },
      { label: "Next Payment", value: "Jan 1, 2025", icon: "Next Payment" },
      { label: "Balance", value: "0 SAR", change: "Paid up", changeType: "positive", icon: "Balance" },
    ],
    chartData: undefined, // No chart for students
  },
  TEACHER: {
    stats: [
      { label: "Department Budget", value: "15,000 SAR", icon: "Budget" },
      { label: "Used", value: "8,500 SAR", icon: "Expenses" },
      { label: "Available", value: "6,500 SAR", icon: "Available" },
      { label: "Budget Used", value: "57%", change: "+3%", changeType: "neutral", icon: "Budget Used" },
    ],
    chartData: undefined, // Minimal chart for teachers
  },
  GUARDIAN: {
    stats: [
      { label: "Total Due", value: "4,800 SAR", icon: "Fee Due" },
      { label: "Total Paid", value: "12,700 SAR", icon: "Total Paid" },
      { label: "Next Payment", value: "Jan 1, 2025", icon: "Next Payment" },
      { label: "Children Fees", value: "2 active", icon: "Balance" },
    ],
    chartData: undefined, // No chart for parents
  },
  STAFF: {
    stats: [
      { label: "Department Budget", value: "25,000 SAR", icon: "Budget" },
      { label: "Expenses", value: "18,200 SAR", icon: "Expenses" },
      { label: "Available", value: "6,800 SAR", icon: "Available" },
      { label: "Budget Used", value: "73%", change: "+5%", changeType: "neutral", icon: "Budget Used" },
    ],
    chartData: undefined, // No chart for staff
  },
  ACCOUNTANT: {
    stats: [
      { label: "Total Revenue", value: "1.2M SAR", change: "+8%", changeType: "positive", icon: "Total Revenue" },
      { label: "Collection Rate", value: "87%", change: "+2%", changeType: "positive", icon: "Collection Rate" },
      { label: "Outstanding", value: "156K SAR", change: "-5%", changeType: "positive", icon: "Outstanding" },
      { label: "Today's Collection", value: "45K SAR", change: "+12%", changeType: "positive", icon: "Today's Collection" },
    ],
    chartData: [
      { day: "Mon", amount: 22000, average: 18000 },
      { day: "Tue", amount: 25000, average: 19000 },
      { day: "Wed", amount: 21000, average: 17500 },
      { day: "Thu", amount: 28000, average: 20000 },
      { day: "Fri", amount: 24000, average: 18500 },
      { day: "Sat", amount: 19500, average: 16000 },
      { day: "Sun", amount: 17000, average: 15000 },
    ],
  },
  PRINCIPAL: {
    stats: [
      { label: "Annual Budget", value: "5.5M SAR", icon: "Budget" },
      { label: "Spent YTD", value: "3.2M SAR", change: "58%", changeType: "neutral", icon: "Expenses" },
      { label: "Remaining", value: "2.3M SAR", icon: "Available" },
      { label: "Collection Rate", value: "87%", change: "+3%", changeType: "positive", icon: "Collection Rate" },
    ],
    chartData: [
      { day: "Jul", amount: 450000, average: 420000 },
      { day: "Aug", amount: 520000, average: 450000 },
      { day: "Sep", amount: 380000, average: 400000 },
      { day: "Oct", amount: 410000, average: 410000 },
      { day: "Nov", amount: 490000, average: 440000 },
      { day: "Dec", amount: 350000, average: 380000 },
    ],
  },
  ADMIN: {
    stats: [
      { label: "Platform Revenue", value: "$45.2K", change: "+12%", changeType: "positive", icon: "Total Revenue" },
      { label: "Active Subscriptions", value: "156", change: "+8", changeType: "positive", icon: "Collection Rate" },
      { label: "MRR", value: "$38.5K", change: "+5%", changeType: "positive", icon: "Budget" },
      { label: "Churn Rate", value: "2.1%", change: "-0.3%", changeType: "positive", icon: "Outstanding" },
    ],
    chartData: [
      { day: "Jul", amount: 32000, average: 28000 },
      { day: "Aug", amount: 35000, average: 30000 },
      { day: "Sep", amount: 38000, average: 32000 },
      { day: "Oct", amount: 40000, average: 35000 },
      { day: "Nov", amount: 42000, average: 37000 },
      { day: "Dec", amount: 45200, average: 38000 },
    ],
  },
  DEVELOPER: {
    stats: [
      { label: "Total ARR", value: "$542K", change: "+18%", changeType: "positive", icon: "Total Revenue" },
      { label: "Schools Active", value: "45", change: "+5", changeType: "positive", icon: "Collection Rate" },
      { label: "Avg Revenue/School", value: "$12K", change: "+8%", changeType: "positive", icon: "Budget" },
      { label: "Enterprise Rate", value: "35%", change: "+5%", changeType: "positive", icon: "Outstanding" },
    ],
    chartData: [
      { day: "Q1", amount: 380000, average: 350000 },
      { day: "Q2", amount: 420000, average: 380000 },
      { day: "Q3", amount: 480000, average: 420000 },
      { day: "Q4", amount: 542000, average: 480000 },
    ],
  },
}

// ============================================================================
// FINANCIAL OVERVIEW SECTION COMPONENT
// ============================================================================

/**
 * Role-specific financial overview section for dashboards.
 * Shows relevant financial metrics and optional chart based on user role.
 *
 * @example
 * <FinancialOverviewSection role="ACCOUNTANT" />
 */
export function FinancialOverviewSection({
  role,
  className,
}: FinancialOverviewSectionProps) {
  const [data, setData] = useState<FinancialOverviewData>(
    defaultDataByRole[role] || defaultDataByRole.ADMIN
  )
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const result = await getFinancialOverviewByRole(role)
        // Type-safe check for stats property
        if (
          result &&
          typeof result === "object" &&
          "stats" in result &&
          Array.isArray((result as FinancialOverviewData).stats) &&
          (result as FinancialOverviewData).stats.length > 0
        ) {
          setData(result as FinancialOverviewData)
        }
      } catch (error) {
        console.error("Error fetching financial overview:", error)
        // Keep default data on error
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [role])

  const description = roleDescriptions[role] || roleDescriptions.ADMIN
  const showChart = data.chartData && data.chartData.length > 0

  return (
    <section className={className}>
      <SectionHeading
        title="Financial Overview"
        icon={DollarSign}
        description={description}
      />
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {data.stats.map((stat) => {
            const IconComponent = iconMap[stat.icon || stat.label] || DollarSign
            return (
              <Card key={stat.label} className="p-4">
                <CardContent className="p-0 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <IconComponent className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-semibold truncate">{stat.value}</p>
                      {stat.change && (
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-xs shrink-0",
                            stat.changeType === "positive" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                            stat.changeType === "negative" && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                            stat.changeType === "neutral" && "bg-muted text-muted-foreground"
                          )}
                        >
                          {stat.changeType === "positive" && <TrendingUp className="mr-1 h-3 w-3" />}
                          {stat.changeType === "negative" && <TrendingDown className="mr-1 h-3 w-3" />}
                          {stat.change}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Chart (Only for certain roles) */}
        {showChart && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {role === "ACCOUNTANT" ? "Revenue Collection" :
                 role === "PRINCIPAL" ? "Monthly Budget Spending" :
                 role === "ADMIN" ? "Platform Revenue" :
                 role === "DEVELOPER" ? "Quarterly Revenue" : "Financial Trend"}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {role === "ACCOUNTANT" ? "Your collection is trending above average" :
                 role === "PRINCIPAL" ? "Monthly spending vs allocated budget" :
                 role === "ADMIN" ? "Monthly recurring revenue growth" :
                 role === "DEVELOPER" ? "Quarterly ARR growth" : "Financial trend over time"}
              </p>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="w-full md:h-[200px]">
                <AreaChart
                  accessibilityLayer
                  data={data.chartData}
                  margin={{ top: 5, right: 10, left: 16, bottom: 0 }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <defs>
                    <linearGradient id="fillAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-amount)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="var(--color-amount)" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="var(--color-amount)"
                    fill="url(#fillAmount)"
                    strokeWidth={2}
                  />
                  {data.chartData?.[0]?.average !== undefined && (
                    <Line
                      type="monotone"
                      dataKey="average"
                      stroke="var(--color-average)"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      strokeOpacity={0.5}
                      dot={false}
                    />
                  )}
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  )
}

// ============================================================================
// STATIC FINANCIAL OVERVIEW (For server components)
// ============================================================================

export interface StaticFinancialOverviewSectionProps {
  role: DashboardRole
  data?: FinancialOverviewData
  className?: string
}

/**
 * Static version of FinancialOverviewSection for server-side rendering.
 * Pass pre-fetched data directly.
 */
export function StaticFinancialOverviewSection({
  role,
  data,
  className,
}: StaticFinancialOverviewSectionProps) {
  const financialData = data || defaultDataByRole[role] || defaultDataByRole.ADMIN
  const description = roleDescriptions[role] || roleDescriptions.ADMIN
  const showChart = financialData.chartData && financialData.chartData.length > 0

  return (
    <section className={className}>
      <SectionHeading
        title="Financial Overview"
        icon={DollarSign}
        description={description}
      />
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {financialData.stats.map((stat) => {
            const IconComponent = iconMap[stat.icon || stat.label] || DollarSign
            return (
              <Card key={stat.label} className="p-4">
                <CardContent className="p-0 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <IconComponent className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-semibold truncate">{stat.value}</p>
                      {stat.change && (
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-xs shrink-0",
                            stat.changeType === "positive" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                            stat.changeType === "negative" && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                            stat.changeType === "neutral" && "bg-muted text-muted-foreground"
                          )}
                        >
                          {stat.changeType === "positive" && <TrendingUp className="mr-1 h-3 w-3" />}
                          {stat.changeType === "negative" && <TrendingDown className="mr-1 h-3 w-3" />}
                          {stat.change}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Chart placeholder for static version */}
        {showChart && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Financial Trend</CardTitle>
              <p className="text-sm text-muted-foreground">
                Enable client-side rendering for interactive charts
              </p>
            </CardHeader>
            <CardContent className="h-[200px] flex items-center justify-center text-muted-foreground">
              Chart available in client component
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  )
}
