"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import { useLocale } from "@/components/internationalization/use-locale"
import { Icons } from "@/components/template/platform-sidebar/icons"

import { platformNav } from "./config"

export default function SaasSidebar() {
  const pathname = usePathname()
  const { setOpenMobile } = useSidebar()
  const { dictionary } = useDictionary()
  const { isRTL, locale } = useLocale()

  const handleLinkClick = React.useCallback(() => {
    setOpenMobile(false)
  }, [setOpenMobile])

  return (
    <Sidebar
      className="top-16 w-56"
      collapsible="offcanvas"
      side={isRTL ? "right" : "left"}
    >
      <SidebarContent className="border-0 bg-transparent">
        <ScrollArea className="h-full" dir={isRTL ? "rtl" : "ltr"}>
          <SidebarGroup className="p-2">
            <SidebarMenu className="list-none space-y-1">
              {platformNav.map((item) => {
                // Prepend locale to href to preserve language when navigating
                const localizedHref = `/${locale}${item.href}`
                const isActive =
                  pathname === localizedHref ||
                  pathname?.startsWith(localizedHref + "/")
                // Get translated title from dictionary if available
                const sidebarDict = dictionary?.saas?.sidebar as
                  | Record<string, string>
                  | undefined
                const translatedTitle = sidebarDict?.[item.title] || item.title

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive} size="sm">
                      <Link
                        href={localizedHref}
                        className="muted"
                        onClick={handleLinkClick}
                      >
                        <span className="inline-flex size-4 items-center justify-center">
                          {(() => {
                            const Icon = Icons[item.icon]
                            if (item.className) {
                              return Icon ? (
                                <Icon className={item.className} />
                              ) : null
                            }
                            return Icon ? <Icon className="h-4 w-4" /> : null
                          })()}
                        </span>
                        {translatedTitle}
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
