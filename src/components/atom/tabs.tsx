"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

export interface TabItem {
  name: string
  href: string
  code?: string
  hidden?: boolean
}

interface TabsNavProps extends React.HTMLAttributes<HTMLDivElement> {
  tabs: TabItem[]
  defaultTab?: TabItem
}

export function TabsNav({ tabs, defaultTab, className, ...props }: TabsNavProps) {
  const pathname = usePathname()

  return (
    <div className="relative">
      <ScrollArea className="max-w-[600px] lg:max-w-none">
        <nav className={cn("flex items-center gap-2 rtl:flex-row-reverse", className)} {...props}>
          {defaultTab && (
            <TabLink
              tab={defaultTab}
              isActive={pathname === defaultTab.href}
            />
          )}
          {tabs.map((tab) => (
            <TabLink
              key={tab.href}
              tab={tab}
              isActive={pathname?.startsWith(tab.href) ?? false}
            />
          ))}
        </nav>
        <ScrollBar orientation="horizontal" className="invisible" />
      </ScrollArea>
    </div>
  )
}

function TabLink({
  tab,
  isActive,
}: {
  tab: TabItem
  isActive: boolean
}) {
  if (tab.hidden) {
    return null
  }

  return (
    <Link
      href={tab.href}
      key={tab.href}
      className="flex h-7 items-center justify-center rounded-full px-4 text-center transition-colors hover:text-primary data-[active=true]:bg-muted data-[active=true]:text-primary"
      data-active={isActive}
    >
      <h6>{tab.name}</h6>
    </Link>
  )
}
