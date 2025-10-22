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
import { platformNav } from "@/components/template/platform-sidebar/config";
import type { Role } from "@/components/template/platform-sidebar/config";
import { Icons } from "@/components/template/platform-sidebar/icons";
import { useCurrentRole } from "@/components/auth/use-current-role";
import type { School } from "@/components/site/types";
import { useDictionary } from "@/components/internationalization/use-dictionary";
import { useLocale } from "@/components/internationalization/use-locale";

interface PlatformSidebarProps extends React.ComponentProps<typeof Sidebar> {
  school?: School;
  lang?: string;
}

export default function PlatformSidebar({ school, lang, ...props }: PlatformSidebarProps = {}) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const role = useCurrentRole();
  const currentRole = (role as unknown as Role | undefined) ?? undefined;
  const { dictionary } = useDictionary();
  const { isRTL, locale } = useLocale();

  // Use school name if available, otherwise use a default
  const schoolName = school?.name || "Your School";

  const handleLinkClick = React.useCallback(() => {
    setOpenMobile(false);
  }, [setOpenMobile]);

  return (
    <Sidebar {...props} className="w-56 top-16" collapsible="offcanvas" side={isRTL ? "right" : "left"}>
      {/* <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard" className="flex items-center" onClick={handleLinkClick}>
                <div className="flex flex-col leading-none">
                  <span className="font-medium text-foreground -ml-1">{schoolName}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader> */}
      <SidebarContent className="border-0 bg-transparent">
        <ScrollArea className="h-full" dir={isRTL ? "rtl" : "ltr"}>
          <SidebarGroup className="p-2 pb-8">
            <SidebarMenu className="space-y-1 list-none">
              {platformNav
                // TODO: Re-enable role-based filtering when needed
                // .filter((item) => (currentRole ? item.roles.includes(currentRole) : false))
                .map((item) => {
                // Prepend locale to href to preserve language when navigating
                const localizedHref = `/${locale}${item.href}`;
                const isActive = pathname === localizedHref || pathname?.startsWith(localizedHref + "/");
                // Get translated title from dictionary if available
                const sidebarDict = dictionary?.platform?.sidebar as Record<string, string> | undefined;
                const translatedTitle = sidebarDict?.[item.title] || item.title;

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive} size="sm">
                      <Link
                        href={localizedHref}
                        className="muted"
                        onClick={handleLinkClick}
                      >
                        <span className="inline-flex items-center justify-center size-4">
                          {(() => {
                            const Icon = Icons[item.icon];
                            if (item.className) {
                              return Icon ? <Icon className={item.className} /> : null;
                            }
                            return Icon ? <Icon className="h-4 w-4" /> : null;
                          })()}
                        </span>
                        {translatedTitle}
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
