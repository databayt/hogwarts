"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

export function DocsNav() {
  const pathname = usePathname()

  // Generate breadcrumbs from pathname
  const pathSegments = pathname.split("/").filter(Boolean)
  const breadcrumbs = pathSegments.map((segment, index) => {
    const href = "/" + pathSegments.slice(0, index + 1).join("/")
    const isLast = index === pathSegments.length - 1
    
    // Format segment name
    const name = segment
      .split("-")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")

    return {
      name,
      href,
      isLast,
    }
  })

  if (breadcrumbs.length <= 1) return null

  return (
    <div className="mb-4 flex items-center space-x-1 text-sm text-muted-foreground">
      <Link
        href="/docs"
        className="overflow-hidden text-ellipsis whitespace-nowrap hover:text-foreground"
      >
        Docs
      </Link>
      {breadcrumbs.slice(1).map((breadcrumb) => (
        <div key={breadcrumb.href} className="flex items-center">
          <span className="mx-1">/</span>
          <Link
            href={breadcrumb.href}
            className={cn(
              "ms-1 overflow-hidden text-ellipsis whitespace-nowrap",
              breadcrumb.isLast
                ? "text-foreground"
                : "hover:text-foreground"
            )}
          >
            {breadcrumb.name}
          </Link>
        </div>
      ))}
    </div>
  )
} 