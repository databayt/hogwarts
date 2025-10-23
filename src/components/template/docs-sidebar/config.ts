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
      title: "Overview",
      href: "/docs",
    },
    {
      title: "Product",
      href: "/docs/product",
    },
    {
      title: "Business",
      href: "/docs/business",
    },
    {
      title: "Developers",
      href: "/docs/developers",
    },
    {
      title: "Community",
      href: "/docs/community",
    },
    {
      title: "Resources",
      href: "/docs/resources",
    },
    {
      title: "Company",
      href: "/docs/company",
    },
  ],
  sidebarNav: [
    // ============ OVERVIEW SECTION ============
    {
      title: "🏠 Overview",
      items: [
        {
          title: "Welcome",
          href: "/docs",
          items: [],
        },
        {
          title: "What is Hogwarts?",
          href: "/docs/introduction",
          items: [],
        },
        {
          title: "Why Choose Us",
          href: "/docs/why-hogwarts",
          items: [],
        },
        {
          title: "Success Stories",
          href: "/docs/case-studies",
          items: [],
        },
        {
          title: "Live Demo",
          href: "/docs/demo",
          badge: "Try Now",
          items: [],
        },
      ],
    },

    // ============ PRODUCT SECTION ============
    {
      title: "📦 Product",
      items: [
        {
          title: "Quick Start",
          href: "/docs/quick-start",
          badge: "5 min",
          items: [],
        },
        {
          title: "Features",
          items: [
            {
              title: "Core Features",
              items: [
                { title: "Student Management", href: "/docs/features/students", items: [] },
                { title: "Staff Management", href: "/docs/features/staff", items: [] },
                { title: "Academic Management", href: "/docs/features/academics", items: [] },
                { title: "Attendance System", href: "/docs/features/attendance", items: [] },
                { title: "Examinations", href: "/docs/features/examinations", items: [] },
                { title: "Timetable", href: "/docs/features/timetable", items: [] },
              ]
            },
            {
              title: "Financial",
              items: [
                { title: "Fee Management", href: "/docs/features/fees", items: [] },
                { title: "Payroll", href: "/docs/features/payroll", items: [] },
                { title: "Accounting", href: "/docs/features/accounting", items: [] },
                { title: "Reports", href: "/docs/features/financial-reports", items: [] },
              ]
            },
            {
              title: "Communication",
              items: [
                { title: "Announcements", href: "/docs/features/announcements", items: [] },
                { title: "Messaging", href: "/docs/features/messaging", items: [] },
                { title: "Notifications", href: "/docs/features/notifications", items: [] },
                { title: "Parent Portal", href: "/docs/features/parent-portal", items: [] },
              ]
            },
            {
              title: "Advanced",
              items: [
                { title: "Library System", href: "/docs/features/library", items: [] },
                { title: "Transport", href: "/docs/features/transport", items: [] },
                { title: "Hostel", href: "/docs/features/hostel", items: [] },
                { title: "Inventory", href: "/docs/features/inventory", items: [] },
              ]
            }
          ],
        },
        {
          title: "User Guides",
          items: [
            { title: "Administrator Guide", href: "/docs/admin", items: [] },
            { title: "Teacher Guide", href: "/docs/teachers", items: [] },
            { title: "Student Guide", href: "/docs/students", items: [] },
            { title: "Parent Guide", href: "/docs/parents", items: [] },
            { title: "Accountant Guide", href: "/docs/accountant", items: [] },
          ],
        },
        {
          title: "Integrations",
          href: "/docs/integrations",
          items: [
            { title: "Payment Gateways", href: "/docs/integrations/payment", items: [] },
            { title: "SMS Providers", href: "/docs/integrations/sms", items: [] },
            { title: "Google Workspace", href: "/docs/integrations/google", items: [] },
            { title: "Microsoft 365", href: "/docs/integrations/microsoft", items: [] },
            { title: "Zoom", href: "/docs/integrations/zoom", items: [] },
            { title: "WhatsApp", href: "/docs/integrations/whatsapp", items: [] },
          ],
        },
      ],
    },

    // ============ BUSINESS SECTION ============
    {
      title: "💼 Business",
      items: [
        {
          title: "For Investors",
          href: "/docs/investors",
          badge: "Investment Deck",
          items: [
            { title: "Executive Summary", href: "/docs/investors/executive-summary", items: [] },
            { title: "Market Opportunity", href: "/docs/investors/market", items: [] },
            { title: "Business Model", href: "/docs/investors/business-model", items: [] },
            { title: "Financial Projections", href: "/docs/investors/financials", items: [] },
            { title: "Competitive Analysis", href: "/docs/investors/competition", items: [] },
            { title: "Growth Strategy", href: "/docs/investors/growth", items: [] },
            { title: "Team", href: "/docs/investors/team", items: [] },
            { title: "Funding", href: "/docs/investors/funding", items: [] },
          ],
        },
        {
          title: "For Partners",
          href: "/docs/partners",
          items: [
            { title: "Partnership Program", href: "/docs/partners/program", items: [] },
            { title: "Reseller Program", href: "/docs/partners/reseller", items: [] },
            { title: "Affiliate Program", href: "/docs/partners/affiliate", items: [] },
            { title: "Technology Partners", href: "/docs/partners/technology", items: [] },
            { title: "Implementation Partners", href: "/docs/partners/implementation", items: [] },
          ],
        },
        {
          title: "Sales & Marketing",
          href: "/docs/sales",
          items: [
            { title: "Sales Process", href: "/docs/sales/process", items: [] },
            { title: "Pricing", href: "/docs/sales/pricing", items: [] },
            { title: "ROI Calculator", href: "/docs/sales/roi", items: [] },
            { title: "Marketing Materials", href: "/docs/sales/materials", items: [] },
            { title: "Brand Guidelines", href: "/docs/sales/brand", items: [] },
          ],
        },
        {
          title: "Success Metrics",
          href: "/docs/metrics",
          items: [
            { title: "KPIs", href: "/docs/metrics/kpis", items: [] },
            { title: "Customer Analytics", href: "/docs/metrics/analytics", items: [] },
            { title: "Market Share", href: "/docs/metrics/market-share", items: [] },
            { title: "Growth Metrics", href: "/docs/metrics/growth", items: [] },
          ],
        },
      ],
    },

    // ============ ROADMAP & MILESTONES ============
    {
      title: "🗺️ Roadmap",
      items: [
        {
          title: "Vision & Mission",
          href: "/docs/roadmap/vision",
          items: [],
        },
        {
          title: "Product Roadmap",
          href: "/docs/roadmap",
          badge: "2024-2025",
          items: [
            { title: "Q1 2024", href: "/docs/roadmap/2024-q1", items: [] },
            { title: "Q2 2024", href: "/docs/roadmap/2024-q2", items: [] },
            { title: "Q3 2024", href: "/docs/roadmap/2024-q3", items: [] },
            { title: "Q4 2024", href: "/docs/roadmap/2024-q4", items: [] },
            { title: "2025 Vision", href: "/docs/roadmap/2025", items: [] },
          ],
        },
        {
          title: "Milestones",
          href: "/docs/milestones",
          items: [
            { title: "Achieved", href: "/docs/milestones/achieved", items: [] },
            { title: "In Progress", href: "/docs/milestones/current", items: [] },
            { title: "Upcoming", href: "/docs/milestones/upcoming", items: [] },
          ],
        },
        {
          title: "Changelog",
          href: "/docs/changelog",
          badge: "Latest",
          items: [],
        },
      ],
    },

    // ============ DEVELOPERS SECTION ============
    {
      title: "👨‍💻 Developers",
      items: [
        {
          title: "Getting Started",
          items: [
            { title: "Prerequisites", href: "/docs/requirements", items: [] },
            { title: "Installation", href: "/docs/development/setup", items: [] },
            { title: "Configuration", href: "/docs/development/config", items: [] },
            { title: "Environment Setup", href: "/docs/deployment/environment", items: [] },
          ],
        },
        {
          title: "Architecture",
          href: "/docs/architecture",
          items: [
            { title: "System Overview", href: "/docs/architecture", items: [] },
            { title: "Tech Stack", href: "/docs/stack", items: [] },
            { title: "Database Design", href: "/docs/database", items: [] },
            { title: "Multi-Tenant Architecture", href: "/docs/architecture/multi-tenant", items: [] },
            { title: "Security Architecture", href: "/docs/architecture/security", items: [] },
            { title: "Performance", href: "/docs/architecture/performance", items: [] },
          ],
        },
        {
          title: "API Reference",
          href: "/docs/api",
          badge: "REST",
          items: [
            { title: "Overview", href: "/docs/api", items: [] },
            { title: "Authentication", href: "/docs/api/authentication", items: [] },
            { title: "Core APIs", href: "/docs/api/core", items: [] },
            { title: "Webhooks", href: "/docs/api/webhooks", items: [] },
            { title: "GraphQL", href: "/docs/api/graphql", badge: "Coming Soon", items: [] },
            { title: "Rate Limits", href: "/docs/api/rate-limits", items: [] },
          ],
        },
        {
          title: "Component Library",
          href: "/docs/components",
          items: [
            { title: "UI Components", href: "/docs/components/ui", items: [] },
            { title: "Data Tables", href: "/docs/components/tables", items: [] },
            { title: "Forms", href: "/docs/components/forms", items: [] },
            { title: "Charts", href: "/docs/components/charts", items: [] },
            { title: "Auth Components", href: "/docs/components/auth", items: [] },
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
            { title: "Vercel", href: "/docs/deployment/vercel", items: [] },
            { title: "Docker", href: "/docs/deployment/docker", items: [] },
            { title: "Kubernetes", href: "/docs/deployment/kubernetes", items: [] },
            { title: "Custom Domain", href: "/docs/deployment/domain", items: [] },
            { title: "SSL/TLS", href: "/docs/deployment/ssl", items: [] },
            { title: "Monitoring", href: "/docs/deployment/monitoring", items: [] },
            { title: "Backup", href: "/docs/deployment/backup", items: [] },
            { title: "Scaling", href: "/docs/deployment/scaling", items: [] },
          ],
        },
      ],
    },

    // ============ OPEN SOURCE & COMMUNITY ============
    {
      title: "🌟 Open Source",
      items: [
        {
          title: "Contributing",
          href: "/docs/contributing",
          badge: "Join Us",
          items: [
            { title: "How to Contribute", href: "/docs/contributing/guide", items: [] },
            { title: "Code of Conduct", href: "/docs/contributing/code-of-conduct", items: [] },
            { title: "Development Setup", href: "/docs/contributing/setup", items: [] },
            { title: "Pull Request Guide", href: "/docs/contributing/pull-requests", items: [] },
            { title: "Issue Templates", href: "/docs/contributing/issues", items: [] },
          ],
        },
        {
          title: "Community",
          href: "/docs/community",
          items: [
            { title: "Discord", href: "https://discord.gg/hogwarts", external: true, items: [] },
            { title: "GitHub Discussions", href: "https://github.com/hogwarts/discussions", external: true, items: [] },
            { title: "Stack Overflow", href: "https://stackoverflow.com/questions/tagged/hogwarts", external: true, items: [] },
            { title: "Twitter", href: "https://twitter.com/hogwartsapp", external: true, items: [] },
            { title: "Blog", href: "/blog", items: [] },
          ],
        },
        {
          title: "Sharing Economy",
          href: "/docs/sharing",
          badge: "New",
          items: [
            { title: "Revenue Sharing", href: "/docs/sharing/revenue", items: [] },
            { title: "Contributor Rewards", href: "/docs/sharing/rewards", items: [] },
            { title: "Bounty Program", href: "/docs/sharing/bounties", items: [] },
            { title: "Stakeholder Benefits", href: "/docs/sharing/stakeholders", items: [] },
          ],
        },
        {
          title: "Governance",
          href: "/docs/governance",
          items: [
            { title: "Project Structure", href: "/docs/governance/structure", items: [] },
            { title: "Decision Making", href: "/docs/governance/decisions", items: [] },
            { title: "Core Team", href: "/docs/governance/team", items: [] },
            { title: "Advisory Board", href: "/docs/governance/advisory", items: [] },
          ],
        },
      ],
    },

    // ============ INCUBATOR & ACCELERATOR ============
    {
      title: "🚀 Incubator",
      items: [
        {
          title: "Startup Program",
          href: "/docs/incubator",
          badge: "Apply Now",
          items: [
            { title: "Program Overview", href: "/docs/incubator/overview", items: [] },
            { title: "Benefits", href: "/docs/incubator/benefits", items: [] },
            { title: "Application Process", href: "/docs/incubator/apply", items: [] },
            { title: "Selection Criteria", href: "/docs/incubator/criteria", items: [] },
            { title: "Success Stories", href: "/docs/incubator/alumni", items: [] },
          ],
        },
        {
          title: "Accelerator",
          href: "/docs/accelerator",
          items: [
            { title: "6-Month Program", href: "/docs/accelerator/program", items: [] },
            { title: "Mentorship", href: "/docs/accelerator/mentors", items: [] },
            { title: "Resources", href: "/docs/accelerator/resources", items: [] },
            { title: "Demo Day", href: "/docs/accelerator/demo-day", items: [] },
          ],
        },
        {
          title: "Innovation Lab",
          href: "/docs/innovation",
          items: [
            { title: "Research Projects", href: "/docs/innovation/research", items: [] },
            { title: "EdTech Trends", href: "/docs/innovation/trends", items: [] },
            { title: "AI in Education", href: "/docs/innovation/ai", items: [] },
            { title: "Future of Schools", href: "/docs/innovation/future", items: [] },
          ],
        },
      ],
    },

    // ============ RESOURCES SECTION ============
    {
      title: "📚 Resources",
      items: [
        {
          title: "Creative Assets",
          href: "/docs/creative",
          items: [
            { title: "Brand Kit", href: "/docs/creative/brand", items: [] },
            { title: "Logo Files", href: "/docs/creative/logos", items: [] },
            { title: "Marketing Templates", href: "/docs/creative/templates", items: [] },
            { title: "Video Assets", href: "/docs/creative/videos", items: [] },
            { title: "Presentation Decks", href: "/docs/creative/presentations", items: [] },
            { title: "Social Media Kit", href: "/docs/creative/social", items: [] },
          ],
        },
        {
          title: "Content Production",
          href: "/docs/content",
          items: [
            { title: "Video Tutorials", href: "/docs/content/videos", items: [] },
            { title: "Blog Writing Guide", href: "/docs/content/blog", items: [] },
            { title: "Documentation Style", href: "/docs/content/docs", items: [] },
            { title: "Translation Guide", href: "/docs/content/translation", items: [] },
            { title: "SEO Guidelines", href: "/docs/content/seo", items: [] },
          ],
        },
        {
          title: "Educational Content",
          href: "/docs/education",
          items: [
            { title: "Webinars", href: "/docs/education/webinars", items: [] },
            { title: "Courses", href: "/docs/education/courses", items: [] },
            { title: "Certifications", href: "/docs/education/certifications", items: [] },
            { title: "Best Practices", href: "/docs/education/best-practices", items: [] },
            { title: "Research Papers", href: "/docs/education/research", items: [] },
          ],
        },
        {
          title: "Templates & Tools",
          href: "/docs/templates",
          items: [
            { title: "Import Templates", href: "/docs/templates/import", items: [] },
            { title: "Report Templates", href: "/docs/templates/reports", items: [] },
            { title: "Email Templates", href: "/docs/templates/emails", items: [] },
            { title: "Document Templates", href: "/docs/templates/documents", items: [] },
            { title: "Calculators", href: "/docs/templates/calculators", items: [] },
          ],
        },
        {
          title: "Support",
          href: "/docs/support",
          items: [
            { title: "FAQ", href: "/docs/support/faq", items: [] },
            { title: "Troubleshooting", href: "/docs/support/troubleshooting", items: [] },
            { title: "Contact Support", href: "/docs/support/contact", items: [] },
            { title: "System Status", href: "https://status.hogwarts.app", external: true, items: [] },
            { title: "Feature Requests", href: "/docs/support/feature-requests", items: [] },
          ],
        },
      ],
    },

    // ============ COMPANY & LEGAL ============
    {
      title: "🏢 Company",
      items: [
        {
          title: "About Us",
          href: "/docs/company",
          items: [
            { title: "Our Story", href: "/docs/company/story", items: [] },
            { title: "Mission & Values", href: "/docs/company/mission", items: [] },
            { title: "Team", href: "/docs/company/team", items: [] },
            { title: "Careers", href: "/docs/company/careers", badge: "Hiring", items: [] },
            { title: "Press Kit", href: "/docs/company/press", items: [] },
            { title: "Contact", href: "/docs/company/contact", items: [] },
          ],
        },
        {
          title: "Legal",
          href: "/docs/legal",
          items: [
            { title: "Terms of Service", href: "/docs/legal/terms", items: [] },
            { title: "Privacy Policy", href: "/docs/legal/privacy", items: [] },
            { title: "Cookie Policy", href: "/docs/legal/cookies", items: [] },
            { title: "GDPR Compliance", href: "/docs/legal/gdpr", items: [] },
            { title: "Data Processing Agreement", href: "/docs/legal/dpa", items: [] },
            { title: "SLA", href: "/docs/legal/sla", items: [] },
            { title: "Licenses", href: "/docs/legal/licenses", items: [] },
            { title: "Trademarks", href: "/docs/legal/trademarks", items: [] },
          ],
        },
        {
          title: "Compliance",
          href: "/docs/compliance",
          items: [
            { title: "Security Certifications", href: "/docs/compliance/security", items: [] },
            { title: "ISO Standards", href: "/docs/compliance/iso", items: [] },
            { title: "FERPA", href: "/docs/compliance/ferpa", items: [] },
            { title: "COPPA", href: "/docs/compliance/coppa", items: [] },
            { title: "Accessibility", href: "/docs/compliance/accessibility", items: [] },
          ],
        },
        {
          title: "Policies",
          href: "/docs/policies",
          items: [
            { title: "Acceptable Use", href: "/docs/policies/acceptable-use", items: [] },
            { title: "Refund Policy", href: "/docs/policies/refund", items: [] },
            { title: "Support Policy", href: "/docs/policies/support", items: [] },
            { title: "Security Policy", href: "/docs/policies/security", items: [] },
            { title: "Bug Bounty", href: "/docs/policies/bug-bounty", items: [] },
          ],
        },
      ],
    },
  ],
}