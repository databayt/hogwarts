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
      title: "Welcome",
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
    {
      title: "Components",
      href: "/docs/components",
    },
    {
      title: "Developers",
      href: "/docs/developers",
    },
    {
      title: "Business",
      href: "/docs/business",
    },
    {
      title: "Support",
      href: "/docs/support",
    },
  ],
  sidebarNav: [
    // ============ WELCOME & OVERVIEW ============
    {
      title: "Getting Started",
      items: [
        {
          title: "Welcome",
          href: "/docs",
          items: [],
        },
        {
          title: "Architecture",
          href: "/docs/architecture",
          items: [],
        },
        {
          title: "Quick Start",
          href: "/docs/quick-start",
          items: [],
        },
        {
          title: "Demo",
          href: "/docs/demo",
          items: [],
        },
      ],
    },

    // ============ OPERATOR (SaaS Management) ============
    {
      title: "Operator",
      items: [
        {
          title: "Overview",
          href: "/docs/operator",
          items: [],
        },
        {
          title: "Dashboard",
          href: "/docs/operator/dashboard",
          items: [],
        },
        {
          title: "Tenants",
          href: "/docs/operator/tenants",
          items: [],
        },
        {
          title: "Billing",
          href: "/docs/operator/billing",
          items: [],
        },
        {
          title: "Analytics",
          href: "/docs/operator/analytics",
          items: [],
        },
        {
          title: "Domains",
          href: "/docs/operator/domains",
          items: [],
        },
        {
          title: "Products",
          href: "/docs/operator/products",
          items: [],
        },
        {
          title: "Observability",
          href: "/docs/operator/observability",
          items: [],
        },
        {
          title: "Kanban",
          href: "/docs/operator/kanban",
          items: [],
        },
        {
          title: "Profile",
          href: "/docs/operator/profile",
          items: [],
        },
      ],
    },

    // ============ PLATFORM (School Management) ============
    {
      title: "Platform",
      items: [
        {
          title: "Overview",
          href: "/docs/platform",
          items: [],
        },
        {
          title: "Dashboard",
          href: "/docs/platform/dashboard",
          items: [],
        },
        {
          title: "Students",
          href: "/docs/platform/students",
          items: [],
        },
        {
          title: "Teachers",
          href: "/docs/platform/teachers",
          items: [],
        },
        {
          title: "Parents",
          href: "/docs/platform/parents",
          items: [],
        },
        {
          title: "Classes",
          href: "/docs/platform/classes",
          items: [],
        },
        {
          title: "Subjects",
          href: "/docs/platform/subjects",
          items: [],
        },
        {
          title: "Attendance",
          href: "/docs/platform/attendance",
          items: [],
        },
        {
          title: "Grades",
          href: "/docs/platform/grades",
          items: [],
        },
        {
          title: "Exams",
          href: "/docs/platform/exams",
          items: [],
        },
        {
          title: "Assignments",
          href: "/docs/platform/assignments",
          items: [],
        },
        {
          title: "Timetable",
          href: "/docs/platform/timetable",
          items: [],
        },
        {
          title: "Fees",
          href: "/docs/platform/fees",
          items: [],
        },
        {
          title: "Banking",
          href: "/docs/platform/banking",
          items: [],
        },
        {
          title: "Library",
          href: "/docs/platform/library",
          items: [],
        },
        {
          title: "Announcements",
          href: "/docs/platform/announcements",
          items: [],
        },
        {
          title: "Events",
          href: "/docs/platform/events",
          items: [],
        },
        {
          title: "Admission",
          href: "/docs/platform/admission",
          items: [],
        },
        {
          title: "Lessons",
          href: "/docs/platform/lessons",
          items: [],
        },
        {
          title: "Reports",
          href: "/docs/platform/reports",
          items: [],
        },
        {
          title: "Settings",
          href: "/docs/platform/settings",
          items: [],
        },
        {
          title: "Activity",
          href: "/docs/platform/activity",
          items: [],
        },
        {
          title: "Communication",
          href: "/docs/platform/communication",
          items: [],
        },
        {
          title: "Notifications",
          href: "/docs/platform/notifications",
          items: [],
        },
        {
          title: "Parent Portal",
          href: "/docs/platform/parent-portal",
          items: [],
        },
        {
          title: "Facility",
          href: "/docs/platform/facility",
          items: [],
        },
        {
          title: "Import",
          href: "/docs/platform/import",
          items: [],
        },
        {
          title: "Profile",
          href: "/docs/platform/profile",
          items: [],
        },
      ],
    },

    // ============ SHARED COMPONENTS ============
    {
      title: "Components",
      items: [
        {
          title: "Overview",
          href: "/docs/components",
          items: [],
        },
        {
          title: "Authentication",
          href: "/docs/components/auth",
          items: [],
        },
        {
          title: "Data Tables",
          href: "/docs/components/table",
          items: [],
        },
        {
          title: "File Upload",
          href: "/docs/components/file-uploader",
          items: [],
        },
        {
          title: "Rich Text Editor",
          href: "/docs/components/rich-text-editor",
          items: [],
        },
        {
          title: "Internationalization",
          href: "/docs/components/internationalization",
          items: [],
        },
        {
          title: "Theme",
          href: "/docs/components/theme",
          items: [],
        },
        {
          title: "Marketing",
          href: "/docs/components/marketing",
          items: [],
        },
        {
          title: "Onboarding",
          href: "/docs/components/onboarding",
          items: [],
        },
        {
          title: "Monitoring",
          href: "/docs/components/monitoring",
          items: [],
        },
        {
          title: "Offline Support",
          href: "/docs/components/offline",
          items: [],
        },
        {
          title: "Invoice",
          href: "/docs/components/invoice",
          items: [],
        },
        {
          title: "Stream",
          href: "/docs/components/stream",
          items: [],
        },
        {
          title: "Tenant",
          href: "/docs/components/tenant",
          items: [],
        },
        {
          title: "Sidebar",
          href: "/docs/components/sidebar",
          items: [],
        },
        {
          title: "Profile",
          href: "/docs/components/profile",
          items: [],
        },
        {
          title: "Providers",
          href: "/docs/components/providers",
          items: [],
        },
        {
          title: "Site",
          href: "/docs/components/site",
          items: [],
        },
        {
          title: "Library",
          href: "/docs/components/library",
          items: [],
        },
        {
          title: "UI Components",
          href: "/docs/components/ui",
          items: [],
        },
        {
          title: "Atoms",
          href: "/docs/components/atom",
          items: [],
        },
      ],
    },

    // ============ DEVELOPERS ============
    {
      title: "Developers",
      items: [
        {
          title: "Getting Started",
          items: [
            { title: "Requirements", href: "/docs/requirements", items: [] },
            { title: "Installation", href: "/docs/installation", items: [] },
            { title: "Configuration", href: "/docs/configuration", items: [] },
            { title: "Environment Setup", href: "/docs/environment", items: [] },
          ],
        },
        {
          title: "Architecture",
          items: [
            { title: "Overview", href: "/docs/architecture", items: [] },
            { title: "Tech Stack", href: "/docs/architecture/stack", items: [] },
            { title: "Database", href: "/docs/architecture/database", items: [] },
            { title: "Multi-Tenant", href: "/docs/architecture/multi-tenant", items: [] },
            { title: "Security", href: "/docs/architecture/security", items: [] },
            { title: "Performance", href: "/docs/architecture/performance", items: [] },
          ],
        },
        {
          title: "API",
          href: "/docs/api",
          items: [
            { title: "Overview", href: "/docs/api", items: [] },
            { title: "Authentication", href: "/docs/api/authentication", items: [] },
            { title: "Endpoints", href: "/docs/api/endpoints", items: [] },
            { title: "Webhooks", href: "/docs/api/webhooks", items: [] },
            { title: "Rate Limits", href: "/docs/api/rate-limits", items: [] },
            { title: "Errors", href: "/docs/api/errors", items: [] },
          ],
        },
        {
          title: "Development",
          items: [
            { title: "Code Style", href: "/docs/development/code-style", items: [] },
            { title: "Testing", href: "/docs/development/testing", items: [] },
            { title: "Debugging", href: "/docs/development/debugging", items: [] },
            { title: "Performance", href: "/docs/development/performance", items: [] },
            { title: "Security", href: "/docs/development/security", items: [] },
          ],
        },
        {
          title: "Deployment",
          href: "/docs/deployment",
          items: [
            { title: "Overview", href: "/docs/deployment", items: [] },
            { title: "Vercel", href: "/docs/deployment/vercel", items: [] },
            { title: "Docker", href: "/docs/deployment/docker", items: [] },
            { title: "Kubernetes", href: "/docs/deployment/kubernetes", items: [] },
            { title: "Custom Domain", href: "/docs/deployment/domain", items: [] },
            { title: "SSL", href: "/docs/deployment/ssl", items: [] },
            { title: "Monitoring", href: "/docs/deployment/monitoring", items: [] },
            { title: "Backup", href: "/docs/deployment/backup", items: [] },
          ],
        },
        {
          title: "Integrations",
          href: "/docs/integrations",
          items: [
            { title: "Payment Gateways", href: "/docs/integrations/payment", items: [] },
            { title: "SMS Providers", href: "/docs/integrations/sms", items: [] },
            { title: "Email Services", href: "/docs/integrations/email", items: [] },
            { title: "Google Workspace", href: "/docs/integrations/google", items: [] },
            { title: "Microsoft 365", href: "/docs/integrations/microsoft", items: [] },
            { title: "Zoom", href: "/docs/integrations/zoom", items: [] },
          ],
        },
      ],
    },

    // ============ BUSINESS ============
    {
      title: "Business",
      items: [
        {
          title: "Pricing",
          href: "/docs/pricing",
          items: [],
        },
        {
          title: "Roadmap",
          href: "/docs/roadmap",
          items: [],
        },
        {
          title: "Investors",
          href: "/docs/investors",
          items: [
            { title: "Executive Summary", href: "/docs/investors/executive-summary", items: [] },
            { title: "Market Opportunity", href: "/docs/investors/market", items: [] },
            { title: "Business Model", href: "/docs/investors/business-model", items: [] },
            { title: "Financial Projections", href: "/docs/investors/financials", items: [] },
          ],
        },
        {
          title: "Partners",
          href: "/docs/partners",
          items: [
            { title: "Partnership Program", href: "/docs/partners/program", items: [] },
            { title: "Technology Partners", href: "/docs/partners/technology", items: [] },
            { title: "Reseller Program", href: "/docs/partners/reseller", items: [] },
            { title: "Implementation Partners", href: "/docs/partners/implementation", items: [] },
          ],
        },
        {
          title: "Case Studies",
          href: "/docs/case-studies",
          items: [],
        },
        {
          title: "Success Stories",
          href: "/docs/success-stories",
          items: [],
        },
      ],
    },

    // ============ OPEN SOURCE ============
    {
      title: "Open Source",
      items: [
        {
          title: "Contributing",
          href: "/docs/open-source/contributing",
          items: [],
        },
        {
          title: "Code of Conduct",
          href: "/docs/open-source/code-of-conduct",
          items: [],
        },
        {
          title: "Development Setup",
          href: "/docs/open-source/setup",
          items: [],
        },
        {
          title: "Pull Requests",
          href: "/docs/open-source/pull-requests",
          items: [],
        },
        {
          title: "Issue Templates",
          href: "/docs/open-source/issues",
          items: [],
        },
        {
          title: "Community",
          href: "/docs/open-source/community",
          items: [],
        },
        {
          title: "Governance",
          href: "/docs/open-source/governance",
          items: [],
        },
      ],
    },

    // ============ RESOURCES ============
    {
      title: "Resources",
      items: [
        {
          title: "Brand Guidelines",
          href: "/docs/resources/brand-guidelines",
          items: [],
        },
        {
          title: "Templates",
          href: "/docs/resources/templates",
          items: [
            { title: "Import Templates", href: "/docs/resources/templates/import", items: [] },
            { title: "Report Templates", href: "/docs/resources/templates/reports", items: [] },
            { title: "Email Templates", href: "/docs/resources/templates/emails", items: [] },
            { title: "Document Templates", href: "/docs/resources/templates/documents", items: [] },
          ],
        },
        {
          title: "Videos",
          href: "/docs/resources/videos",
          items: [],
        },
        {
          title: "Blog",
          href: "/docs/resources/blog",
          items: [],
        },
        {
          title: "Webinars",
          href: "/docs/resources/webinars",
          items: [],
        },
        {
          title: "Research",
          href: "/docs/resources/research",
          items: [],
        },
      ],
    },

    // ============ SUPPORT ============
    {
      title: "Support",
      items: [
        {
          title: "FAQ",
          href: "/docs/support/faq",
          items: [],
        },
        {
          title: "Troubleshooting",
          href: "/docs/support/troubleshooting",
          items: [],
        },
        {
          title: "Contact",
          href: "/docs/support/contact",
          items: [],
        },
        {
          title: "System Status",
          href: "https://status.hogwarts.app",
          external: true,
          items: [],
        },
        {
          title: "Feature Requests",
          href: "/docs/support/feature-requests",
          items: [],
        },
        {
          title: "Changelog",
          href: "/docs/support/changelog",
          items: [],
        },
      ],
    },

    // ============ LEGAL ============
    {
      title: "Legal",
      items: [
        {
          title: "Terms",
          href: "/docs/legal/terms",
          items: [],
        },
        {
          title: "Privacy",
          href: "/docs/legal/privacy",
          items: [],
        },
        {
          title: "Cookies",
          href: "/docs/legal/cookies",
          items: [],
        },
        {
          title: "GDPR",
          href: "/docs/legal/gdpr",
          items: [],
        },
        {
          title: "FERPA",
          href: "/docs/legal/ferpa",
          items: [],
        },
        {
          title: "COPPA",
          href: "/docs/legal/coppa",
          items: [],
        },
        {
          title: "Data Processing",
          href: "/docs/legal/dpa",
          items: [],
        },
        {
          title: "SLA",
          href: "/docs/legal/sla",
          items: [],
        },
      ],
    },
  ],
}