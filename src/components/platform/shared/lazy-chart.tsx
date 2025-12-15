"use client"

import * as React from "react"
import dynamic from "next/dynamic"

import { Skeleton } from "@/components/ui/skeleton"

// Chart skeleton for loading states
function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div className="flex items-center justify-center" style={{ height }}>
      <Skeleton className="h-full w-full rounded-lg" />
    </div>
  )
}

// Lazy loaded Recharts components with SSR disabled for better performance
export const LazyLineChart = dynamic(
  () => import("recharts").then((mod) => mod.LineChart),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  }
)

export const LazyBarChart = dynamic(
  () => import("recharts").then((mod) => mod.BarChart),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  }
)

export const LazyAreaChart = dynamic(
  () => import("recharts").then((mod) => mod.AreaChart),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  }
)

export const LazyPieChart = dynamic(
  () => import("recharts").then((mod) => mod.PieChart),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  }
)

export const LazyRadarChart = dynamic(
  () => import("recharts").then((mod) => mod.RadarChart),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  }
)

export const LazyRadialBarChart = dynamic(
  () => import("recharts").then((mod) => mod.RadialBarChart),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  }
)

export const LazyComposedChart = dynamic(
  () => import("recharts").then((mod) => mod.ComposedChart),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  }
)

// Re-export commonly used components that are lightweight
export {
  Area,
  Bar,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  Pie,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadialBar,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
