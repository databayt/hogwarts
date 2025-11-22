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
      className="sticky top-[calc(var(--header-height)+2rem)] z-30 hidden h-[calc(100vh-var(--header-height)-4rem)] overflow-y-auto bg-transparent lg:flex"
      collapsible="none"
      {...props}
    >
      <SidebarContent className="overflow-y-auto gap-0">
        <ScrollArea className="h-full w-full">
          <div className="pb-4 pt-2 pl-0">
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
                          className="data-[active=true]:bg-accent data-[active=true]:border-accent relative h-[30px] w-full border border-transparent text-[0.8rem] font-medium p-0"
                        >
                          <Link href={href} className="block w-full">{name}</Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </div>
        </ScrollArea>
      </SidebarContent>
    </Sidebar>
  )
}