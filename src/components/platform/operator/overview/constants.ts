export const KPI_SUPPORTING = {
  totalSchools: {
    label: "Schools",
    supporting: "All provisioned schools",
    trend: "up" as const,
    hint: "Operator-only aggregate metric",
  },
  activeSchools: {
    label: "Active",
    supporting: "Active subscriptions",
    trend: "down" as const,
    hint: "Toggle by plan in future",
  },
  totalUsers: {
    label: "Users",
    supporting: "Across all schools",
    trend: "up" as const,
    hint: "Includes all roles",
  },
  totalStudents: {
    label: "Students",
    supporting: "Student accounts",
    trend: "up" as const,
    hint: "More KPIs coming soon",
  },
};

export type KpiKey = keyof typeof KPI_SUPPORTING;


