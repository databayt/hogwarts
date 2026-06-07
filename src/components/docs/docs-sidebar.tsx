"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import * as React from "react"
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

interface NavGroup {
  label: React.ReactNode | null
  pages: PageNode[]
}

// Walk the flat fumadocs page tree and split it into sections. A `---Label---`
// entry in `meta.json` becomes a `separator` node (no url, no children); it
// opens a new labeled group. Pages before the first separator land in an
// unlabeled leading group, mirroring shadcn's grouped docs sidebar.
function groupBySeparator(children: TreeNode[]): NavGroup[] {
  const groups: NavGroup[] = []
  let current: NavGroup = { label: null, pages: [] }

  for (const node of children) {
    if (node.type === "separator") {
      if (current.pages.length > 0) groups.push(current)
      current = { label: node.name ?? null, pages: [] }
    } else if (node.type === "page") {
      current.pages.push(node)
    }
  }
  if (current.pages.length > 0) groups.push(current)

  return groups
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
  const groups = React.useMemo(
    () => groupBySeparator(tree.children as TreeNode[]),
    [tree.children]
  )

  return (
    <Sidebar
      className="sticky top-[calc(var(--header-height)+2rem)] z-30 hidden h-[calc(100svh-var(--footer-height)-4rem)] overscroll-none bg-transparent lg:flex"
      collapsible="none"
      {...props}
    >
      <SidebarContent className="no-scrollbar overflow-x-hidden overflow-y-auto">
        {groups.map((group, groupIndex) => (
          <SidebarGroup
            key={(group.label as string) ?? `group-${groupIndex}`}
            className={groupIndex === 0 ? "px-0 pt-2" : "px-0"}
          >
            {group.label ? (
              <SidebarGroupLabel className="text-muted-foreground font-medium">
                {group.label}
              </SidebarGroupLabel>
            ) : null}
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {group.pages.map((node) => {
                  const fullHref = `${prefix}${node.url}`
                  const isActive =
                    pathname === fullHref || pathname === node.url
                  return (
                    <SidebarMenuItem key={node.url}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className="data-[active=true]:border-accent data-[active=true]:bg-accent relative h-[30px] w-fit overflow-visible border border-transparent text-[0.8rem] font-medium after:absolute after:inset-x-0 after:-inset-y-1 after:z-0 after:rounded-md"
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
      </SidebarContent>
    </Sidebar>
  )
}
