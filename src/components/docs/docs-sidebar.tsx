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

// Flat list of links without sections - exactly like codebase-underway docs sidebar
const DOCS_LINKS = [
  { name: "Introduction", href: "/docs" },
  { name: "Getting Started", href: "/docs/getting-started" },
  { name: "Installation", href: "/docs/installation" },
  { name: "Architecture", href: "/docs/architecture" },
  { name: "Tech Stack", href: "/docs/tech-stack" },
  { name: "Project Structure", href: "/docs/structure" },
  { name: "Development Workflow", href: "/docs/workflow" },
  { name: "Build System", href: "/docs/build-system" },
  { name: "Testing", href: "/docs/testing" },
  { name: "Authentication", href: "/docs/authentication" },
  { name: "Internationalization", href: "/docs/internationalization" },
  { name: "Multi-Tenancy", href: "/docs/multi-tenancy" },
  { name: "Database", href: "/docs/database" },
  { name: "API Design", href: "/docs/api-design" },
  { name: "UI Components", href: "/docs/ui-components" },
  { name: "Typography", href: "/docs/typography" },
  { name: "Icons", href: "/docs/icons" },
  { name: "Deployment", href: "/docs/deployment" },
  { name: "Environment Variables", href: "/docs/environment" },
  { name: "Contributing", href: "/docs/contributing" },
  { name: "Code of Conduct", href: "/docs/code-of-conduct" },
  { name: "Changelog", href: "/docs/changelog" },
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
                  {DOCS_LINKS.map(({ name, href }) => {
                    const localizedHref = `/${lang}${href}`
                    const isActive = pathname === localizedHref

                    return (
                      <SidebarMenuItem key={href}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          className="data-[active=true]:bg-accent data-[active=true]:border-accent relative h-[30px] w-full border border-transparent text-[0.8rem] font-medium p-0"
                        >
                          <Link href={localizedHref} className="block w-full">{name}</Link>
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