// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

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
] as const

export type DocsLink = (typeof DOCS_LINKS)[number]

// The phone menu's first section: the help center and the guides people ask
// for most. The full role-grouped list lives in the desktop docs sidebar.
export const HELP_LINKS = [
  { href: "/docs/support", en: "Help center", ar: "مركز المساعدة" },
  {
    href: "/docs/support/get-started",
    en: "Getting started",
    ar: "البدء مع بالقلم",
  },
  { href: "/docs/support/add-student", en: "Add a student", ar: "إضافة طالب" },
  { href: "/docs/support/add-teacher", en: "Add a teacher", ar: "إضافة معلم" },
  { href: "/docs/support/attendance", en: "Attendance", ar: "الحضور والغياب" },
  {
    href: "/docs/support/fees",
    en: "Fees and invoices",
    ar: "الرسوم والفواتير",
  },
  { href: "/docs/support/login", en: "Signing in", ar: "الدخول وكلمة المرور" },
  { href: "/docs/support/faq", en: "Common questions", ar: "أسئلة شائعة" },
  {
    href: "/docs/support/contact",
    en: "Contact support",
    ar: "التواصل مع الدعم",
  },
] as const

export function helpSection(locale: string) {
  const lang = locale === "ar" ? "ar" : "en"
  return {
    title: HELP_LINKS[0][lang],
    items: HELP_LINKS.map((link) => ({
      title: link[lang],
      href: link.href,
      disabled: false,
    })),
  }
}
