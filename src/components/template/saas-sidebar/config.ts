type IconKey = keyof typeof import("./icons").Icons;

export type PlatformNavItem = {
  title: string;
  href: string;
  icon: IconKey;
  className?: string;
};

export const platformNav: PlatformNavItem[] = [
  // Operator navigation – accessible to all authenticated users
  { title: "Dashboard", href: "/dashboard", icon: "box" },
  { title: "Kanban", href: "/kanban", icon: "checkCircle" },
  { title: "Products", href: "/product", icon: "file" },
  { title: "Domains", href: "/domains", icon: "browser" },
  { title: "Billing", href: "/billing", icon: "pieChart" },
  { title: "Observability", href: "/observability", icon: "barChart" },
  { title: "Tenants", href: "/tenants", icon: "envelope" },
  { title: "Profile", href: "/profile", icon: "cog" },
];


