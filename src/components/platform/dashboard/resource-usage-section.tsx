"use client"

import { useEffect, useState } from "react"
import { DetailedUsageTable, type UsageResource } from "@/components/billingsdk/detailed-usage-table"
import { SectionHeading } from "./section-heading"
import { getResourceUsageByRole } from "./actions"

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
}

// ============================================================================
// DEFAULT DATA BY ROLE (Fallback when no real data available)
// ============================================================================

const defaultResourcesByRole: Record<DashboardRole, UsageResource[]> = {
  STUDENT: [
    { name: "Assignment Completion", used: 18, limit: 22, unit: "tasks" },
    { name: "Attendance Rate", used: 92, limit: 100, unit: "%" },
    { name: "Grade Average", used: 78, limit: 100, unit: "%" },
    { name: "Library Books", used: 3, limit: 5, unit: "books" },
  ],
  TEACHER: [
    { name: "Classes Taught", used: 18, limit: 24, unit: "classes" },
    { name: "Students Count", used: 145, limit: 200, unit: "students" },
    { name: "Pending Grading", used: 23, limit: 50, unit: "assignments" },
    { name: "Assignments Created", used: 45, limit: 100, unit: "total" },
  ],
  GUARDIAN: [
    { name: "Children Enrolled", used: 2, limit: 5, unit: "children" },
    { name: "Attendance Avg", used: 94, limit: 100, unit: "%" },
    { name: "Pending Tasks", used: 3, limit: 10, unit: "items" },
    { name: "Upcoming Events", used: 4, limit: 10, unit: "events" },
  ],
  STAFF: [
    { name: "Tasks Completed", used: 42, limit: 50, unit: "tasks" },
    { name: "Requests Processed", used: 28, limit: 40, unit: "requests" },
    { name: "Approvals Pending", used: 5, limit: 20, unit: "items" },
    { name: "Efficiency Rate", used: 87, limit: 100, unit: "%" },
  ],
  ACCOUNTANT: [
    { name: "Collection Rate", used: 87, limit: 100, unit: "%" },
    { name: "Invoices Processed", used: 156, limit: 200, unit: "invoices" },
    { name: "Outstanding Amount", used: 45000, limit: 150000, unit: "SAR" },
    { name: "Payments Today", used: 12, limit: 30, unit: "payments" },
  ],
  PRINCIPAL: [
    { name: "School Capacity", used: 892, limit: 1000, unit: "students" },
    { name: "Staff Utilization", used: 86, limit: 100, unit: "%" },
    { name: "Budget Usage", used: 780000, limit: 1000000, unit: "SAR" },
    { name: "Satisfaction Score", used: 4.2, limit: 5, unit: "rating" },
  ],
  ADMIN: [
    { name: "System Users", used: 1245, limit: 2000, unit: "users" },
    { name: "Storage Used", used: 45, limit: 100, unit: "GB" },
    { name: "Active Sessions", used: 156, limit: 500, unit: "sessions" },
    { name: "API Calls Today", used: 12500, limit: 50000, unit: "calls" },
  ],
  DEVELOPER: [
    { name: "Total Schools", used: 45, limit: 100, unit: "schools" },
    { name: "Platform Users", used: 25000, limit: 50000, unit: "users" },
    { name: "Database Size", used: 120, limit: 500, unit: "GB" },
    { name: "API Requests/Day", used: 450000, limit: 1000000, unit: "requests" },
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
export function ResourceUsageSection({ role, className }: ResourceUsageSectionProps) {
  const [resources, setResources] = useState<UsageResource[]>(defaultResourcesByRole[role] || defaultResourcesByRole.ADMIN)
  const [isLoading, setIsLoading] = useState(true)

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
      <SectionHeading title="Resource Usage" />
      <DetailedUsageTable
        resources={resources}
        title=""
        description=""
      />
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
}

/**
 * Static version of ResourceUsageSection for server-side rendering.
 * Pass pre-fetched resources data directly.
 */
export function StaticResourceUsageSection({
  role,
  resources,
  className,
}: StaticResourceUsageSectionProps) {
  const data = resources || defaultResourcesByRole[role] || defaultResourcesByRole.ADMIN

  return (
    <section className={className}>
      <SectionHeading title="Resource Usage" />
      <DetailedUsageTable
        resources={data}
        title=""
        description=""
      />
    </section>
  )
}
