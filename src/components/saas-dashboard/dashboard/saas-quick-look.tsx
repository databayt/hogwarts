"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { AnthropicIcons } from "@/components/icons"

// ============================================================================
// TYPES
// ============================================================================

interface SaasQuickLookProps {
  locale: string
  totals: {
    totalSchools: number
    activeSchools: number
    totalUsers: number
    totalStudents: number
  }
}

// Quick Look item configuration with colors and icons
const quickLookConfig = {
  messages: {
    icon: AnthropicIcons.Chat,
    label: "Messages",
    href: "/sales",
    color: "text-[#D97757]",
    bgColor: "bg-[#D97757]/15",
  },
  notifications: {
    icon: AnthropicIcons.Lightning,
    label: "Notifications",
    href: "/observability",
    color: "text-[#6A9BCC]",
    bgColor: "bg-[#6A9BCC]/15",
  },
  schools: {
    icon: AnthropicIcons.Briefcase,
    label: "Total Schools",
    href: "/tenants",
    color: "text-[#CBCADB]",
    bgColor: "bg-[#CBCADB]/15",
  },
  users: {
    icon: AnthropicIcons.Users,
    label: "Active Users",
    href: "/tenants",
    color: "text-[#BCD1CA]",
    bgColor: "bg-[#BCD1CA]/15",
  },
} as const

// ============================================================================
// COMPONENT
// ============================================================================

export function SaasQuickLook({ locale, totals }: SaasQuickLookProps) {
  const items = [
    {
      ...quickLookConfig.messages,
      count: 0,
      badge: null,
    },
    {
      ...quickLookConfig.notifications,
      count: 0,
      badge: null,
    },
    {
      ...quickLookConfig.schools,
      count: totals.totalSchools,
      badge: `${totals.activeSchools} active`,
    },
    {
      ...quickLookConfig.users,
      count: totals.totalUsers,
      badge: null,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <Link key={item.label} href={`/${locale}${item.href}`}>
            <Card className="group hover:bg-accent cursor-pointer border-none shadow-none transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className={cn("rounded-lg p-2", item.bgColor)}>
                    <Icon className={cn("h-5 w-5", item.color)} />
                  </div>
                  <ChevronRight className="text-muted-foreground h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-bold">{item.count}</p>
                  <p className="text-muted-foreground text-xs">{item.label}</p>
                </div>
                {item.badge && (
                  <Badge
                    variant="secondary"
                    className="mt-2 text-xs font-normal"
                  >
                    {item.badge}
                  </Badge>
                )}
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
