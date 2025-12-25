// Docs sidebar links configuration
// Shared between desktop sidebar (client) and mobile menu (server)
export const DOCS_LINKS = [
  { key: "introduction", href: "/docs", fallback: "Introduction" },
  { key: "pitch", href: "/docs/pitch", fallback: "Pitch" },
  { key: "mvp", href: "/docs/mvp", fallback: "MVP" },
  { key: "prd", href: "/docs/prd", fallback: "PRD" },
  { key: "getStarted", href: "/docs/get-started", fallback: "Get Started" },
  { key: "architecture", href: "/docs/architecture", fallback: "Architecture" },
  { key: "structure", href: "/docs/structure", fallback: "Structure" },
  { key: "pattern", href: "/docs/pattern", fallback: "Pattern" },
  { key: "stack", href: "/docs/stack", fallback: "Stack" },
  { key: "icons", href: "/docs/icons", fallback: "Icons" },
  { key: "dashboard", href: "/docs/dashboard", fallback: "Dashboard" },
  { key: "rebound", href: "/docs/rebound", fallback: "Rebound" },
  { key: "database", href: "/docs/database", fallback: "Database" },
  { key: "attendance", href: "/docs/attendance", fallback: "Attendance" },
  { key: "localhost", href: "/docs/localhost", fallback: "Localhost" },
  { key: "contributing", href: "/docs/contributing", fallback: "Contributing" },
  {
    key: "sharedEconomy",
    href: "/docs/shared-economy",
    fallback: "Shared Economy",
  },
  { key: "competitors", href: "/docs/competitors", fallback: "Competitors" },
  { key: "inspiration", href: "/docs/inspiration", fallback: "Inspiration" },
  { key: "demo", href: "/docs/demo", fallback: "Demo" },
  { key: "listings", href: "/docs/listings", fallback: "Listings" },
  { key: "business", href: "/docs/business", fallback: "Business" },
] as const

export type DocsLink = (typeof DOCS_LINKS)[number]
