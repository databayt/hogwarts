"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import type { docsSource } from "@/lib/source"
import type { getDictionary } from "@/components/internationalization/dictionaries"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

// Configuration with translation keys and fallback names
const DOCS_LINKS = [
  { key: "introduction", href: "/docs", fallback: "Introduction" },
  { key: "pitch", href: "/docs/pitch", fallback: "Pitch" },
  { key: "mvp", href: "/docs/mvp", fallback: "MVP" },
  { key: "prd", href: "/docs/prd", fallback: "PRD" },
  { key: "getStarted", href: "/docs/get-started", fallback: "Get Started" },
  { key: "architecture", href: "/docs/architecture", fallback: "Architecture" },
  { key: "structure", href: "/docs/structure", fallback: "Structure" },
  { key: "pattern", href: "/docs/pattern", fallback: "Pattern" },
  { key: "stack", href: "/docs/stack", fallback: "Stack" },
  { key: "database", href: "/docs/database", fallback: "Database" },
  { key: "localhost", href: "/docs/localhost", fallback: "Localhost" },
  { key: "contributing", href: "/docs/contributing", fallback: "Contributing" },
  { key: "sharedEconomy", href: "/docs/shared-economy", fallback: "Shared Economy" },
  { key: "competitors", href: "/docs/competitors", fallback: "Competitors" },
  { key: "inspiration", href: "/docs/inspiration", fallback: "Inspiration" },
  { key: "demo", href: "/docs/demo", fallback: "Demo" },
  { key: "listings", href: "/docs/listings", fallback: "Listings" },
] as const

export function DocsSidebar({
  tree,
  dictionary,
  lang,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  tree: typeof docsSource.pageTree
  dictionary?: Awaited<ReturnType<typeof getDictionary>>
  lang?: string
}) {
  const pathname = usePathname()
  const prefix = lang ? `/${lang}` : ""

  return (
    <Sidebar
      className="sticky top-[calc(var(--header-height)+2rem)] z-30 hidden h-[calc(100svh-var(--footer-height)-4rem)] overscroll-none bg-transparent lg:flex"
      collapsible="none"
      {...props}
    >
      <SidebarContent className="no-scrollbar overflow-x-hidden">
        <div className="pb-4 pt-2 ps-0">
          <SidebarGroup className="p-0">
            <SidebarGroupContent>
              <SidebarMenu>
                {DOCS_LINKS.map(({ key, href, fallback }) => {
                  const fullHref = `${prefix}${href}`
                  const isActive = pathname === fullHref || pathname === href
                  const name = dictionary?.docs?.sidebar?.[key as keyof typeof dictionary.docs.sidebar] || fallback

                  return (
                    <SidebarMenuItem key={href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className="relative h-[30px] w-full border border-transparent text-[0.8rem] font-medium p-0"
                      >
                        <Link href={fullHref} className="block w-full">{name}</Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>
      </SidebarContent>
    </Sidebar>
  )
}
