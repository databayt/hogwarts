// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { docsArabicSource, docsSource } from "@/lib/source"
import { SidebarProvider } from "@/components/ui/sidebar"
import { DocsSidebar, type DocsRoleMap } from "@/components/docs/docs-sidebar"

interface DocsLayoutProps {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}

export default async function DocsLayout({
  children,
  params,
}: DocsLayoutProps) {
  const { lang } = await params
  const source = lang === "ar" ? docsArabicSource : docsSource
  // Help guides list their audiences in frontmatter; the sidebar groups by them.
  const roleMap: DocsRoleMap = Object.fromEntries(
    source
      .getPages()
      .filter((page) => page.data.roles?.length)
      .map((page) => [page.url, page.data.roles!])
  )

  return (
    <div className="container-wrapper flex flex-1 flex-col">
      <SidebarProvider className="3xl:fixed:container 3xl:fixed:px-3 px-responsive min-h-min flex-1 items-start [--sidebar-width:220px] [--top-spacing:0] lg:grid lg:grid-cols-[var(--sidebar-width)_minmax(0,1fr)] lg:px-0 lg:[--sidebar-width:calc(var(--spacing)*72)] lg:[--top-spacing:calc(var(--spacing)*4)]">
        <DocsSidebar tree={source.pageTree} roleMap={roleMap} lang={lang} />
        <div className="h-full w-full">{children}</div>
      </SidebarProvider>
    </div>
  )
}
