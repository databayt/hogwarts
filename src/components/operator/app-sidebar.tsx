"use client"

import * as React from "react"
import {
  IconBuildingSkyscraper,
  IconDashboard,
  IconFolder,
  IconListDetails,
  IconUsers,
} from "@tabler/icons-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { NavMain } from "@/components/operator/nav-main"
import { NavUser } from "@/components/operator/nav-user"

const navItems = [
  { title: "Overview", url: "/operator/overview", icon: IconDashboard },
  { title: "Kanban", url: "/operator/kanban", icon: IconListDetails },
  { title: "Products", url: "/operator/product", icon: IconFolder },
  { title: "Profile", url: "/operator/profile", icon: IconUsers },
  { title: "Tenants", url: "/operator/tenants", icon: IconBuildingSkyscraper },
] as const

export default function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <h6>Hogwarts Admin</h6>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          items={
            [...navItems] as Array<{
              title: string
              url: string
              icon?: typeof IconDashboard
              isActive?: boolean
              items?: { title: string; url: string }[]
            }>
          }
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={{ name: "", email: "", avatar: "" }} />
      </SidebarFooter>
    </Sidebar>
  )
}
