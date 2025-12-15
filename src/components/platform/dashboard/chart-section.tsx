"use client"

import { SectionHeading } from "./section-heading"
import { InteractiveBarChart, type InteractiveBarChartData } from "./chart-interactive-bar"
import { RadialTextChart } from "./chart-radial-text"
import { AreaChartStacked, type AreaChartStackedData } from "./chart-area-stacked"
import type { DashboardRole } from "./resource-usage-section"

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

function getChartSectionTitle(role: DashboardRole): string {
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
      return "Analytics"
  }
}

// ============================================================================
// HELPER: Generate date-based bar chart data
// ============================================================================

function generateBarChartData(months: number = 3): InteractiveBarChartData[] {
  const data: InteractiveBarChartData[] = []
  const now = new Date()

  for (let i = months * 30; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    data.push({
      date: date.toISOString().split('T')[0],
      primary: Math.floor(Math.random() * 400) + 100,
      secondary: Math.floor(Math.random() * 300) + 80,
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
export function ChartSection({ role, className }: ChartSectionProps) {
  // Use default data based on role (API data is in legacy format)
  const data = defaultDataByRole[role] || defaultDataByRole.ADMIN
  const sectionTitle = getChartSectionTitle(role)

  return (
    <section className={className}>
      <SectionHeading title={sectionTitle} />
      <div className="space-y-4">
        {/* Full width bar chart (like finance page) */}
        <InteractiveBarChart
          data={data.barChart.data}
          title={data.barChart.title}
          description={data.barChart.description}
          primaryLabel={data.barChart.primaryLabel}
          secondaryLabel={data.barChart.secondaryLabel}
        />

        {/* 2-column grid: Radial + Area (like finance page) */}
        <div className="grid gap-4 md:grid-cols-2">
          <RadialTextChart
            value={data.radialChart.value}
            label={data.radialChart.label}
            trend={data.radialChart.trend}
            trendLabel={data.radialChart.trendLabel}
            maxValue={data.radialChart.maxValue}
          />
          <AreaChartStacked
            data={data.areaChart.data}
            primaryLabel={data.areaChart.primaryLabel}
            secondaryLabel={data.areaChart.secondaryLabel}
            trend={data.areaChart.trend}
            trendLabel={data.areaChart.trendLabel}
          />
        </div>
      </div>
    </section>
  )
}

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
export function StaticChartSection({ role, data, className }: StaticChartSectionProps) {
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
