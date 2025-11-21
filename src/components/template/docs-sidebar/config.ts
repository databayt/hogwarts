export interface NavItem {
  title: string
  href?: string
  disabled?: boolean
  external?: boolean
  badge?: string
  icon?: string
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
      title: "Introduction",
      href: "/docs",
    },
    {
      title: "Operator",
      href: "/docs/operator",
    },
    {
      title: "Platform",
      href: "/docs/platform",
    },
  ],
  sidebarNav: [
    // ============ GETTING STARTED ============
    {
      title: "Getting Started",
      items: [
        { title: "Overview", href: "/docs/get-started", items: [] },
        { title: "Local Setup", href: "/docs/local-setup", items: [] },
        { title: "Contributing", href: "/docs/contributing", items: [] },
      ],
    },

    // ============ ESSENTIAL DOCUMENTATION ============
    {
      title: "Documentation",
      items: [
        { title: "Introduction", href: "/docs", items: [] },
        { title: "PRD", href: "/docs/prd", items: [] },
        { title: "MVP", href: "/docs/mvp", items: [] },
        { title: "Epics", href: "/docs/epics", items: [] },
        { title: "Architecture", href: "/docs/architecture", items: [] },
        { title: "UI Factory", href: "/docs/ui-factory", items: [] },
        { title: "Unified Listing", href: "/docs/listing", items: [] },
        { title: "Demo", href: "/docs/demo", items: [] },
        { title: "Competitors", href: "/docs/competitors", items: [] },
        { title: "Awesome shadcn", href: "/docs/awesome-shadcn", items: [] },
        { title: "Inspiration", href: "/docs/inspiration", items: [] },
        { title: "Shared Economy", href: "/docs/shared-economy", items: [] },
      ],
    },

    // ============ ARCHIVED - COMMENTED OUT ============
    // {
    //   title: "Getting Started",
    //   items: [
    //     { title: "Quick Start", href: "/docs/quick-start", items: [] },
    //     { title: "Requirements", href: "/docs/requirements", items: [] },
    //   ],
    // },

    // {
    //   title: "Architecture",
    //   items: [
    //     { title: "Multi-Tenant", href: "/docs/architecture-multi-tenant", items: [] },
    //     { title: "Pattern", href: "/docs/pattern", items: [] },
    //     { title: "Tech Stack", href: "/docs/stack", items: [] },
    //     { title: "Database", href: "/docs/database", items: [] },
    //   ],
    // },

    // {
    //   title: "Operator",
    //   items: [
    //     { title: "Overview", href: "/docs/operator", items: [] },
    //     { title: "Dashboard", href: "/docs/operator-lab", items: [] },
    //   ],
    // },

    // {
    //   title: "Platform",
    //   items: [
    //     { title: "Overview", href: "/docs/platform", items: [] },
    //     { title: "Dashboard", href: "/docs/platform-lab", items: [] },
    //     { title: "Admin Dashboard", href: "/docs/admin-lab", items: [] },
    //   ],
    // },

    // {
    //   title: "Features",
    //   items: [
    //     { title: "Students", href: "/docs/features-students", items: [] },
    //     { title: "Timetable", href: "/docs/timetable", items: [] },
    //     { title: "Attendance", href: "/docs/attendance", items: [] },
    //     { title: "Attendance Deployment", href: "/docs/attendance-deployment", items: [] },
    //     { title: "Arrangements", href: "/docs/arrangements", items: [] },
    //     { title: "Exam Management", href: "/docs/exam", items: [] },
    //   ],
    // },

    // {
    //   title: "Components",
    //   items: [
    //     { title: "Dashboard Cards", href: "/docs/lab", items: [] },
    //     { title: "File Uploader", href: "/docs/file-uploader", items: [] },
    //     { title: "Tables", href: "/docs/tables", items: [] },
    //     { title: "Typography", href: "/docs/typography", items: [] },
    //     { title: "Semantic Tokens", href: "/docs/semantic-tokens", items: [] },
    //     { title: "Theme System", href: "/docs/theme", items: [] },
    //   ],
    // },

    // {
    //   title: "API",
    //   items: [
    //     { title: "Overview", href: "/docs/api", items: [] },
    //     { title: "Authentication", href: "/docs/api-authentication", items: [] },
    //   ],
    // },

    // {
    //   title: "i18n",
    //   items: [
    //     { title: "Internationalization", href: "/docs/internationalization", items: [] },
    //   ],
    // },

    // {
    //   title: "Onboarding",
    //   items: [
    //     { title: "Overview", href: "/docs/onboarding", items: [] },
    //     { title: "Add School", href: "/docs/add-school", items: [] },
    //   ],
    // },

    // {
    //   title: "Deployment",
    //   items: [
    //     { title: "Overview", href: "/docs/deployment", items: [] },
    //     { title: "Domain", href: "/docs/domain", items: [] },
    //   ],
    // },

    // {
    //   title: "Development",
    //   items: [
    //     { title: "Build System", href: "/docs/build", items: [] },
    //     { title: "ESLint", href: "/docs/eslint", items: [] },
    //     { title: "Prettier", href: "/docs/prettier", items: [] },
    //     { title: "Code of Conduct", href: "/docs/code-of-conduct", items: [] },
    //   ],
    // },

    // {
    //   title: "Claude Code",
    //   items: [
    //     { title: "Complete Guide", href: "/docs/claude-code", items: [] },
    //     { title: "Prompts", href: "/docs/prompt", items: [] },
    //   ],
    // },

    // {
    //   title: "Contributing",
    //   items: [
    //     { title: "Overview", href: "/docs/contribute", items: [] },
    //     { title: "First PR", href: "/docs/contribute-first-pr", items: [] },
    //     { title: "Open Source Contributing", href: "/docs/open-source-contributing", items: [] },
    //   ],
    // },

    // {
    //   title: "Resources",
    //   items: [
    //     { title: "Brand Guidelines", href: "/docs/brand-guidelines", items: [] },
    //   ],
    // },

    // {
    //   title: "Business",
    //   items: [
    //     {
    //       title: "PRD",
    //       href: "/docs/prd",
    //       items: [
    //         { title: "Validation Report", href: "/docs/validation", items: [] },
    //       ]
    //     },
    //     { title: "Roadmap", href: "/docs/roadmap", items: [] },
    //     { title: "Milestones", href: "/docs/milestones", items: [] },
    //     { title: "Investors - Executive Summary", href: "/docs/investors-executive-summary", items: [] },
    //   ],
    // },

    // {
    //   title: "Support",
    //   items: [
    //     { title: "FAQ", href: "/docs/support-faq", items: [] },
    //     { title: "Issues", href: "/docs/issues", items: [] },
    //     { title: "Community", href: "/docs/community", items: [] },
    //     { title: "Changelog", href: "/docs/changelog", items: [] },
    //   ],
    // },

    // {
    //   title: "Legal",
    //   items: [
    //     { title: "Privacy", href: "/docs/legal-privacy", items: [] },
    //     { title: "Terms", href: "/docs/legal-terms", items: [] },
    //   ],
    // },
  ],
}
