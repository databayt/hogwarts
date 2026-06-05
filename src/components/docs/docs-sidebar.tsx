"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import Link from "next/link"
import { usePathname } from "next/navigation"

import type { docsSource } from "@/lib/source"
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

type TreeNode = (typeof docsSource.pageTree)["children"][number]
type PageNode = Extract<TreeNode, { type: "page" }>
type Group = { label?: React.ReactNode; items: PageNode[] }

// `meta.json` is a flat ordered list; a "---Label---" entry becomes a fumadocs
// `separator` node. Split the flat tree into labeled sections — the leading run
// before the first separator stays unlabeled — mirroring ui.shadcn.com/docs'
// grouped sidebar. (Main rendered one flat list and dropped the separators.)
function groupBySeparator(children: readonly TreeNode[]): Group[] {
  const groups: Group[] = [{ items: [] }]
  for (const node of children) {
    if (node.type === "separator") {
      groups.push({ label: node.name, items: [] })
    } else if (node.type === "page") {
      groups[groups.length - 1].items.push(node)
    }
  }
  return groups.filter((g) => g.items.length > 0)
}

export function DocsSidebar({
  tree,
  lang,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  tree: typeof docsSource.pageTree
  lang?: string
}) {
  const pathname = usePathname()
  const prefix = lang ? `/${lang}` : ""
  const groups = groupBySeparator(tree.children)

  return (
    <Sidebar
      className="sticky top-[calc(var(--header-height)+2rem)] z-30 hidden h-[calc(100svh-var(--footer-height)-4rem)] overscroll-none bg-transparent lg:flex"
      collapsible="none"
      {...props}
    >
      <SidebarContent className="overflow-x-hidden overflow-y-auto">
        <div className="ps-0 pt-2 pb-4">
          {groups.map((group, i) => (
            <SidebarGroup key={i} className="p-0">
              {group.label ? (
                <SidebarGroupLabel className="text-muted-foreground font-medium">
                  {group.label}
                </SidebarGroupLabel>
              ) : null}
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((node) => {
                    const fullHref = `${prefix}${node.url}`
                    const isActive =
                      pathname === fullHref || pathname === node.url
                    return (
                      <SidebarMenuItem key={node.url}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          className="data-[active=true]:border-accent data-[active=true]:bg-accent relative h-[30px] border border-transparent text-[0.8rem] font-medium"
                        >
                          <Link href={fullHref}>{node.name}</Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </div>
      </SidebarContent>
    </Sidebar>
  )
}
