"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { dashboardNav } from "@/components/template/dashboard-sidebar/config";
import { Icons } from "@/components/template/dashboard-sidebar/icons";

export default function DashboardSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  const handleLinkClick = React.useCallback(() => {
    setOpenMobile(false);
  }, [setOpenMobile]);

  return (
    <Sidebar {...props} className="w-56 pt-14" collapsible="offcanvas">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              {/* <Link href="/lab/overview" className="flex items-center" onClick={handleLinkClick}>
                <div className="flex flex-col leading-none">
                  <span className="font-medium text-base text-foreground -ml-1">Hogwarts Admin</span>
                </div>
              </Link> */}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="border-0 bg-transparent">
        <ScrollArea className="h-full">
          <SidebarGroup className="p-2">
            <SidebarMenu className="space-y-1">
              {dashboardNav.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive} size="sm">
                      <Link href={item.href} className="muted" onClick={handleLinkClick}>
                        <span className="mr-2 inline-flex size-4 items-center justify-center">
                          {(() => {
                            const Icon = Icons[item.icon];
                            return Icon ? <Icon className="h-4 w-4" /> : null;
                          })()}
                        </span>
                        {item.title}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        </ScrollArea>
      </SidebarContent>
    </Sidebar>
  );
}
