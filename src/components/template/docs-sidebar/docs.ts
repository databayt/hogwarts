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
      href: "/docs/contributing",
    },
    {
      title: "Business",
      href: "/docs/business",
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
          title: "Requeriments",
          href: "/docs/requeriments",
          items: [],
        },
        {
          title: "Architecture",
          href: "/docs/architecture",
          items: [],
        },
        {
          title: "Database",
          href: "/docs/database",
          items: [],
        },
        {
          title: "Stack",
          href: "/docs/stack",
          items: [],
        },
        {
          title: "Pattern",
          href: "/docs/pattern",
          items: [],
        },
        {
          title: "Issues",
          href: "/docs/issues",
          items: [],
        },
        {
          title: "Roadmap",
          href: "/docs/roadmap",
          items: [],
        },
        {
          title: "Credits",
          href: "/docs/credit",
          items: [],
        },
        {
          title: "Vibe Coding",
          href: "/docs/vibe-coding",
          items: [],
        },
        {
          title: "Sales",
          href: "/docs/sales",
          items: [],
        },
      ],
    },
    {
      title: "Code of Conduct",
      items: [
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
        {
          title: "Contribute",
          href: "/docs/contribute",
          items: [],
        },
        {
          title: "ESLint",
          href: "/docs/eslint",
          items: [],
        },
        {
          title: "Prettier",
          href: "/docs/prettier",
          items: [],
        },
        {
          title: "Internationalization",
          href: "/docs/internationalization",
          items: [],
        },
        {
          title: "Authantication",
          href: "/docs/authantication",
          items: [],
        },
        {
          title: "Table",
          href: "/docs/table",
          items: [],
        },
        {
          title: "Frontend",
          href: "/docs/frontend",
          items: [],
        },
        {
          title: "Backend",
          href: "/docs/backend",
          items: [],
        },
        {
          title: "Onboarding",
          href: "/docs/onboarding",
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
        
        
        
        


        
        
        
        // {
        //   title: "Code Review",
        //   href: "/docs/contributing/code-review",
        //   items: [],
        // },
        // {
        //   title: "Issue Guidelines",
        //   href: "/docs/contributing/issue-guidelines",
        //   items: [],
        // },
        // {
        //   title: "Pull Requests",
        //   href: "/docs/contributing/pull-requests",
        //   items: [],
        // },
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