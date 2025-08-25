"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from "@/components/ui/sidebar"

import { ScrollArea } from "@/components/ui/scroll-area"
import { docsConfig } from "@/components/template/docs-sidebar/constant"

// Flatten the sidebar navigation to a single list
function flattenSidebarNav(items: typeof docsConfig.sidebarNav) {
  const flatItems: Array<{
    title: string
    href: string
    isActive?: boolean
  }> = []

  items.forEach((section) => {
    section.items.forEach((item) => {
      if (item.href) {
        flatItems.push({
          title: item.title,
          href: item.href,
        })
      }
      // Add sub-items if they exist
      if (item.items && item.items.length > 0) {
        item.items.forEach((subItem) => {
          if (subItem.href) {
            flatItems.push({
              title: subItem.title,
              href: subItem.href,
            })
          }
        })
      }
    })
  })

  return flatItems
}

export function DocsSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { setOpenMobile } = useSidebar()
  const flatNavItems = React.useMemo(() => flattenSidebarNav(docsConfig.sidebarNav), [])

  const handleLinkClick = React.useCallback(() => {
    setOpenMobile(false)
  }, [setOpenMobile])

  return (
    <Sidebar 
      {...props} 
      className="w-56 "
    >
      <SidebarHeader className=" ">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/docs" className="flex items-center" onClick={handleLinkClick}>
                <div className="flex flex-col leading-none">
                  <span className="font-medium text-foreground -ml-1">Documentation</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="border-0 bg-transparent">
        <ScrollArea className="h-full">
          <SidebarGroup className="p-2">
            <SidebarMenu className="space-y-1">
              {flatNavItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive} size="sm">
                      <Link href={item.href} className="muted font-normal" onClick={handleLinkClick}>
                        {item.title}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroup>
        </ScrollArea>
      </SidebarContent>
    </Sidebar>
  )
} 