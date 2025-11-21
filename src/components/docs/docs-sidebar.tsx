"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronRight } from "lucide-react"

interface PageTreeNode {
  type: 'page' | 'folder' | 'separator'
  name: string
  url?: string
  children?: PageTreeNode[]
  isNew?: boolean
}

interface DocsSidebarProps {
  tree: {
    name: string
    children: PageTreeNode[]
  }
  lang: 'ar' | 'en'
}

// Top-level sections for quick navigation
const TOP_LEVEL_SECTIONS = {
  ar: [
    { name: "البداية", href: "/docs" },
    { name: "المكونات", href: "/docs/components" },
    { name: "المنصة", href: "/docs/platform" },
    { name: "واجهة البرمجة", href: "/docs/api" },
    { name: "البنية", href: "/docs/architecture" },
    { name: "النشر", href: "/docs/deployment" },
  ],
  en: [
    { name: "Get Started", href: "/docs" },
    { name: "Components", href: "/docs/components" },
    { name: "Platform", href: "/docs/platform" },
    { name: "API", href: "/docs/api" },
    { name: "Architecture", href: "/docs/architecture" },
    { name: "Deployment", href: "/docs/deployment" },
  ],
}

// Pages that should show a "New" badge
const PAGES_NEW = [
  "/docs/components/drawer",
  "/docs/components/pagination",
  "/docs/components/breadcrumb",
]

export function DocsSidebar({ tree, lang }: DocsSidebarProps) {
  const pathname = usePathname()
  const isRTL = lang === 'ar'
  const sections = TOP_LEVEL_SECTIONS[lang]

  const isActive = (href: string) => {
    const fullHref = `/${lang}${href}`
    if (fullHref === `/${lang}/docs`) {
      return pathname === fullHref
    }
    return pathname.startsWith(fullHref)
  }

  const renderNode = (node: PageTreeNode, depth = 0) => {
    if (node.type === 'separator') {
      return <hr key={node.name} className="my-2" />
    }

    const href = node.url ? `/${lang}${node.url}` : undefined
    const active = href ? isActive(node.url!) : false

    if (node.type === 'folder') {
      return (
        <SidebarGroup key={node.name}>
          {depth === 0 && (
            <SidebarGroupLabel className="text-xs font-medium text-muted-foreground">
              {node.name}
            </SidebarGroupLabel>
          )}
          {node.children && (
            <SidebarGroupContent>
              <SidebarMenu>
                {node.children.map(child => renderNode(child, depth + 1))}
              </SidebarMenu>
            </SidebarGroupContent>
          )}
        </SidebarGroup>
      )
    }

    if (node.type === 'page' && href) {
      const isNew = PAGES_NEW.includes(node.url || '')

      return (
        <SidebarMenuItem key={node.url}>
          <SidebarMenuButton
            asChild
            className={cn(
              "relative w-full justify-start",
              active && "bg-secondary font-medium text-foreground",
              isRTL && "flex-row-reverse text-right"
            )}
          >
            <Link href={href}>
              {isRTL && <ChevronRight className="ml-auto h-4 w-4 opacity-50" />}
              <span className={cn("truncate", isRTL && "mr-2")}>{node.name}</span>
              {isNew && (
                <Badge variant="secondary" className={cn("ml-2 h-5 px-1.5 text-[10px] font-medium", isRTL && "mr-2 ml-0")}>
                  {lang === 'ar' ? 'جديد' : 'New'}
                </Badge>
              )}
              {!isRTL && active && <ChevronRight className="ml-auto h-4 w-4 opacity-50" />}
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      )
    }

    return null
  }

  return (
    <Sidebar className="sticky top-0 z-30 hidden h-screen w-full shrink-0 md:sticky md:block">
      <ScrollArea className="h-full pb-12">
        <SidebarContent>
          {/* Quick Navigation */}
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-medium text-muted-foreground">
              {lang === 'ar' ? 'التنقل السريع' : 'Quick Navigation'}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {sections.map(section => (
                  <SidebarMenuItem key={section.href}>
                    <SidebarMenuButton
                      asChild
                      className={cn(
                        "relative w-full justify-start",
                        isActive(section.href) && "bg-secondary font-medium text-foreground",
                        isRTL && "flex-row-reverse text-right"
                      )}
                    >
                      <Link href={`/${lang}${section.href}`}>
                        {isRTL && <ChevronRight className="ml-auto h-4 w-4 opacity-50" />}
                        <span className={cn("truncate", isRTL && "mr-2")}>{section.name}</span>
                        {!isRTL && isActive(section.href) && <ChevronRight className="ml-auto h-4 w-4 opacity-50" />}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Page Tree */}
          {tree.children?.map(node => renderNode(node))}
        </SidebarContent>
      </ScrollArea>
    </Sidebar>
  )
}