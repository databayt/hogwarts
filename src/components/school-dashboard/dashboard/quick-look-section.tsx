"use client"

import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { AnthropicIcons } from "@/components/icons"

import type { QuickLookData } from "./actions"

export interface QuickLookSectionProps {
  locale: string
  subdomain: string
  data?: QuickLookData
}

// Quick Look item configuration with colors and icons
const quickLookConfig = {
  announcements: {
    icon: AnthropicIcons.Announcement,
    label: "Announcements",
    href: "/announcements",
    color: "text-[#D97757]",
    bgColor: "bg-[#D97757]/15",
  },
  events: {
    icon: AnthropicIcons.CalendarChart,
    label: "Events",
    href: "/events",
    color: "text-[#6A9BCC]",
    bgColor: "bg-[#6A9BCC]/15",
  },
  notifications: {
    icon: AnthropicIcons.Lightning,
    label: "Notifications",
    href: "/notifications",
    color: "text-[#CBCADB]",
    bgColor: "bg-[#CBCADB]/15",
  },
  messages: {
    icon: AnthropicIcons.Chat,
    label: "Messages",
    href: "/messaging",
    color: "text-[#BCD1CA]",
    bgColor: "bg-[#BCD1CA]/15",
  },
} as const

export function QuickLookSection({
  locale,
  subdomain,
  data,
}: QuickLookSectionProps) {
  // Default/fallback data when no real data is provided
  const defaultData: QuickLookData = {
    announcements: { type: "announcements", count: 0, newCount: 0, recent: "" },
    events: { type: "events", count: 0, newCount: 0, recent: "" },
    notifications: { type: "notifications", count: 0, newCount: 0, recent: "" },
    messages: { type: "messages", count: 0, newCount: 0, recent: "" },
  }

  const quickLookData = data || defaultData

  const quickLookItems = [
    { ...quickLookConfig.announcements, data: quickLookData.announcements },
    { ...quickLookConfig.events, data: quickLookData.events },
    { ...quickLookConfig.notifications, data: quickLookData.notifications },
    { ...quickLookConfig.messages, data: quickLookData.messages },
  ]

  return (
    <section>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {quickLookItems.map((item) => {
          const Icon = item.icon
          const hasNew = item.data.newCount > 0

          return (
            <Card key={item.label} className="p-4">
              <CardContent className="space-y-3 p-0">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg",
                      item.bgColor
                    )}
                  >
                    <Icon className={cn("h-5 w-5", item.color)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-muted-foreground text-xs">
                      {item.label}
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-semibold">{item.data.count}</p>
                      {hasNew && (
                        <Badge
                          variant="secondary"
                          className={cn(
                            "px-1.5 py-0 text-[10px]",
                            item.data.newCount > 0 &&
                              "bg-primary/10 text-primary"
                          )}
                        >
                          +{item.data.newCount} new
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                {item.data.recent && (
                  <p
                    className="text-muted-foreground truncate text-xs"
                    title={item.data.recent}
                  >
                    {item.data.recent}
                  </p>
                )}
                {!item.data.recent && item.data.count === 0 && (
                  <p className="text-muted-foreground text-xs italic">
                    No recent {item.label.toLowerCase()}
                  </p>
                )}
                <Link
                  href={`/${locale}/s/${subdomain}${item.href}`}
                  className="text-primary inline-flex items-center text-xs hover:underline"
                >
                  View All <ChevronRight className="ms-1 h-3 w-3" />
                </Link>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}

// Server wrapper component to fetch data and pass to client
export { QuickLookSectionServer } from "./quick-look-section-server"
