"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type { Dictionary } from "@/components/internationalization/dictionaries"
import {
  MobileNav,
  type NavItem,
  type NavSection,
} from "@/components/template/mobile-nav"

interface MarketingMobileNavProps {
  items: NavItem[]
  sections?: NavSection[]
  dictionary?: Dictionary
  locale: string
}

export function MarketingMobileNav({
  items,
  sections,
  dictionary,
  locale,
}: MarketingMobileNavProps) {
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
