"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useMemo, useState } from "react"
import { usePathname } from "next/navigation"

import { useBreadcrumbTitle } from "@/components/saas-dashboard/breadcrumb-title"

type BreadcrumbItem = {
  title: string
  link: string
}

// This allows to add custom title as well
const routeMapping: Record<string, BreadcrumbItem[]> = {
  "/dashboard": [{ title: "Dashboard", link: "/dashboard" }],
  "/dashboard/employee": [
    { title: "Dashboard", link: "/dashboard" },
    { title: "Employee", link: "/dashboard/employee" },
  ],
  "/dashboard/product": [
    { title: "Dashboard", link: "/dashboard" },
    { title: "Product", link: "/dashboard/product" },
  ],
  // Add more custom mappings as needed
}

export function useBreadcrumbs() {
  const pathname = usePathname()
  const [dynamicTitle, setDynamicTitle] = useState<string | null>(null)
  const providedTitle = useBreadcrumbTitle()

  useEffect(() => {
    setDynamicTitle(null)

    // Skip fetch if a page already provided the title via BreadcrumbTitle
    if (providedTitle) return

    // Entity patterns with their API endpoints and exclusions
    const entityPatterns: Array<{
      pattern: RegExp
      api: string
      exclude?: string[]
    }> = [
      { pattern: /\/students\/([^\/\?]+)$/, api: "students" },
      { pattern: /\/teachers\/([^\/\?]+)$/, api: "teachers" },
      { pattern: /\/parents\/([^\/\?]+)$/, api: "parents" },
      { pattern: /\/classrooms\/([^\/\?]+)$/, api: "classes" },
      { pattern: /\/subjects\/([^\/\?]+)$/, api: "subjects" },
      { pattern: /\/lessons\/([^\/\?]+)$/, api: "lessons" },
      { pattern: /\/announcements\/([^\/\?]+)$/, api: "announcements" },
      { pattern: /\/assignments\/([^\/\?]+)$/, api: "assignments" },
      { pattern: /\/events\/([^\/\?]+)$/, api: "events" },
      {
        pattern: /\/grades\/([^\/\?]+)$/,
        api: "grades",
        exclude: ["analytics", "reports", "generate"],
      },
      {
        pattern: /\/stream\/dashboard\/[^\/]+\/([^\/\?]+)$/,
        api: "catalog-lessons",
      },
    ]

    // Resolve dynamic names for known resources
    try {
      for (const { pattern, api, exclude } of entityPatterns) {
        const match = pathname.match(pattern)
        if (match) {
          const id = match[1]
          // Skip if ID matches an excluded route segment
          if (exclude?.includes(id)) continue

          const qs =
            typeof window !== "undefined" ? window.location.search || "" : ""
          void fetch(`/api/${api}/${id}${qs}`)
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
              if (data?.name) setDynamicTitle(data.name as string)
            })
            .catch(() => {})
          return
        }
      }
    } catch {}
  }, [pathname, providedTitle])

  // Prefer provided title (instant, from server) over fetched title
  const resolvedTitle = providedTitle ?? dynamicTitle

  const breadcrumbs = useMemo(() => {
    // Check if we have a custom mapping for this exact path
    if (routeMapping[pathname]) {
      return routeMapping[pathname]
    }

    // If no exact match, fall back to generating breadcrumbs from the path
    const segments = pathname.split("/").filter(Boolean)
    // Filter out language segments (en, ar) and subdomain segments (s, subdomain)
    const filteredSegments = segments.filter(
      (segment) => segment !== "en" && segment !== "ar" && segment !== "s"
    )
    // Remove subdomain segment (typically after 's')
    const sIndex = segments.indexOf("s")
    const finalSegments =
      sIndex >= 0 && segments[sIndex + 1]
        ? filteredSegments.filter((_, index) => {
            const originalIndex = segments.indexOf(filteredSegments[index])
            return originalIndex !== sIndex + 1
          })
        : filteredSegments

    const items = finalSegments.map((segment, index) => {
      const path = `/${finalSegments.slice(0, index + 1).join("/")}`
      const isIdSegment =
        index === finalSegments.length - 1 &&
        /^(?:[a-z0-9]{10,}|\w{6,})$/i.test(segment)
      const title = isIdSegment
        ? (resolvedTitle ?? "\u00A0")
        : segment.charAt(0).toUpperCase() + segment.slice(1)
      return {
        title,
        link: path,
      }
    })
    return items
  }, [pathname, resolvedTitle])

  return breadcrumbs
}
