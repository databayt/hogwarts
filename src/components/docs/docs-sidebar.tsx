"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import type { docsSource } from "@/lib/source"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import type { getDictionary } from "@/components/internationalization/dictionaries"

import { DOCS_LINKS } from "./docs-config"

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
      <SidebarContent className="overflow-x-hidden overflow-y-auto">
        <div className="pt-2 pb-4 pl-0">
          <SidebarGroup className="p-0">
            <SidebarGroupContent>
              <SidebarMenu>
                {DOCS_LINKS.map(({ key, href, fallback }) => {
                  const fullHref = `${prefix}${href}`
                  const isActive = pathname === fullHref || pathname === href
                  const name =
                    dictionary?.docs?.sidebar?.[
                      key as keyof typeof dictionary.docs.sidebar
                    ] || fallback

                  return (
                    <SidebarMenuItem key={href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className="relative h-[30px] w-full border border-transparent p-0 text-[0.8rem] font-medium"
                      >
                        <Link href={fullHref} className="block w-full">
                          {name}
                        </Link>
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
