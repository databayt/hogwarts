export interface NavItem {
  title: string
  href?: string
  disabled?: boolean
  external?: boolean
}

export interface NavItemWithChildren extends NavItem {
  items: NavItemWithChildren[]
}

export type MainNavItem = NavItem

export type SidebarNavItem = NavItemWithChildren

interface DocsConfig {
  mainNav: MainNavItem[]
  sidebarNav: SidebarNavItem[]
}

export const docsConfig: DocsConfig = {
  mainNav: [
    {
      title: "Documentation",
      href: "/docs",
    },
    {
      title: "Architecture",
      href: "/docs/architecture",
    },
    {
      title: "Contributing",
      href: "/docs/contribute",
    },
    {
      title: "Community",
      href: "/docs/community",
    },
  ],
  sidebarNav: [
    {
      title: "",  // No section title for flat structure
      items: [
        { title: "Introduction", href: "/docs", items: [] },
        { title: "Pitch", href: "/docs/pitch", items: [] },
        { title: "MVP", href: "/docs/mvp", items: [] },
        { title: "PRD", href: "/docs/prd", items: [] },
        { title: "Get Started", href: "/docs/installation", items: [] },
        { title: "Architecture", href: "/docs/architecture", items: [] },
        { title: "Pattern", href: "/docs/pattern", items: [] },
        { title: "Stack", href: "/docs/stack", items: [] },
        { title: "Database", href: "/docs/database", items: [] },
        { title: "Localhost", href: "/docs/localhost", items: [] },
        { title: "Contributing", href: "/docs/contributing", items: [] },
        { title: "Shared Economy", href: "/docs/shared-economy", items: [] },
        { title: "Competitors", href: "/docs/competitors", items: [] },
        { title: "Inspiration", href: "/docs/inspiration", items: [] },
        { title: "Demo", href: "/docs/demo", items: [] },
      ],
    },
  ],
}
