"use client"

import { MobileNav, type NavItem, type NavSection } from "@/components/template/mobile-nav"
import type { Dictionary } from "@/components/internationalization/dictionaries"

interface MarketingMobileNavProps {
  items: NavItem[]
  sections?: NavSection[]
  dictionary?: Dictionary
  locale: string
}

export function MarketingMobileNav({ items, sections, dictionary, locale }: MarketingMobileNavProps) {
  return (
    <MobileNav
      items={items}
      sections={sections}
      className="flex lg:hidden"
      dictionary={dictionary}
      locale={locale}
    />
  )
}
