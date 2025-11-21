"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import type { source } from "@/lib/source"
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

// Flat list of links without sections - exactly like codebase-underway
const DOCS_LINKS = [
  { name: "Introduction", href: "/docs" },
  { name: "Getting Started", href: "/docs/getting-started" },
]

export function DocsSidebar({
  tree,
  lang = 'en',
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  tree: typeof source.pageTree
  lang?: string
}) {
  const pathname = usePathname()

  // Add language prefix to hrefs
  const localizedLinks = DOCS_LINKS.map(link => ({
    ...link,
    href: `/${lang}${link.href}`
  }))

  return (
    <Sidebar
      className="sticky top-[calc(var(--header-height)+1px)] z-30 hidden h-[calc(100svh-var(--footer-height)-4rem)] overscroll-none bg-transparent lg:flex"
      collapsible="none"
      {...props}
    >
      <SidebarContent className="flex flex-col overflow-hidden">
        <div className="from-background via-background/80 to-background/50 sticky top-0 z-10 h-8 shrink-0 bg-gradient-to-b blur-xs" />
        <ScrollArea className="flex-1">
          <SidebarGroup className="p-0">
            <SidebarGroupContent>
              <SidebarMenu>
                {localizedLinks.map(({ name, href }) => {
                  const isActive = pathname === href

                  return (
                    <SidebarMenuItem key={href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className="data-[active=true]:bg-accent data-[active=true]:border-accent relative h-[30px] w-full border border-transparent text-[0.8rem] font-medium px-2"
                      >
                        <Link href={href}>{name}</Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </ScrollArea>
        <div className="from-background via-background/80 to-background/50 sticky bottom-0 z-10 h-16 shrink-0 bg-gradient-to-t blur-xs" />
      </SidebarContent>
    </Sidebar>
  )
}