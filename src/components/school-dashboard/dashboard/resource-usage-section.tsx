"use client"

import { useEffect, useState } from "react"

import {
  DetailedUsageTable,
  type UsageResource,
} from "@/components/billingsdk/detailed-usage-table"

import { getResourceUsageByRole } from "./actions"
import { SectionHeading } from "./section-heading"

// ============================================================================
// TYPES
// ============================================================================

export type DashboardRole =
  | "STUDENT"
  | "TEACHER"
  | "GUARDIAN"
  | "STAFF"
  | "ACCOUNTANT"
  | "PRINCIPAL"
  | "ADMIN"
  | "DEVELOPER"

export interface ResourceUsageSectionProps {
  role: DashboardRole
  className?: string
  sectionTitle?: string
}

// ============================================================================
// ROLE-SPECIFIC TITLES
// ============================================================================

function getResourceTitleByRole(role: DashboardRole): string {
  switch (role) {
    case "STUDENT":
      return "Academic Progress"
    case "TEACHER":
      return "Teaching Workload"
    case "GUARDIAN":
      return "Children Overview"
    case "STAFF":
      return "Work Overview"
    case "ACCOUNTANT":
      return "Financial Metrics"
    case "PRINCIPAL":
      return "School Overview"
    case "ADMIN":
      return "System Health"
    case "DEVELOPER":
      return "Platform Metrics"
    default:
      return "Resource Usage"
  }
}

// ============================================================================
// DEFAULT DATA BY ROLE (Fallback when no real data available)
// ============================================================================

const defaultResourcesByRole: Record<DashboardRole, UsageResource[]> = {
  // Academic Progress - Student metrics that matter
  STUDENT: [
    { name: "Assignment Progress", used: 18, limit: 22, unit: "completed" },
    { name: "Attendance Rate", used: 92, limit: 100, unit: "%" },
    { name: "Current GPA", used: 3.2, limit: 4, unit: "" },
    { name: "Days Until Exams", used: 45, limit: 60, unit: "days" },
  ],
  // Teaching Workload - What teachers need to track
  TEACHER: [
    { name: "Lessons This Week", used: 18, limit: 24, unit: "lessons" },
    { name: "Ungraded Work", used: 23, limit: 50, unit: "submissions" },
    { name: "Class Coverage", used: 145, limit: 180, unit: "students" },
    { name: "Attendance Marked", used: 85, limit: 100, unit: "%" },
  ],
  // Children Overview - What parents care about
  GUARDIAN: [
    { name: "Children Enrolled", used: 2, limit: 5, unit: "children" },
    { name: "Avg Attendance", used: 94, limit: 100, unit: "%" },
    { name: "Assignments Due", used: 5, limit: 15, unit: "tasks" },
    { name: "Upcoming Events", used: 3, limit: 10, unit: "events" },
  ],
  // Work Overview - Staff work metrics
  STAFF: [
    { name: "Tasks Assigned", used: 12, limit: 20, unit: "tasks" },
    { name: "Requests Pending", used: 5, limit: 15, unit: "requests" },
    { name: "Days This Month", used: 18, limit: 22, unit: "days" },
    { name: "Efficiency Score", used: 88, limit: 100, unit: "%" },
  ],
  // Financial Metrics - What accountants need
  ACCOUNTANT: [
    { name: "Collection Rate", used: 87, limit: 100, unit: "%" },
    { name: "Pending Invoices", used: 45, limit: 200, unit: "invoices" },
    { name: "Monthly Revenue", used: 85000, limit: 120000, unit: "SAR" },
    { name: "Overdue Amount", used: 12000, limit: 50000, unit: "SAR" },
  ],
  // School Overview - Principal's dashboard
  PRINCIPAL: [
    { name: "Enrollment", used: 892, limit: 1000, unit: "students" },
    { name: "Staff Count", used: 45, limit: 60, unit: "staff" },
    { name: "Attendance Today", used: 88, limit: 100, unit: "%" },
    { name: "Budget Used", used: 78, limit: 100, unit: "%" },
  ],
  // System Health - Admin monitoring
  ADMIN: [
    { name: "Active Users", used: 1245, limit: 2000, unit: "users" },
    { name: "Storage Used", used: 45, limit: 100, unit: "GB" },
    { name: "Active Sessions", used: 156, limit: 500, unit: "sessions" },
    { name: "System Health", used: 98, limit: 100, unit: "%" },
  ],
  // Platform Metrics - Developer view
  DEVELOPER: [
    { name: "Schools Active", used: 45, limit: 100, unit: "schools" },
    { name: "Platform Users", used: 25000, limit: 50000, unit: "users" },
    { name: "Database Size", used: 120, limit: 500, unit: "GB" },
    { name: "System Uptime", used: 99.9, limit: 100, unit: "%" },
  ],
}

// ============================================================================
// RESOURCE USAGE SECTION COMPONENT
// ============================================================================

/**
 * Role-specific resource usage section for dashboards.
 * Displays 4 key metrics relevant to each role using the DetailedUsageTable component.
 *
 * @example
 * <ResourceUsageSection role="STUDENT" />
 */
export function ResourceUsageSection({
  role,
  className,
  sectionTitle,
}: ResourceUsageSectionProps) {
  const [resources, setResources] = useState<UsageResource[]>(
    defaultResourcesByRole[role] || defaultResourcesByRole.ADMIN
  )
  const [isLoading, setIsLoading] = useState(true)

  // Use provided title or derive from role
  const title = sectionTitle || getResourceTitleByRole(role)

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getResourceUsageByRole(role)
        if (data && data.length > 0) {
          // Map server data to UsageResource format
          const mappedResources: UsageResource[] = data.map((item) => ({
            name: item.name,
            used: item.used,
            limit: item.limit,
            unit: item.unit,
          }))
          setResources(mappedResources)
        }
      } catch (error) {
        console.error("Error fetching resource usage:", error)
        // Keep default data on error
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [role])

  return (
    <section className={className}>
      <SectionHeading title={title} />
      <DetailedUsageTable resources={resources} title="" description="" />
    </section>
  )
}

// ============================================================================
// STATIC RESOURCE USAGE (For server components)
// ============================================================================

export interface StaticResourceUsageSectionProps {
  role: DashboardRole
  resources?: UsageResource[]
  className?: string
  sectionTitle?: string
}

/**
 * Static version of ResourceUsageSection for server-side rendering.
 * Pass pre-fetched resources data directly.
 */
export function StaticResourceUsageSection({
  role,
  resources,
  className,
  sectionTitle,
}: StaticResourceUsageSectionProps) {
  const data =
    resources || defaultResourcesByRole[role] || defaultResourcesByRole.ADMIN
  const title = sectionTitle || getResourceTitleByRole(role)

  return (
    <section className={className}>
      <SectionHeading title={title} />
      <DetailedUsageTable resources={data} title="" description="" />
    </section>
  )
}
