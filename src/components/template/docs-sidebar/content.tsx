"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { docsConfig } from "@/components/template/docs-sidebar/config"
import { cn } from "@/lib/utils"
import type { SidebarNavItem } from "@/components/template/docs-sidebar/config"

interface NavItemProps {
  item: SidebarNavItem
  pathname: string
  level?: number
  onLinkClick: () => void
}

// Recursive component for rendering nested navigation items
function NavItem({ item, pathname, level = 0, onLinkClick }: NavItemProps) {
  const [isOpen, setIsOpen] = React.useState(() => {
    // Auto-expand if current path is within this section
    if (item.href === pathname) return true
    if (item.items && item.items.length > 0) {
      return item.items.some((child) =>
        child.href === pathname ||
        (child.items && child.items.some((grandchild) =>
          grandchild.href === pathname ||
          (grandchild.items && grandchild.items.some((greatGrandchild) =>
            greatGrandchild.href === pathname
          ))
        ))
      )
    }
    return false
  })

  const hasChildren = item.items && item.items.length > 0
  const isActive = item.href === pathname

  // Handle toggle for items with children
  const handleToggle = (e: React.MouseEvent) => {
    if (hasChildren && !item.href) {
      e.preventDefault()
      setIsOpen(!isOpen)
    }
  }

  // For top-level items
  if (level === 0) {
    return (
      <SidebarMenuItem>
        {hasChildren && !item.href ? (
          // Collapsible section without href
          <button
            onClick={handleToggle}
            className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm font-medium transition-colors hover:bg-muted/50 focus-visible:outline-none"
          >
            <span className="flex items-center gap-2">
              {item.title}
              {item.badge && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {item.badge}
                </Badge>
              )}
            </span>
            {isOpen ? (
              <ChevronDown className="h-4 w-4 opacity-50" />
            ) : (
              <ChevronRight className="h-4 w-4 opacity-50" />
            )}
          </button>
        ) : item.href ? (
          // Link item
          <SidebarMenuButton
            asChild
            isActive={isActive}
            onClick={item.external ? undefined : onLinkClick}
          >
            <Link
              href={item.href}
              target={item.external ? "_blank" : undefined}
              rel={item.external ? "noopener noreferrer" : undefined}
              className="flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                {item.title}
                {item.badge && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                    {item.badge}
                  </Badge>
                )}
              </span>
              <span className="flex items-center gap-1">
                {item.external && <ExternalLink className="h-3 w-3 opacity-50" />}
                {hasChildren && (
                  isOpen ? (
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  ) : (
                    <ChevronRight className="h-4 w-4 opacity-50" />
                  )
                )}
              </span>
            </Link>
          </SidebarMenuButton>
        ) : null}

        {/* Render children */}
        {hasChildren && isOpen && (
          <SidebarMenuSub>
            {item.items!.map((child) => (
              <NavSubItem
                key={child.href || child.title}
                item={child}
                pathname={pathname}
                level={level + 1}
                onLinkClick={onLinkClick}
              />
            ))}
          </SidebarMenuSub>
        )}
      </SidebarMenuItem>
    )
  }

  // For nested items (shouldn't reach here with current structure)
  return null
}

// Component for sub-navigation items
function NavSubItem({ item, pathname, level = 0, onLinkClick }: NavItemProps) {
  const [isOpen, setIsOpen] = React.useState(() => {
    // Auto-expand if current path is within this section
    if (item.href === pathname) return true
    if (item.items && item.items.length > 0) {
      return item.items.some((child) =>
        child.href === pathname ||
        (child.items && child.items.some((grandchild) =>
          grandchild.href === pathname
        ))
      )
    }
    return false
  })

  const hasChildren = item.items && item.items.length > 0
  const isActive = item.href === pathname

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsOpen(!isOpen)
  }

  return (
    <SidebarMenuSubItem>
      {hasChildren && !item.href ? (
        // Collapsible sub-section without href
        <div>
          <button
            onClick={handleToggle}
            className={cn(
              "flex w-full items-center justify-between rounded-md px-2 py-1 text-sm transition-colors hover:bg-muted/50",
              level > 1 && "pl-4",
              level > 2 && "pl-6"
            )}
          >
            <span className="flex items-center gap-2">
              <span className={cn("font-medium", level > 1 && "font-normal")}>
                {item.title}
              </span>
              {item.badge && (
                <Badge variant="outline" className="h-4 px-1 text-xs">
                  {item.badge}
                </Badge>
              )}
            </span>
            {isOpen ? (
              <ChevronDown className="h-3 w-3 opacity-50" />
            ) : (
              <ChevronRight className="h-3 w-3 opacity-50" />
            )}
          </button>
          {isOpen && (
            <div className={cn("mt-1", level > 0 && "ml-3")}>
              {item.items!.map((child) => (
                <NavSubItem
                  key={child.href || child.title}
                  item={child}
                  pathname={pathname}
                  level={level + 1}
                  onLinkClick={onLinkClick}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        // Link sub-item
        <SidebarMenuSubButton
          asChild
          isActive={isActive}
          onClick={item.external ? undefined : onLinkClick}
          className={cn(
            level > 1 && "pl-6",
            level > 2 && "pl-8"
          )}
        >
          <Link
            href={item.href || "#"}
            target={item.external ? "_blank" : undefined}
            rel={item.external ? "noopener noreferrer" : undefined}
            className="flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
              {item.title}
              {item.badge && (
                <Badge variant="outline" className="ml-1 h-4 px-1 text-xs">
                  {item.badge}
                </Badge>
              )}
            </span>
            {item.external && <ExternalLink className="h-3 w-3 opacity-50" />}
          </Link>
        </SidebarMenuSubButton>
      )}

      {/* Render nested children inline if open */}
      {hasChildren && isOpen && item.href && (
        <div className={cn("mt-1", level > 0 && "ml-3")}>
          {item.items!.map((child) => (
            <NavSubItem
              key={child.href || child.title}
              item={child}
              pathname={pathname}
              level={level + 1}
              onLinkClick={onLinkClick}
            />
          ))}
        </div>
      )}
    </SidebarMenuSubItem>
  )
}

export function DocsSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { setOpenMobile } = useSidebar()

  const handleLinkClick = React.useCallback(() => {
    setOpenMobile(false)
  }, [setOpenMobile])

  return (
    <Sidebar
      {...props}
      className="w-64"
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/docs" className="flex items-center" onClick={handleLinkClick}>
                <div className="flex flex-col leading-none">
                  <span className="font-medium text-foreground">📖 Documentation</span>
                  <span className="text-xs text-muted-foreground mt-1">Comprehensive Guide</span>
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
              {docsConfig.sidebarNav.map((section) => (
                <NavItem
                  key={section.title}
                  item={section}
                  pathname={pathname}
                  onLinkClick={handleLinkClick}
                />
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </ScrollArea>
      </SidebarContent>
    </Sidebar>
  )
}