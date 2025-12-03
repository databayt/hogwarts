// @ts-nocheck
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

// Flat list of links without sections
const ATOMS_LINKS = [
  { name: "Introduction", href: "/atoms" },

  // Form / Authentication
  { name: "OAuth Button", href: "/atoms/oauth-button" },
  { name: "OAuth Button Group", href: "/atoms/oauth-button-group" },
  { name: "Divider With Text", href: "/atoms/divider-with-text" },
  { name: "Form Field", href: "/atoms/form-field" },
  { name: "Settings Toggle Row", href: "/atoms/settings-toggle-row" },
  { name: "Payment Method Selector", href: "/atoms/payment-method-selector" },

  // Display / User
  { name: "User Info Card", href: "/atoms/user-info-card" },

  // Card Components
  { name: "Activity Goal", href: "/atoms/activity-goal" },
  { name: "Calendar", href: "/atoms/calendar" },
  { name: "Metric", href: "/atoms/metric" },
  { name: "Report Issue", href: "/atoms/report-issue" },
  { name: "Share", href: "/atoms/share" },
  { name: "Stats", href: "/atoms/stats" },

  // Animation
  { name: "Card Hover Effect", href: "/atoms/card-hover-effect" },
  { name: "Cards Metric", href: "/atoms/cards-metric" },
  { name: "Card", href: "/atoms/card" },
  { name: "Gradient Animation", href: "/atoms/gradient-animation" },
  { name: "Infinite Cards", href: "/atoms/infinite-cards" },
  { name: "Infinite Slider", href: "/atoms/infinite-slider" },
  { name: "Progressive Blur", href: "/atoms/progressive-blur" },
  { name: "Simple Marquee", href: "/atoms/simple-marquee" },
  { name: "Sticky Scroll", href: "/atoms/sticky-scroll" },

  // Interactive
  { name: "Accordion", href: "/atoms/accordion" },
  { name: "Expand Button", href: "/atoms/expand-button" },
  { name: "Faceted", href: "/atoms/faceted" },
  { name: "Sortable", href: "/atoms/sortable" },
  { name: "Tabs", href: "/atoms/tabs" },
  { name: "Two Buttons", href: "/atoms/two-buttons" },

  // AI
  { name: "AI Prompt Input", href: "/atoms/ai-prompt-input" },
  { name: "AI Response Display", href: "/atoms/ai-response-display" },
  { name: "AI Status Indicator", href: "/atoms/ai-status-indicator" },
  { name: "AI Streaming Text", href: "/atoms/ai-streaming-text" },
  { name: "Prompt Input", href: "/atoms/prompt-input" },
  { name: "Reasoning", href: "/atoms/reasoning" },
  { name: "Response", href: "/atoms/response" },

  // Layout
  { name: "Agent Heading", href: "/atoms/agent-heading" },
  { name: "Announcement", href: "/atoms/announcement" },
  { name: "Header Section", href: "/atoms/header-section" },
  { name: "Loading", href: "/atoms/loading" },
  { name: "Modal System", href: "/atoms/modal-system" },
  { name: "Page Actions", href: "/atoms/page-actions" },
  { name: "Page Header", href: "/atoms/page-header" },
  { name: "Theme Provider", href: "/atoms/theme-provider" },

  // Utilities
  { name: "Fonts", href: "/atoms/fonts" },
  { name: "Icons", href: "/atoms/icons" },
]

export function AtomsSidebar({
  tree,
  ...props
}: React.ComponentProps<typeof Sidebar> & { tree: typeof atomsSource.pageTree }) {
  const pathname = usePathname()

  return (
    <Sidebar
      className="sticky top-[calc(var(--header-height)+2rem)] z-30 hidden h-[calc(100vh-var(--header-height)-4rem)] overflow-y-auto bg-transparent lg:flex"
      collapsible="none"
      {...props}
    >
      <SidebarContent className="overflow-y-auto gap-0">
        <ScrollArea className="h-full w-full">
          <div className="pb-4 pt-2 pl-0">
            <SidebarGroup className="p-0">
              <SidebarGroupContent>
                <SidebarMenu>
                  {ATOMS_LINKS.map(({ name, href }) => {
                    const isActive = pathname === href

                    return (
                      <SidebarMenuItem key={href}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          className="relative h-[30px] w-full border border-transparent text-[0.8rem] font-medium p-0"
                        >
                          <Link href={href} className="block w-full">{name}</Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </div>
        </ScrollArea>
      </SidebarContent>
    </Sidebar>
  )
}
