type IconKey = keyof typeof import("./icons").Icons

export const dashboardNav: { title: string; href: string; icon: IconKey }[] = [
  { title: "Overview", href: "/saas-dashboard/overview", icon: "box" },
  { title: "Kanban", href: "/saas-dashboard/kanban", icon: "checkCircle" },
  { title: "Products", href: "/saas-dashboard/product", icon: "file" },
  { title: "Domains", href: "/saas-dashboard/domains", icon: "browser" },
  { title: "Billing", href: "/saas-dashboard/billing", icon: "pieChart" },
  {
    title: "Observability",
    href: "/saas-dashboard/observability",
    icon: "barChart",
  },
  { title: "Tenants", href: "/saas-dashboard/tenants", icon: "envelope" },
  { title: "Profile", href: "/saas-dashboard/profile", icon: "cog" },
]
