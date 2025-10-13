"use client"

import * as React from "react"
import Link from "next/link"
import { useSelectedLayoutSegment } from "next/navigation"
import { MainNavItem } from "./types"
import { siteConfig } from "./config"
import { cn } from "@/lib/utils"
import { Icons } from "./icons"
import { MobileNav } from "./mobile-nav"
import Image from "next/image"
import type { Dictionary } from '@/components/internationalization/dictionaries'

interface MainNavProps {
  items?: MainNavItem[]
  children?: React.ReactNode
  dictionary?: Dictionary
}

export function MainNav({ items, children, dictionary }: MainNavProps) {
  const segment = useSelectedLayoutSegment()
  const [showMobileMenu, setShowMobileMenu] = React.useState<boolean>(false)

  return (
    <div className="flex gap-6 md:gap-10">
      <Link href="/" className="hidden items-center gap-2 md:flex font-bold text-foreground opacity-100 hover:opacity-100">
        <Image src="/logo.png" alt="Hogwarts Logo" width={20} height={20} className="dark:invert" />
        <span className="hidden sm:inline-block">
          {dictionary?.navigation?.brandName || siteConfig.name}
        </span>
      </Link>
      {items?.length ? (
        <nav className="hidden gap-6 md:flex">
          {items?.map((item, index) => (
            <Link
              key={index}
              href={item.disabled ? "#" : item.href}
              className={cn(
                "flex items-center transition-colors hover:text-foreground/80",
                item.href.startsWith(`/${segment}`)
                  ? "text-foreground"
                  : "text-foreground/60",
                item.disabled && "cursor-not-allowed opacity-80"
              )}
            >
              {dictionary?.navigation?.[item.title.toLowerCase() as keyof typeof dictionary.navigation] || item.title}
            </Link>
          ))}
        </nav>
      ) : null}
      <button
        className="flex items-center space-x-2 md:hidden"
        onClick={() => setShowMobileMenu(!showMobileMenu)}
      >
        {showMobileMenu ? <Icons.close /> : <Icons.logo />}
        <span>{dictionary?.navigation?.menu || 'Menu'}</span>
      </button>
      {showMobileMenu && items && (
        <MobileNav items={items} dictionary={dictionary}>{children}</MobileNav>
      )}
    </div>
  )
}