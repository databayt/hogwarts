"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from "@/components/ui/sidebar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { docsConfig } from "@/components/template/docs-sidebar/config"
import type { SidebarNavItem } from "@/components/template/docs-sidebar/config"

// Flatten the nested navigation structure into a single list
function flattenNavItems(items: SidebarNavItem[]): { title: string; href: string }[] {
  const flattened: { title: string; href: string }[] = []

  function flatten(items: SidebarNavItem[]) {
    items.forEach(item => {
      // Add the item if it has an href
      if (item.href) {
        flattened.push({
          title: item.title,
          href: item.href
        })
      }

      // Recursively flatten children
      if (item.items && item.items.length > 0) {
        flatten(item.items)
      }
    })
  }

  flatten(items)
  return flattened
}

export function DocsSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { setOpenMobile } = useSidebar()

  // Flatten all navigation items into a single list
  const flatNavItems = React.useMemo(() =>
    flattenNavItems(docsConfig.sidebarNav),
    []
  )

  const handleLinkClick = React.useCallback(() => {
    setOpenMobile(false)
  }, [setOpenMobile])

  return (
    <Sidebar
      {...props}
      className="w-56"
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/docs" className="flex items-center" onClick={handleLinkClick}>
                <span className="font-medium text-base text-foreground -ml-1">Documentation</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <ScrollArea className="h-full">
          <div className="px-3 py-2">
            <SidebarMenu>
              {flatNavItems.map((item) => {
                const isActive = pathname === item.href

                return (
                  <SidebarMenuItem key={item.href} className="py-1">
                    <SidebarMenuButton
                      asChild
                      size="sm"
                      isActive={isActive}
                      onClick={handleLinkClick}
                    >
                      <Link href={item.href}>
                        <span className="text-sm font-normal">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </div>
        </ScrollArea>
      </SidebarContent>
    </Sidebar>
  )
}