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
import { platformNav } from "./constant";
import { Icons } from "@/components/template/platform-sidebar/icons";

export default function SaasSidebar() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  const handleLinkClick = React.useCallback(() => {
    setOpenMobile(false);
  }, [setOpenMobile]);

  return (
    <Sidebar className="w-56 top-16" collapsible="offcanvas">
      
      <SidebarContent className="border-0 bg-transparent">
        <ScrollArea className="h-full">
          <SidebarGroup className="p-2">
            <SidebarMenu className="space-y-1">
              {platformNav.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive} size="sm">
                      <Link href={item.href} className="muted" onClick={handleLinkClick}>
                        <span className={`mr-2 inline-flex items-center justify-center ${
                          item.className ? "size-auto" : "size-4"
                        }`}>
                          {(() => {
                            const Icon = Icons[item.icon];
                            if (item.className) {
                              return Icon ? <Icon className={item.className} /> : null;
                            }
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
