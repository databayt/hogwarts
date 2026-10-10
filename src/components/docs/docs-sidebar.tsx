"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown } from "lucide-react"

import type { docsSource } from "@/lib/source"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
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
type FolderNode = Extract<TreeNode, { type: "folder" }>
type Item = { url: string; name: React.ReactNode }
type Group = { id: string; label?: React.ReactNode; items: Item[] }

export type DocsRole = "admin" | "teacher" | "parent"
/** Page url → the audiences it serves (from the guide's `roles` frontmatter). */
export type DocsRoleMap = Record<string, DocsRole[]>

const ROLES: DocsRole[] = ["admin", "teacher", "parent"]
const ROLE_LABELS: Record<DocsRole, { en: string; ar: string }> = {
  admin: { en: "Admins", ar: "الإدارة" },
  teacher: { en: "Teachers", ar: "المعلمون" },
  parent: { en: "Parents & students", ar: "أولياء الأمور والطلاب" },
}
const STORAGE_KEY = "docs-sidebar-open"

const toItem = (node: PageNode): Item => ({ url: node.url, name: node.name })

/** Every page under a folder (its index first), nesting flattened. */
function flatten(folder: FolderNode): PageNode[] {
  const pages: PageNode[] = folder.index ? [folder.index] : []
  for (const child of folder.children) {
    if (child.type === "page") pages.push(child)
    else if (child.type === "folder") pages.push(...flatten(child))
  }
  return pages
}

/**
 * `meta.json` is a flat ordered list; a "---Label---" entry becomes a separator
 * and so a labeled group. The help-center folder is different: its guides are
 * split into one group per audience by their `roles`, so a guide for everyone
 * (login, language, mobile) shows under each role. Guides without roles (the
 * help center itself, the FAQ) join the leading, unlabeled group.
 */
function buildGroups(
  children: readonly TreeNode[],
  roleMap: DocsRoleMap,
  lang: "ar" | "en"
): Group[] {
  const groups: Group[] = [{ id: "start", items: [] }]
  for (const node of children) {
    if (node.type === "separator") {
      groups.push({ id: `s:${node.name}`, label: node.name, items: [] })
    } else if (node.type === "page") {
      groups[groups.length - 1].items.push(toItem(node))
    } else if (node.type === "folder") {
      const pages = flatten(node)
      const isHelp = pages.some((p) => roleMap[p.url])
      if (!isHelp) {
        groups[groups.length - 1].items.push(...pages.map(toItem))
        continue
      }
      groups[0].items.push(...pages.filter((p) => !roleMap[p.url]).map(toItem))
      for (const role of ROLES) {
        groups.push({
          id: `r:${role}`,
          label: ROLE_LABELS[role][lang],
          items: pages
            .filter((p) => roleMap[p.url]?.includes(role))
            .map(toItem),
        })
      }
      // Pages after the help folder (before the next separator) stay apart
      // from the last role group.
      groups.push({ id: `after:${node.$id ?? "help"}`, items: [] })
    }
  }
  return groups.filter((g) => g.items.length > 0)
}

/** Remembered open/closed choices; unreadable storage just means defaults. */
function readStored(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}")
  } catch {
    return {}
  }
}

export function DocsSidebar({
  tree,
  roleMap = {},
  lang,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  tree: typeof docsSource.pageTree
  roleMap?: DocsRoleMap
  lang?: string
}) {
  const pathname = usePathname()
  const prefix = lang ? `/${lang}` : ""
  const groups = React.useMemo(
    () => buildGroups(tree.children, roleMap, lang === "ar" ? "ar" : "en"),
    [tree, roleMap, lang]
  )

  const isActive = (url: string) =>
    pathname === `${prefix}${url}` || pathname === url
  // On the docs home and the help center, open the admins' guides — the
  // people setting a school up — so the first visit isn't a wall of headers.
  const atHome = ["/docs", "/docs/support"].some(isActive)
  const defaultOpen = (g: Group) =>
    g.items.some((i) => isActive(i.url)) || (atHome && g.id === "r:admin")

  const [stored, setStored] = React.useState<Record<string, boolean>>({})
  const setOpen = React.useCallback((id: string, open: boolean) => {
    setStored((prev) => {
      const next = { ...prev, [id]: open }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {}
      return next
    })
  }, [])
  // Landing on a page reopens its group, even one the visitor had closed.
  const activeId = groups.find((g) => g.items.some((i) => isActive(i.url)))?.id
  React.useEffect(() => {
    setStored((prev) => {
      const base = Object.keys(prev).length ? prev : readStored()
      return activeId && base[activeId] === false
        ? { ...base, [activeId]: true }
        : base
    })
  }, [activeId])

  const menu = (items: Item[]) => (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.url}>
          <SidebarMenuButton
            asChild
            isActive={isActive(item.url)}
            className="data-[active=true]:border-accent data-[active=true]:bg-accent relative h-[30px] border border-transparent text-[0.8rem] font-medium"
          >
            <Link href={`${prefix}${item.url}`}>{item.name}</Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )

  return (
    <Sidebar
      className="sticky top-[calc(var(--header-height)+2rem)] z-30 hidden h-[calc(100svh-var(--footer-height)-4rem)] overscroll-none bg-transparent lg:flex"
      collapsible="none"
      {...props}
    >
      <SidebarContent className="overflow-x-hidden overflow-y-auto">
        <div className="ps-0 pt-2 pb-4">
          {groups.map((group) =>
            group.label ? (
              <Collapsible
                key={group.id}
                // The visitor's last choice wins over the default.
                open={stored[group.id] ?? defaultOpen(group)}
                onOpenChange={(open) => setOpen(group.id, open)}
                className="group/collapsible"
              >
                <SidebarGroup className="p-0">
                  <SidebarGroupLabel
                    asChild
                    className="text-muted-foreground hover:text-foreground font-medium"
                  >
                    <CollapsibleTrigger className="w-full justify-between">
                      {group.label}
                      <ChevronDown className="transition-transform group-data-[state=open]/collapsible:rotate-180" />
                    </CollapsibleTrigger>
                  </SidebarGroupLabel>
                  <CollapsibleContent>
                    <SidebarGroupContent>
                      {menu(group.items)}
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </SidebarGroup>
              </Collapsible>
            ) : (
              <SidebarGroup key={group.id} className="p-0">
                <SidebarGroupContent>{menu(group.items)}</SidebarGroupContent>
              </SidebarGroup>
            )
          )}
        </div>
      </SidebarContent>
    </Sidebar>
  )
}
