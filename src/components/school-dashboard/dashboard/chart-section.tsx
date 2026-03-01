"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import * as React from "react"

import { useDictionary } from "@/components/internationalization/use-dictionary"
import { useLocale } from "@/components/internationalization/use-locale"

import {
  AreaChartStacked,
  type AreaChartStackedData,
} from "./chart-area-stacked"
import {
  InteractiveBarChart,
  type InteractiveBarChartData,
} from "./chart-interactive-bar"
import { RadialTextChart } from "./chart-radial-text"
import type { DashboardRole } from "./resource-usage-section"
import { SectionHeading } from "./section-heading"

// ============================================================================
// TYPES
// ============================================================================

export interface ChartSectionProps {
  role: DashboardRole
  className?: string
}

export interface RoleChartData {
  sectionTitle: string
  barChart: {
    title: string
    description: string
    primaryLabel: string
    secondaryLabel: string
    data: InteractiveBarChartData[]
  }
  radialChart: {
    value: number
    label: string
    trend: number
    trendLabel: string
    maxValue: number
  }
  areaChart: {
    primaryLabel: string
    secondaryLabel: string
    trend: number
    trendLabel: string
    data: AreaChartStackedData[]
  }
}

// ============================================================================
// SECTION TITLES BY ROLE
// ============================================================================

function getChartSectionTitle(
  role: DashboardRole,
  dict?: Record<string, string>
): string {
  const roleKey = role.toLowerCase()
  if (dict?.[roleKey]) return dict[roleKey]

  switch (role) {
    case "STUDENT":
      return "Academic Performance"
    case "TEACHER":
      return "Teaching Analytics"
    case "GUARDIAN":
      return "Children's Progress"
    case "ACCOUNTANT":
      return "Financial Analytics"
    case "PRINCIPAL":
      return "School Analytics"
    case "ADMIN":
      return "System Analytics"
    case "STAFF":
      return "Work Analytics"
    case "DEVELOPER":
      return "Platform Analytics"
    default:
      return dict?.default || "Analytics"
  }
}

// ============================================================================
// HELPER: Generate date-based bar chart data
// ============================================================================

// Placeholder chart data -- deterministic so charts don't flicker on re-render.
// TODO: Replace with real data from dashboard actions when metrics are available.
function generateBarChartData(months: number = 3): InteractiveBarChartData[] {
  const data: InteractiveBarChartData[] = []
  const now = new Date()

  for (let i = months * 30; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    // Deterministic pseudo-value based on day-of-year
    const dayOfYear = Math.floor(
      (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000
    )
    data.push({
      date: date.toISOString().split("T")[0],
      primary: 200 + ((dayOfYear * 17) % 300),
      secondary: 150 + ((dayOfYear * 13) % 200),
    })
  }
  return data
}

// ============================================================================
// DEFAULT DATA BY ROLE
// ============================================================================

const defaultDataByRole: Record<DashboardRole, RoleChartData> = {
  STUDENT: {
    sectionTitle: "Academic Performance",
    barChart: {
      title: "Study Hours",
      description: "Daily study hours over the past 3 months",
      primaryLabel: "Subjects",
      secondaryLabel: "Assignments",
      data: generateBarChartData(3),
    },
    radialChart: {
      value: 86,
      label: "Attendance",
      trend: 3.2,
      trendLabel: "Overall attendance rate this semester",
      maxValue: 100,
    },
    areaChart: {
      primaryLabel: "Grades",
      secondaryLabel: "Class Average",
      trend: 5.2,
      trendLabel: "Academic performance trend",
      data: [
        { label: "September", primary: 78, secondary: 72 },
        { label: "October", primary: 82, secondary: 74 },
        { label: "November", primary: 79, secondary: 75 },
        { label: "December", primary: 85, secondary: 76 },
        { label: "January", primary: 88, secondary: 77 },
        { label: "February", primary: 86, secondary: 78 },
      ],
    },
  },

  TEACHER: {
    sectionTitle: "Teaching Analytics",
    barChart: {
      title: "Lessons & Grading",
      description: "Teaching activity over the past 3 months",
      primaryLabel: "Lessons",
      secondaryLabel: "Graded",
      data: generateBarChartData(3),
    },
    radialChart: {
      value: 72,
      label: "Grading Progress",
      trend: -5.0,
      trendLabel: "Assignments graded this period",
      maxValue: 100,
    },
    areaChart: {
      primaryLabel: "Student Performance",
      secondaryLabel: "Attendance",
      trend: 2.1,
      trendLabel: "Class performance over time",
      data: [
        { label: "Week 1", primary: 82, secondary: 95 },
        { label: "Week 2", primary: 78, secondary: 92 },
        { label: "Week 3", primary: 85, secondary: 88 },
        { label: "Week 4", primary: 80, secondary: 94 },
        { label: "Week 5", primary: 84, secondary: 91 },
        { label: "Week 6", primary: 87, secondary: 96 },
      ],
    },
  },

  GUARDIAN: {
    sectionTitle: "Children's Progress",
    barChart: {
      title: "Activity Overview",
      description: "Children's school activities",
      primaryLabel: "Attendance",
      secondaryLabel: "Assignments",
      data: generateBarChartData(3),
    },
    radialChart: {
      value: 88,
      label: "Avg Grade",
      trend: 4.5,
      trendLabel: "Average grade across all children",
      maxValue: 100,
    },
    areaChart: {
      primaryLabel: "Grades",
      secondaryLabel: "Attendance",
      trend: 3.8,
      trendLabel: "Performance trend this semester",
      data: [
        { label: "Week 1", primary: 85, secondary: 95 },
        { label: "Week 2", primary: 82, secondary: 90 },
        { label: "Week 3", primary: 88, secondary: 100 },
        { label: "Week 4", primary: 84, secondary: 85 },
        { label: "Week 5", primary: 90, secondary: 95 },
        { label: "Week 6", primary: 92, secondary: 100 },
      ],
    },
  },

  STAFF: {
    sectionTitle: "Work Analytics",
    barChart: {
      title: "Task Management",
      description: "Tasks completed over the past 3 months",
      primaryLabel: "Completed",
      secondaryLabel: "Pending",
      data: generateBarChartData(3),
    },
    radialChart: {
      value: 88,
      label: "Efficiency",
      trend: 2.1,
      trendLabel: "Work efficiency rate",
      maxValue: 100,
    },
    areaChart: {
      primaryLabel: "Tasks",
      secondaryLabel: "Requests",
      trend: 4.2,
      trendLabel: "Workload distribution over time",
      data: [
        { label: "Monday", primary: 8, secondary: 5 },
        { label: "Tuesday", primary: 12, secondary: 7 },
        { label: "Wednesday", primary: 10, secondary: 6 },
        { label: "Thursday", primary: 15, secondary: 9 },
        { label: "Friday", primary: 9, secondary: 4 },
        { label: "Saturday", primary: 3, secondary: 1 },
      ],
    },
  },

  ACCOUNTANT: {
    sectionTitle: "Financial Analytics",
    barChart: {
      title: "Revenue vs Expenses",
      description: "Financial overview for the last 3 months",
      primaryLabel: "Revenue",
      secondaryLabel: "Expenses",
      data: generateBarChartData(3),
    },
    radialChart: {
      value: 87,
      label: "Collection Rate",
      trend: 5.2,
      trendLabel: "Fee collection efficiency",
      maxValue: 100,
    },
    areaChart: {
      primaryLabel: "Income",
      secondaryLabel: "Expenses",
      trend: 8.5,
      trendLabel: "Financial performance trend",
      data: [
        { label: "January", primary: 120000, secondary: 95000 },
        { label: "February", primary: 135000, secondary: 88000 },
        { label: "March", primary: 128000, secondary: 92000 },
        { label: "April", primary: 142000, secondary: 98000 },
        { label: "May", primary: 155000, secondary: 105000 },
        { label: "June", primary: 148000, secondary: 110000 },
      ],
    },
  },

  PRINCIPAL: {
    sectionTitle: "School Analytics",
    barChart: {
      title: "School Performance",
      description: "Overall school metrics",
      primaryLabel: "Enrollment",
      secondaryLabel: "Attendance",
      data: generateBarChartData(3),
    },
    radialChart: {
      value: 92,
      label: "Attendance Rate",
      trend: 1.5,
      trendLabel: "School-wide attendance",
      maxValue: 100,
    },
    areaChart: {
      primaryLabel: "Performance",
      secondaryLabel: "Previous Year",
      trend: 3.2,
      trendLabel: "Academic performance comparison",
      data: [
        { label: "Term 1", primary: 78, secondary: 75 },
        { label: "Term 2", primary: 82, secondary: 78 },
        { label: "Term 3", primary: 80, secondary: 77 },
        { label: "Term 4", primary: 85, secondary: 80 },
        { label: "Term 5", primary: 87, secondary: 82 },
        { label: "Term 6", primary: 89, secondary: 84 },
      ],
    },
  },

  ADMIN: {
    sectionTitle: "System Analytics",
    barChart: {
      title: "User Activity",
      description: "System usage over the past 3 months",
      primaryLabel: "Active Users",
      secondaryLabel: "Sessions",
      data: generateBarChartData(3),
    },
    radialChart: {
      value: 98,
      label: "System Health",
      trend: 0.5,
      trendLabel: "Platform stability index",
      maxValue: 100,
    },
    areaChart: {
      primaryLabel: "Logins",
      secondaryLabel: "API Calls",
      trend: 12.5,
      trendLabel: "System activity trend",
      data: [
        { label: "Monday", primary: 245, secondary: 1200 },
        { label: "Tuesday", primary: 312, secondary: 1450 },
        { label: "Wednesday", primary: 298, secondary: 1380 },
        { label: "Thursday", primary: 356, secondary: 1620 },
        { label: "Friday", primary: 289, secondary: 1280 },
        { label: "Saturday", primary: 145, secondary: 680 },
      ],
    },
  },

  DEVELOPER: {
    sectionTitle: "Platform Analytics",
    barChart: {
      title: "Platform Growth",
      description: "Platform metrics over the past 3 months",
      primaryLabel: "Schools",
      secondaryLabel: "Users",
      data: generateBarChartData(3),
    },
    radialChart: {
      value: 99,
      label: "Uptime",
      trend: 0.1,
      trendLabel: "Platform availability",
      maxValue: 100,
    },
    areaChart: {
      primaryLabel: "New Schools",
      secondaryLabel: "New Users",
      trend: 15.2,
      trendLabel: "Growth trend over time",
      data: [
        { label: "July", primary: 35, secondary: 12000 },
        { label: "August", primary: 38, secondary: 15000 },
        { label: "September", primary: 42, secondary: 18000 },
        { label: "October", primary: 45, secondary: 22000 },
        { label: "November", primary: 48, secondary: 25000 },
        { label: "December", primary: 52, secondary: 28000 },
      ],
    },
  },
}

// ============================================================================
// CHART SECTION COMPONENT
// ============================================================================

/**
 * Role-specific chart section for dashboards.
 * Uses finance page layout: InteractiveBarChart (full width) +
 * RadialTextChart & AreaChartStacked (2-column grid).
 */
// ============================================================================
// HELPER: Translate area chart data labels (day/month/week names)
// ============================================================================

function translateDataLabels(
  data: AreaChartStackedData[],
  locale: string,
  cl?: Record<string, string>
): AreaChartStackedData[] {
  return data.map((d) => {
    const label = d.label
    // Week N pattern
    if (label.startsWith("Week ")) {
      const num = label.replace("Week ", "")
      return { ...d, label: `${cl?.week || "Week"} ${num}` }
    }
    // Term N pattern
    if (label.startsWith("Term ")) {
      const num = label.replace("Term ", "")
      return { ...d, label: `${cl?.term || "Term"} ${num}` }
    }
    // Day names → use Intl
    const dayIndex = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ].indexOf(label)
    if (dayIndex >= 0) {
      const date = new Date(2024, 0, dayIndex) // Jan 2024 starts on Monday=1
      // Use a known date for each day of week
      const refDate = new Date(2024, 0, 7 + dayIndex) // Jan 7 is Sunday
      return {
        ...d,
        label: refDate.toLocaleDateString(locale, { weekday: "short" }),
      }
    }
    // Month names → use Intl
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ]
    const monthIndex = months.indexOf(label)
    if (monthIndex >= 0) {
      const date = new Date(2024, monthIndex, 1)
      return {
        ...d,
        label: date.toLocaleDateString(locale, { month: "short" }),
      }
    }
    return d
  })
}

function ChartSectionInner({ role, className }: ChartSectionProps) {
  const { dictionary } = useDictionary()
  const { locale } = useLocale()
  const dict = dictionary?.school?.dashboard?.charts as
    | Record<string, string>
    | undefined
  const cl = dictionary?.school?.dashboard?.chartLabels as
    | Record<string, string>
    | undefined

  // Use default data based on role (API data is in legacy format)
  const data = defaultDataByRole[role] || defaultDataByRole.ADMIN
  const sectionTitle = getChartSectionTitle(role, dict)

  // Translate chart labels via dictionary using role-prefixed keys
  const roleKey = role.toLowerCase()
  const barTitle = cl?.[`${roleKey}BarTitle`] || data.barChart.title
  const barDesc = cl?.[`${roleKey}BarDesc`] || data.barChart.description
  const barPrimary = cl?.[`${roleKey}BarPrimary`] || data.barChart.primaryLabel
  const barSecondary =
    cl?.[`${roleKey}BarSecondary`] || data.barChart.secondaryLabel
  const radialLabel = cl?.[`${roleKey}RadialLabel`] || data.radialChart.label
  const radialTrend =
    cl?.[`${roleKey}RadialTrend`] || data.radialChart.trendLabel
  const areaPrimary =
    cl?.[`${roleKey}AreaPrimary`] || data.areaChart.primaryLabel
  const areaSecondary =
    cl?.[`${roleKey}AreaSecondary`] || data.areaChart.secondaryLabel
  const areaTrend = cl?.[`${roleKey}AreaTrend`] || data.areaChart.trendLabel

  // Translate area chart data labels (day/month/week names)
  const translatedAreaData = translateDataLabels(
    data.areaChart.data,
    locale,
    cl
  )

  return (
    <section className={className}>
      <SectionHeading title={sectionTitle} />
      <div className="space-y-4">
        {/* Full width bar chart (like finance page) */}
        <InteractiveBarChart
          data={data.barChart.data}
          title={barTitle}
          description={barDesc}
          primaryLabel={barPrimary}
          secondaryLabel={barSecondary}
        />

        {/* 2-column grid: Radial + Area (like finance page) */}
        <div className="grid gap-4 md:grid-cols-2">
          <RadialTextChart
            value={data.radialChart.value}
            label={radialLabel}
            trend={data.radialChart.trend}
            trendLabel={radialTrend}
            maxValue={data.radialChart.maxValue}
          />
          <AreaChartStacked
            data={translatedAreaData}
            primaryLabel={areaPrimary}
            secondaryLabel={areaSecondary}
            trend={data.areaChart.trend}
            trendLabel={areaTrend}
          />
        </div>
      </div>
    </section>
  )
}

export const ChartSection = React.memo(ChartSectionInner)

// ============================================================================
// STATIC CHART SECTION (For server components)
// ============================================================================

export interface StaticChartSectionProps {
  role: DashboardRole
  data?: RoleChartData
  className?: string
}

/**
 * Static version of ChartSection for server-side rendering.
 */
function StaticChartSectionInner({
  role,
  data,
  className,
}: StaticChartSectionProps) {
  const chartData = data || defaultDataByRole[role] || defaultDataByRole.ADMIN
  const sectionTitle = getChartSectionTitle(role)

  return (
    <section className={className}>
      <SectionHeading title={sectionTitle} />
      <div className="space-y-4">
        {/* Full width bar chart (like finance page) */}
        <InteractiveBarChart
          data={chartData.barChart.data}
          title={chartData.barChart.title}
          description={chartData.barChart.description}
          primaryLabel={chartData.barChart.primaryLabel}
          secondaryLabel={chartData.barChart.secondaryLabel}
        />

        {/* 2-column grid: Radial + Area (like finance page) */}
        <div className="grid gap-4 md:grid-cols-2">
          <RadialTextChart
            value={chartData.radialChart.value}
            label={chartData.radialChart.label}
            trend={chartData.radialChart.trend}
            trendLabel={chartData.radialChart.trendLabel}
            maxValue={chartData.radialChart.maxValue}
          />
          <AreaChartStacked
            data={chartData.areaChart.data}
            primaryLabel={chartData.areaChart.primaryLabel}
            secondaryLabel={chartData.areaChart.secondaryLabel}
            trend={chartData.areaChart.trend}
            trendLabel={chartData.areaChart.trendLabel}
          />
        </div>
      </div>
    </section>
  )
}

export const StaticChartSection = React.memo(StaticChartSectionInner)
