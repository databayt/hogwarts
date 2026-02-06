import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

interface BreadcrumbSegment {
  title: string
  href: string
}

interface DocsBreadcrumbProps {
  segments: BreadcrumbSegment[]
}

export function DocsBreadcrumb({ segments }: DocsBreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="text-muted-foreground flex items-center gap-1 text-sm"
    >
      {segments.map((segment, index) => (
        <div key={segment.href} className="flex items-center">
          {index > 0 && (
            <ChevronRight className="mx-1 h-4 w-4 rtl:rotate-180" />
          )}
          <Link
            href={segment.href}
            className={cn(
              "hover:text-foreground capitalize transition-colors",
              index === segments.length - 1 && "text-foreground font-medium"
            )}
          >
            {segment.title}
          </Link>
        </div>
      ))}
    </nav>
  )
}
