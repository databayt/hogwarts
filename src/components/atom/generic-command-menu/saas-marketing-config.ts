// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import {
  BookOpen,
  CreditCard,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Newspaper,
  Sparkles,
} from "lucide-react"

import { DOCS_LINKS } from "@/components/docs/docs-config"

import type { SearchConfig } from "./types"

export const saasMarketingSearchConfig: SearchConfig = {
  navigation: [
    {
      id: "features",
      title: "Features",
      type: "navigation",
      href: "/features",
      icon: Sparkles,
      keywords: ["capabilities", "product", "what"],
    },
    {
      id: "blog",
      title: "Blog",
      type: "navigation",
      href: "/blog",
      icon: Newspaper,
      keywords: ["articles", "posts", "news"],
    },
    {
      id: "pricing",
      title: "Pricing",
      type: "navigation",
      href: "/pricing",
      icon: CreditCard,
      keywords: ["plans", "cost", "subscription", "free"],
    },
    {
      id: "docs",
      title: "Documentation",
      type: "navigation",
      href: "/docs",
      icon: BookOpen,
      keywords: ["guides", "reference", "api"],
      breadcrumb: ["Docs"],
    },
    // Docs pages from shared config
    ...DOCS_LINKS.map((link) => ({
      id: `doc-${link.key}`,
      title: link.fallback,
      type: "navigation" as const,
      href: link.href,
      icon: FileText,
      keywords: [link.key.toLowerCase()],
      breadcrumb: ["Docs"],
    })),
  ],
  actions: [
    {
      id: "get-started",
      title: "Get Started",
      type: "action",
      href: "/docs/get-started",
      icon: GraduationCap,
      keywords: ["start", "begin", "setup", "install"],
      description: "Start using the platform",
    },
    {
      id: "dashboard",
      title: "Go to Dashboard",
      type: "action",
      href: "/dashboard",
      icon: LayoutDashboard,
      keywords: ["app", "login", "manage"],
      description: "Open the dashboard",
    },
  ],
  settings: [],
  showRecent: true,
  maxRecent: 5,
}
