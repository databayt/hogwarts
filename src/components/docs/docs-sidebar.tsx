"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import type { source } from "@/lib/source"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const TOP_LEVEL_SECTIONS = [
  { name: "Get Started", href: "/docs" },
  { name: "Architecture", href: "/docs/architecture" },
  { name: "Components", href: "/docs/ui-components" },
  { name: "Database", href: "/docs/database" },
  { name: "Deployment", href: "/docs/deployment" },
  { name: "Changelog", href: "/docs/changelog" },
]

const DOCUMENTATION_PAGES = [
  { name: "Getting Started", href: "/docs/getting-started" },
  { name: "Installation", href: "/docs/installation" },
  { name: "Tech Stack", href: "/docs/tech-stack" },
  { name: "Project Structure", href: "/docs/structure" },
  { name: "Development Workflow", href: "/docs/workflow" },
  { name: "Build System", href: "/docs/build-system" },
  { name: "Testing", href: "/docs/testing" },
  { name: "Authentication", href: "/docs/authentication" },
  { name: "Internationalization", href: "/docs/internationalization" },
  { name: "Multi-Tenancy", href: "/docs/multi-tenancy" },
  { name: "API Design", href: "/docs/api-design" },
  { name: "Typography", href: "/docs/typography" },
  { name: "Icons", href: "/docs/icons" },
  { name: "Environment Variables", href: "/docs/environment" },
  { name: "Contributing", href: "/docs/contributing" },
  { name: "Code of Conduct", href: "/docs/code-of-conduct" },
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
      className="sticky top-[calc(var(--header-height)+1px)] z-30 hidden h-[calc(100svh-var(--footer-height)-4rem)] overscroll-none bg-transparent lg:flex"
      collapsible="none"
      {...props}
    >
      <SidebarContent className="no-scrollbar overflow-x-hidden px-2">
        {/* Top gradient overlay for scroll indication */}
        <div className="from-background via-background/80 to-background/50 sticky -top-1 z-10 h-8 shrink-0 bg-gradient-to-b blur-xs" />

        {/* Sections */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground font-medium">
            Sections
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {TOP_LEVEL_SECTIONS.map(({ name, href }) => {
                const localizedHref = `/${lang}${href}`
                const isActive = href === "/docs"
                  ? pathname === localizedHref
                  : pathname.startsWith(localizedHref)

                return (
                  <SidebarMenuItem key={name}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className="data-[active=true]:bg-accent data-[active=true]:border-accent 3xl:fixed:w-full 3xl:fixed:max-w-48 relative h-[30px] w-fit overflow-visible border border-transparent text-[0.8rem] font-medium after:absolute after:inset-x-0 after:-inset-y-1 after:z-0 after:rounded-md"
                    >
                      <Link href={localizedHref}>
                        <span className="absolute inset-0 flex w-(--sidebar-width) bg-transparent" />
                        {name}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Documentation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground font-medium">
            Documentation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {DOCUMENTATION_PAGES.map(({ name, href }) => {
                const localizedHref = `/${lang}${href}`
                const isActive = pathname === localizedHref

                return (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className="data-[active=true]:bg-accent data-[active=true]:border-accent 3xl:fixed:w-full 3xl:fixed:max-w-48 relative h-[30px] w-fit overflow-visible border border-transparent text-[0.8rem] font-medium after:absolute after:inset-x-0 after:-inset-y-1 after:z-0 after:rounded-md"
                    >
                      <Link href={localizedHref}>
                        <span className="absolute inset-0 flex w-(--sidebar-width) bg-transparent" />
                        {name}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Bottom gradient overlay for scroll indication */}
        <div className="from-background via-background/80 to-background/50 sticky -bottom-1 z-10 h-16 shrink-0 bg-gradient-to-t blur-xs" />
      </SidebarContent>
    </Sidebar>
  )
}