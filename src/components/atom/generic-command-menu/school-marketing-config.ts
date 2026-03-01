// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import {
  FileText,
  GraduationCap,
  Home,
  Info,
  LayoutDashboard,
  Mail,
} from "lucide-react"

import type { SearchConfig } from "./types"

export const schoolMarketingSearchConfig: SearchConfig = {
  navigation: [
    {
      id: "home",
      title: "Home",
      type: "navigation",
      href: "/",
      icon: Home,
      keywords: ["main", "landing"],
    },
    {
      id: "about",
      title: "About",
      type: "navigation",
      href: "/about",
      icon: Info,
      keywords: ["school", "information", "who"],
    },
    {
      id: "admissions",
      title: "Admissions",
      type: "navigation",
      href: "/admissions",
      icon: GraduationCap,
      keywords: ["apply", "enroll", "register", "enrollment"],
    },
    {
      id: "academic",
      title: "Academic",
      type: "navigation",
      href: "/academic",
      icon: FileText,
      keywords: ["curriculum", "programs", "courses"],
    },
    {
      id: "inquiry",
      title: "Inquiry",
      type: "navigation",
      href: "/inquiry",
      icon: Mail,
      keywords: ["contact", "question", "message"],
    },
  ],
  actions: [
    {
      id: "go-to-platform",
      title: "Go to Platform",
      type: "action",
      href: "/dashboard",
      icon: LayoutDashboard,
      keywords: ["login", "dashboard", "app"],
      description: "Open the school platform",
    },
  ],
  settings: [],
  showRecent: false,
}
