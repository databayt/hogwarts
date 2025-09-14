import * as React from "react"
import Link from "next/link"

import { MainNavItem } from "./type"
import { siteConfig } from "./constant"
import { cn } from "@/lib/utils"
import { useLockBody } from "./use-lock-body"
import { Icons } from "./icons"
import type { Dictionary } from '@/components/internationalization/dictionaries'

interface MobileNavProps {
  items: MainNavItem[]
  children?: React.ReactNode
  dictionary?: Dictionary
}

export function MobileNav({ items, children, dictionary }: MobileNavProps) {
  useLockBody()

  return (
    <div
      className={cn(
        "fixed inset-0 top-16 z-50 grid h-[calc(100vh-4rem)] grid-flow-row auto-rows-max overflow-auto p-6 pb-32 shadow-md animate-in slide-in-from-bottom-80 md:hidden"
      )}
    >
      <div className="relative z-20 grid gap-6 rounded-md bg-popover p-4 text-popover-foreground shadow-md">
        <Link href="/" className="flex items-center space-x-2">
          <Icons.logo />
          <span>{dictionary?.navigation?.brandName || siteConfig.name}</span>
        </Link>
        <nav className="grid grid-flow-row auto-rows-max muted">
          {items.map((item, index) => (
            <Link
              key={index}
              href={item.disabled ? "#" : item.href}
              className={cn(
                "flex w-full items-center rounded-md p-2 muted hover:underline",
                item.disabled && "cursor-not-allowed opacity-60"
              )}
            >
              {dictionary?.navigation?.[item.title.toLowerCase() as keyof typeof dictionary.navigation] || item.title}
            </Link>
          ))}
        </nav>
        {children}
      </div>
    </div>
  )
}