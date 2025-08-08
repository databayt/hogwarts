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
      title: "Getting Started",
      items: [
        {
          title: "Introduction",
          href: "/docs",
          items: [],
        },
        {
          title: "Requirements",
          href: "/docs/requeriments",
          items: [],
        },
        {
          title: "Roadmap",
          href: "/docs/roadmap",
          items: [],
        },
        {
          title: "Architecture",
          href: "/docs/architecture",
          items: [],
        },
        {
          title: "Arrangements",
          href: "/docs/arrangements",
          items: [],
        },
        {
          title: "Pattern",
          href: "/docs/pattern",
          items: [],
        },
        {
          title: "Stack",
          href: "/docs/stack",
          items: [],
        },
        {
          title: "Database",
          href: "/docs/database",
          items: [],
        },
        {
          title: "Add School",
          href: "/docs/add-school",
          items: [],
        },
        {
          title: "Milestones",
          href: "/docs/milestones",
          items: [],
        },
        {
          title: "Awesome shadcn",
          href: "/docs/awesome-shadcn",
          items: [],
        },
        // Issues page can be added later if needed
        {
          title: "Changelog",
          href: "/docs/changelog",
          items: [],
        },
        {
          title: "Issues",
          href: "/docs/issues",
          items: [],
        },
        // Optional sections can be re-added later if needed
      ],
    },
    {
      title: "Community",
      items: [
        {
          title: "Community",
          href: "/docs/community",
          items: [],
        },
        {
          title: "Code of Conduct",
          href: "/docs/code-of-conduct",
          items: [],
        },
      ],
    },
    {
      title: "Contribute",
      items: [
        { title: "Contribute", href: "/docs/contribute", items: [] },
        { title: "First PR Guide", href: "/docs/contribute/first-pr", items: [] },
        { title: "ESLint", href: "/docs/eslint", items: [] },
        { title: "Prettier", href: "/docs/prettier", items: [] },
      ],
    },
    {
      title: "Operations",
      items: [
        { title: "Internationalization", href: "/docs/internationalization", items: [] },
        { title: "Authentication", href: "/docs/authantication", items: [] },
        { title: "Onboarding", href: "/docs/onboarding", items: [] },
        { title: "Dashboard", href: "/docs/dashboard", items: [] },
        { title: "Table", href: "/docs/table", items: [] },
       
      ],
    },
    // {
    //   title: "Governance",
    //   items: [
    //     {
    //       title: "Code of Conduct",
    //       href: "/docs/governance/code-of-conduct",
    //       items: [],
    //     },
    //     {
    //       title: "Decision Making",
    //       href: "/docs/governance/decision-making",
    //       items: [],
    //     },
    //     {
    //       title: "Stock Sharing",
    //       href: "/docs/governance/stock-sharing",
    //       items: [],
    //     },
    //   ],
    // },
    // {
    //   title: "Development",
    //   items: [
    //     {
    //       title: "Development Patterns",
    //       href: "/docs/development/patterns",
    //       items: [],
    //     },
    //     {
    //       title: "Rules & Standards",
    //       href: "/docs/development/rules",
    //       items: [],
    //     },
    //     {
    //       title: "Technical Record",
    //       href: "/docs/development/technical-record",
    //       items: [],
    //     },
    //     {
    //       title: "MCP Protocols",
    //       href: "/docs/development/mcp",
    //       items: [],
    //     },
    //   ],
    // },
    // {
    //   title: "Business",
    //   items: [
    //     {
    //       title: "Roadmap",
    //       href: "/docs/business/roadmap",
    //       items: [],
    //     },
    //     {
    //       title: "Earning Model",
    //       href: "/docs/business/earning",
    //       items: [],
    //     },
    //     {
    //       title: "Sales Process",
    //       href: "/docs/business/sales",
    //       items: [],
    //     },
    //     {
    //       title: "Pricing Strategy",
    //       href: "/docs/business/pricing",
    //       items: [],
    //     },
    //   ],
    // },
    // {
    //   title: "Community",
    //   items: [
    //     {
    //       title: "Issues & Support",
    //       href: "/docs/community/issues",
    //       items: [],
    //     },
    //     {
    //       title: "Discussions",
    //       href: "/docs/community/discussions",
    //       items: [],
    //     },
    //     {
    //       title: "Customer Support",
    //       href: "/docs/community/support",
    //       items: [],
    //     },
    //   ],
    // },
    // {
    //   title: "Legal",
    //   items: [
    //     {
    //       title: "Open Source Licenses",
    //       href: "/docs/legal/licenses",
    //       items: [],
    //     },
    //     {
    //       title: "Terms of Service",
    //       href: "/docs/legal/terms",
    //       items: [],
    //     },
    //     {
    //       title: "Privacy Policy",
    //       href: "/docs/legal/privacy",
    //       items: [],
    //     },
    //   ],
    // },
    // {
    //   title: "Meta",
    //   items: [
    //     {
    //       title: "Changelog",
    //       href: "/docs/meta/changelog",
    //       items: [],
    //     },
    //     {
    //       title: "Site Map",
    //       href: "/docs/meta/sitemap",
    //       items: [],
    //     },
    //     {
    //       title: "API Reference",
    //       href: "/docs/meta/api-reference",
    //       items: [],
    //     },
    //   ],
    // },
  ],
} 