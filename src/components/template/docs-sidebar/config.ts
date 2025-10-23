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
      title: "User Guides",
      href: "/docs/guides",
    },
    {
      title: "Features",
      href: "/docs/features",
    },
    {
      title: "API Reference",
      href: "/docs/api",
    },
    {
      title: "Support",
      href: "/docs/support",
    },
  ],
  sidebarNav: [
    {
      title: "Getting Started",
      items: [
        {
          title: "Welcome & Overview",
          href: "/docs",
          items: [],
        },
        {
          title: "Quick Start Guide",
          href: "/docs/quick-start",
          items: [],
        },
        {
          title: "Live Demo",
          href: "/docs/demo",
          items: [],
        },
        {
          title: "Deployment Guide",
          href: "/docs/deployment",
          items: [],
        },
        {
          title: "System Requirements",
          href: "/docs/requirements",
          items: [],
        },
      ],
    },
    {
      title: "User Guides",
      items: [
        {
          title: "For Administrators",
          href: "/docs/admin",
          items: [
            { title: "Dashboard Overview", href: "/docs/admin/dashboard", items: [] },
            { title: "School Setup", href: "/docs/admin/school-setup", items: [] },
            { title: "User Management", href: "/docs/admin/users", items: [] },
            { title: "Reports & Analytics", href: "/docs/admin/reports", items: [] },
          ],
        },
        {
          title: "For Teachers",
          href: "/docs/teachers",
          items: [
            { title: "Classroom Management", href: "/docs/teachers/classroom", items: [] },
            { title: "Taking Attendance", href: "/docs/teachers/attendance", items: [] },
            { title: "Gradebook", href: "/docs/teachers/gradebook", items: [] },
            { title: "Assignments", href: "/docs/teachers/assignments", items: [] },
            { title: "Parent Communication", href: "/docs/teachers/communication", items: [] },
          ],
        },
        {
          title: "For Students",
          href: "/docs/students",
          items: [
            { title: "Student Portal", href: "/docs/students/portal", items: [] },
            { title: "Assignments", href: "/docs/students/assignments", items: [] },
            { title: "Grades", href: "/docs/students/grades", items: [] },
            { title: "Timetable", href: "/docs/students/timetable", items: [] },
          ],
        },
        {
          title: "For Parents",
          href: "/docs/parents",
          items: [
            { title: "Parent Portal", href: "/docs/parents/portal", items: [] },
            { title: "Student Monitoring", href: "/docs/parents/monitoring", items: [] },
            { title: "Communication", href: "/docs/parents/communication", items: [] },
            { title: "Fee Payments", href: "/docs/parents/fees", items: [] },
          ],
        },
      ],
    },
    {
      title: "Features",
      items: [
        {
          title: "Core Modules",
          items: [
            { title: "Student Management", href: "/docs/features/students", items: [] },
            { title: "Course & Curriculum", href: "/docs/features/courses", items: [] },
            { title: "Attendance System", href: "/docs/features/attendance", items: [] },
            { title: "Examinations", href: "/docs/features/examinations", items: [] },
            { title: "Timetable", href: "/docs/features/timetable", items: [] },
          ],
        },
        {
          title: "Administration",
          items: [
            { title: "Fee Management", href: "/docs/features/fees", items: [] },
            { title: "Library Management", href: "/docs/features/library", items: [] },
            { title: "Admission & Enrollment", href: "/docs/features/admission", items: [] },
            { title: "Reports & Analytics", href: "/docs/features/reports", items: [] },
          ],
        },
        {
          title: "Communication",
          items: [
            { title: "Announcements", href: "/docs/features/announcements", items: [] },
            { title: "Messaging", href: "/docs/features/messaging", items: [] },
            { title: "Notifications", href: "/docs/features/notifications", items: [] },
          ],
        },
      ],
    },
    {
      title: "Developer Docs",
      items: [
        {
          title: "Architecture",
          href: "/docs/architecture",
          items: [
            { title: "System Overview", href: "/docs/architecture", items: [] },
            { title: "Database Schema", href: "/docs/database", items: [] },
            { title: "Multi-Tenant Design", href: "/docs/architecture/multi-tenant", items: [] },
            { title: "Technology Stack", href: "/docs/stack", items: [] },
          ],
        },
        {
          title: "API Reference",
          href: "/docs/api",
          items: [
            { title: "API Overview", href: "/docs/api", items: [] },
            { title: "Authentication", href: "/docs/api/authentication", items: [] },
            { title: "Student API", href: "/docs/api/students", items: [] },
            { title: "Course API", href: "/docs/api/courses", items: [] },
            { title: "Webhooks", href: "/docs/api/webhooks", items: [] },
            { title: "Error Handling", href: "/docs/api/errors", items: [] },
          ],
        },
        {
          title: "Component Library",
          href: "/docs/components",
          items: [
            { title: "Overview", href: "/docs/components", items: [] },
            { title: "Data Tables", href: "/docs/components/tables", items: [] },
            { title: "Form Components", href: "/docs/components/forms", items: [] },
            { title: "Auth Components", href: "/docs/components/auth", items: [] },
            { title: "UI Kit", href: "/docs/components/ui", items: [] },
          ],
        },
        {
          title: "Development",
          items: [
            { title: "Local Setup", href: "/docs/development/setup", items: [] },
            { title: "Code Patterns", href: "/docs/development/patterns", items: [] },
            { title: "Testing Guide", href: "/docs/development/testing", items: [] },
            { title: "Contributing", href: "/docs/development/contributing", items: [] },
            { title: "Typography System", href: "/docs/development/typography", items: [] },
          ],
        },
      ],
    },
    {
      title: "Deployment",
      items: [
        { title: "Vercel Deployment", href: "/docs/deployment/vercel", items: [] },
        { title: "Custom Domain", href: "/docs/deployment/domain", items: [] },
        { title: "SSL Configuration", href: "/docs/deployment/ssl", items: [] },
        { title: "Environment Variables", href: "/docs/deployment/environment", items: [] },
        { title: "Monitoring & Logs", href: "/docs/deployment/monitoring", items: [] },
        { title: "Backup Strategies", href: "/docs/deployment/backup", items: [] },
        { title: "Scaling Guidelines", href: "/docs/deployment/scaling", items: [] },
      ],
    },
    {
      title: "Integrations",
      items: [
        { title: "Overview", href: "/docs/integrations", items: [] },
        { title: "Google Workspace", href: "/docs/integrations/google", items: [] },
        { title: "Payment Gateways", href: "/docs/integrations/payment", items: [] },
        { title: "SMS Providers", href: "/docs/integrations/sms", items: [] },
        { title: "Calendar Sync", href: "/docs/integrations/calendar", items: [] },
        { title: "Import/Export", href: "/docs/integrations/import-export", items: [] },
      ],
    },
    {
      title: "Support",
      items: [
        { title: "FAQ", href: "/docs/support/faq", items: [] },
        { title: "Troubleshooting", href: "/docs/support/troubleshooting", items: [] },
        { title: "Video Tutorials", href: "/docs/support/videos", items: [] },
        { title: "Glossary", href: "/docs/support/glossary", items: [] },
        { title: "Contact Support", href: "/docs/support/contact", items: [] },
        { title: "Changelog", href: "/docs/changelog", items: [] },
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