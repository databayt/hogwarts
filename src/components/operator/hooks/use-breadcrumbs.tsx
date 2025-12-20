"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname } from "next/navigation"

type BreadcrumbItem = {
  title: string
  link: string
}

// This allows to add custom title as well
const routeMapping: Record<string, BreadcrumbItem[]> = {
  "/dashboard": [{ title: "Overview", link: "/dashboard" }],
  "/dashboard/employee": [
    { title: "Overview", link: "/dashboard" },
    { title: "Employee", link: "/dashboard/employee" },
  ],
  "/dashboard/product": [
    { title: "Overview", link: "/dashboard" },
    { title: "Product", link: "/dashboard/product" },
  ],
  // Add more custom mappings as needed
}

export function useBreadcrumbs() {
  const pathname = usePathname()
  const [dynamicTitle, setDynamicTitle] = useState<string | null>(null)

  useEffect(() => {
    setDynamicTitle(null)

    // Entity patterns with their API endpoints and exclusions
    const entityPatterns: Array<{
      pattern: RegExp
      api: string
      exclude?: string[]
    }> = [
      { pattern: /\/students\/([^\/\?]+)$/, api: "students" },
      { pattern: /\/teachers\/([^\/\?]+)$/, api: "teachers" },
      { pattern: /\/parents\/([^\/\?]+)$/, api: "parents" },
      { pattern: /\/classes\/([^\/\?]+)$/, api: "classes" },
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
  }, [pathname])

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
      // Special handling for lab -> Overview
      let title =
        isIdSegment && dynamicTitle
          ? dynamicTitle
          : segment.charAt(0).toUpperCase() + segment.slice(1)
      if (segment === "dashboard") {
        title = "Overview"
      }
      return {
        title,
        link: path,
      }
    })
    return items
  }, [pathname, dynamicTitle])

  return breadcrumbs
}
