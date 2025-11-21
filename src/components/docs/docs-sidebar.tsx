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
  { name: "Installation", href: "/docs/installation" },
  { name: "Architecture", href: "/docs/architecture" },
  { name: "Pattern", href: "/docs/pattern" },
  { name: "Stack", href: "/docs/stack" },
  { name: "Structure", href: "/docs/structure" },
  { name: "Roadmap", href: "/docs/roadmap" },
  { name: "Changelog", href: "/docs/changelog" },
  { name: "Issues", href: "/docs/issues" },
  { name: "Claude Code", href: "/docs/claude-code" },
  { name: "Vibe Coding", href: "/docs/vibe-coding" },
  { name: "Authentication", href: "/docs/authentication" },
  { name: "Internationalization", href: "/docs/internationalization" },
  { name: "Domain", href: "/docs/domain" },
  { name: "Table", href: "/docs/table" },
  { name: "Onboarding", href: "/docs/onboarding" },
  { name: "ESLint", href: "/docs/eslint" },
  { name: "Prettier", href: "/docs/prettier" },
  { name: "Community", href: "/docs/community" },
  { name: "Code of Conduct", href: "/docs/code-of-conduct" },
]

export function DocsSidebar({
  tree,
  ...props
}: React.ComponentProps<typeof Sidebar> & { tree: typeof source.pageTree }) {
  const pathname = usePathname()

  return (
    <Sidebar
      className="sticky top-[calc(var(--header-height)+1px)] z-30 hidden h-[calc(100svh-var(--footer-height)-4rem)] overscroll-none bg-transparent lg:flex"
      collapsible="none"
      {...props}
    >
      <SidebarContent className="flex flex-col overflow-hidden">
        <div className="from-background via-background/80 to-background/50 sticky top-0 z-10 h-8 shrink-0 bg-gradient-to-b blur-xs" />
        <ScrollArea className="flex-1">
          <SidebarGroup className="p-0">
            <SidebarGroupContent>
              <SidebarMenu>
                {DOCS_LINKS.map(({ name, href }) => {
                  const isActive = pathname === href

                  return (
                    <SidebarMenuItem key={href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className="data-[active=true]:bg-accent data-[active=true]:border-accent relative h-[30px] w-full border border-transparent text-[0.8rem] font-medium px-2"
                      >
                        <Link href={href}>{name}</Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </ScrollArea>
        <div className="from-background via-background/80 to-background/50 sticky bottom-0 z-10 h-16 shrink-0 bg-gradient-to-t blur-xs" />
      </SidebarContent>
    </Sidebar>
  )
}