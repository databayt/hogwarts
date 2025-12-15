import { UserRole } from "@prisma/client"

import { SidebarNavItem } from "@/components/marketing/pricing/types"

export const sidebarLinks: SidebarNavItem[] = [
  {
    title: "MENU",
    items: [
      {
        href: "/school",
        icon: "laptop",
        title: "School Panel",
        authorizeOnly: UserRole.ADMIN,
      },
      { href: "/dashboard", icon: "dashboard", title: "Dashboard" },
      {
        href: "/school/billing",
        icon: "billing",
        title: "Billing",
        authorizeOnly: UserRole.ADMIN,
      },
      { href: "/dashboard/charts", icon: "lineChart", title: "Charts" },
      {
        href: "/school/orders",
        icon: "package",
        title: "Orders",
        badge: 2,
        authorizeOnly: UserRole.ADMIN,
      },
      {
        href: "#/lab/posts",
        icon: "post",
        title: "User Posts",
        authorizeOnly: UserRole.USER,
        disabled: true,
      },
    ],
  },
  {
    title: "OPTIONS",
    items: [
      { href: "/lab/settings", icon: "settings", title: "Settings" },
      { href: "/", icon: "home", title: "Homepage" },
      { href: "/docs", icon: "bookOpen", title: "Documentation" },
      {
        href: "#",
        icon: "messages",
        title: "Support",
        authorizeOnly: UserRole.USER,
        disabled: true,
      },
    ],
  },
]
