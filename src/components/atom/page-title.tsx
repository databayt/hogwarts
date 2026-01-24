"use client"

import * as React from "react"
import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

/**
 * Unified page header with title, description, breadcrumbs, and actions slot
 * Following shadcn/ui patterns for composition
 */
interface PageTitleProps {
  /** Page title */
  title: string
  /** Optional description */
  description?: string
  /** Optional icon to display before title */
  icon?: React.ReactNode
  /** Actions slot for toolbar, buttons, etc. */
  actions?: React.ReactNode
  /** Breadcrumb items */
  breadcrumbs?: Array<{ label: string; href?: string }>
  /** Additional class names */
  className?: string
  /** Children rendered below the header */
  children?: React.ReactNode
}

export function PageTitle({
  title,
  description,
  icon,
  actions,
  breadcrumbs,
  className,
  children,
}: PageTitleProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">
                  <Home className="h-4 w-4" />
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={crumb.label}>
                <BreadcrumbSeparator>
                  <ChevronRight className="h-4 w-4" />
                </BreadcrumbSeparator>
                <BreadcrumbItem>
                  {index === breadcrumbs.length - 1 || !crumb.href ? (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link href={crumb.href}>{crumb.label}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      )}

      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {icon && (
              <span className="text-muted-foreground flex-shrink-0">
                {icon}
              </span>
            )}
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          </div>
          {description && (
            <p className="text-muted-foreground text-sm">{description}</p>
          )}
        </div>

        {/* Actions slot */}
        {actions && <div className="flex-shrink-0">{actions}</div>}
      </div>

      {/* Children */}
      {children}
    </div>
  )
}
