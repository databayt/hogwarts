import * as React from "react"
import Link from "next/link"

import { cn } from "@/lib/utils"

import { siteConfig } from "./config"
import { Icons } from "./icons"
import { MainNavItem } from "./types"
import { useLockBody } from "./use-lock-body"

interface MobileNavProps {
  items: MainNavItem[]
  children?: React.ReactNode
}

export function MobileNav({ items, children }: MobileNavProps) {
  useLockBody()

  return (
    <div
      className={cn(
        "animate-in slide-in-from-bottom-80 fixed inset-0 top-16 z-50 grid h-[calc(100vh-4rem)] grid-flow-row auto-rows-max overflow-auto p-6 pb-32 shadow-md md:hidden"
      )}
    >
      <div className="bg-popover text-popover-foreground relative z-20 grid gap-6 rounded-md p-4 shadow-md">
        <Link href="/" className="flex items-center space-x-2">
          <Icons.logo />
          <span>{siteConfig.name}</span>
        </Link>
        <nav className="muted grid grid-flow-row auto-rows-max">
          {items.map((item, index) => (
            <Link
              key={index}
              href={item.disabled ? "#" : item.href}
              className={cn(
                "muted flex w-full items-center rounded-md p-2 hover:underline",
                item.disabled && "cursor-not-allowed opacity-60"
              )}
            >
              {item.title}
            </Link>
          ))}
        </nav>
        {children}
      </div>
    </div>
  )
}
