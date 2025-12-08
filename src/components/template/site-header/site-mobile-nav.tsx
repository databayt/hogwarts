"use client"

import { MobileNav, type NavItem } from "@/components/template/mobile-nav"
import type { Dictionary } from "@/components/internationalization/dictionaries"

interface SiteMobileNavProps {
  items: NavItem[]
  dictionary?: Dictionary
  locale: string
}

export function SiteMobileNav({ items, dictionary, locale }: SiteMobileNavProps) {
  return (
    <MobileNav
      items={items}
      className="flex lg:hidden"
      dictionary={dictionary}
      locale={locale}
    />
  )
}
