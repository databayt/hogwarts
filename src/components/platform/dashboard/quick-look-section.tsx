"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { ChevronRight } from "lucide-react"
import { AnthropicIcons } from "@/components/icons/anthropic"
import Link from "next/link"

export interface QuickLookSectionProps {
  locale: string
  subdomain: string
}

export function QuickLookSection({ locale, subdomain }: QuickLookSectionProps) {
  const quickLookItems = [
    {
      icon: AnthropicIcons.Announcement,
      label: "Announcements",
      count: 3,
      newCount: 1,
      recent: "Holiday Schedule Update",
      href: `/${locale}/s/${subdomain}/announcements`,
      color: "text-[#D97757]",
      bgColor: "bg-[#D97757]/15"
    },
    {
      icon: AnthropicIcons.CalendarChart,
      label: "Events",
      count: 5,
      newCount: 2,
      recent: "Parent-Teacher Meeting",
      href: `/${locale}/s/${subdomain}/events`,
      color: "text-[#6A9BCC]",
      bgColor: "bg-[#6A9BCC]/15"
    },
    {
      icon: AnthropicIcons.Lightning,
      label: "Notifications",
      count: 12,
      newCount: 4,
      recent: "Fee reminder for Grade 10",
      href: `/${locale}/s/${subdomain}/notifications`,
      color: "text-[#CBCADB]",
      bgColor: "bg-[#CBCADB]/15"
    },
    {
      icon: AnthropicIcons.Chat,
      label: "Messages",
      count: 8,
      newCount: 2,
      recent: "Request for meeting",
      href: `/${locale}/s/${subdomain}/messaging`,
      color: "text-[#BCD1CA]",
      bgColor: "bg-[#BCD1CA]/15"
    },
  ]

  return (
    <section>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {quickLookItems.map((item) => (
          <Card key={item.label} className="p-4">
            <CardContent className="p-0 space-y-3">
              <div className="flex items-center gap-3">
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", item.bgColor)}>
                  <item.icon className={cn("h-5 w-5", item.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-semibold">{item.count}</p>
                    {item.newCount > 0 && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        +{item.newCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground truncate">{item.recent}</p>
              <Link
                href={item.href}
                className="inline-flex items-center text-xs text-primary hover:underline"
              >
                View All <ChevronRight className="ml-1 h-3 w-3" />
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
