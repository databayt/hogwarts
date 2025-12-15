"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { useSelectedLayoutSegment } from "next/navigation"

import { cn } from "@/lib/utils"

import { siteConfig } from "./config"
import { Icons } from "./icons"
import { MobileNav } from "./mobile-nav"
import { MainNavItem } from "./types"

interface MainNavProps {
  items?: MainNavItem[]
  children?: React.ReactNode
}

export function MainNav({ items, children }: MainNavProps) {
  const segment = useSelectedLayoutSegment()
  const [showMobileMenu, setShowMobileMenu] = React.useState<boolean>(false)

  return (
    <div className="flex gap-6 md:gap-10">
      <Link href="/" className="hidden items-center gap-2 md:flex">
        <Image
          src="/logo.png"
          alt="Hogwarts Logo"
          width={20}
          height={20}
          className="dark:invert"
        />
        <span className="hidden sm:inline-block">{siteConfig.name}</span>
      </Link>
      {items?.length ? (
        <nav className="hidden gap-6 md:flex">
          {items?.map((item, index) => (
            <Link
              key={index}
              href={item.disabled ? "#" : item.href}
              className={cn(
                "hover:text-foreground/80 flex items-center transition-colors",
                item.href.startsWith(`/${segment}`)
                  ? "text-foreground"
                  : "text-foreground/60",
                item.disabled && "cursor-not-allowed opacity-80"
              )}
            >
              {item.title}
            </Link>
          ))}
        </nav>
      ) : null}
      <button
        className="flex items-center space-x-2 md:hidden"
        onClick={() => setShowMobileMenu(!showMobileMenu)}
      >
        {showMobileMenu ? <Icons.close /> : <Icons.logo />}
        <span>Menu</span>
      </button>
      {showMobileMenu && items && (
        <MobileNav items={items}>{children}</MobileNav>
      )}
    </div>
  )
}
