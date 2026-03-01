// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import React from "react"

import { getDisplayText } from "@/lib/content-display"
import { Separator } from "@/components/ui/separator"
import { UserButton } from "@/components/auth/user-button"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { LangSwitcher } from "@/components/template/marketing-header/lang-switcher"
import { ModeSwitcher } from "@/components/template/marketing-header/mode-switcher"

import { marketingConfig } from "./config"
import { MainNav } from "./main-nav"
import { SearchMenu } from "./search-menu"
import { SiteMobileNav } from "./site-mobile-nav"

interface School {
  id: string
  name: string
  domain: string
  logoUrl?: string | null
  address?: string | null
  phoneNumber?: string | null
  email?: string | null
  website?: string | null
  timezone?: string
  preferredLanguage?: string
  planType?: string
  maxStudents?: number
  maxTeachers?: number
  isActive?: boolean
  createdAt?: Date
  updatedAt?: Date
}

interface SiteHeaderProps {
  school: School
  locale: string
}

export default async function SiteHeader({ school, locale }: SiteHeaderProps) {
  const dictionary = await getDictionary(locale as Locale)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nav = (dictionary as any)?.marketing?.site?.nav as
    | Record<string, string>
    | undefined

  // Translate nav items via dictionary
  // Translate school name for the current locale
  const contentLang = (school.preferredLanguage || "ar") as "ar" | "en"
  const displayLang = locale as "ar" | "en"
  const displayName = await getDisplayText(
    school.name,
    contentLang,
    displayLang,
    school.id
  )

  const translatedNav = marketingConfig.mainNav.map((item) => ({
    ...item,
    title: (item.key && nav?.[item.key]) || item.title,
  }))

  const navItems = translatedNav.map((item) => ({
    href: item.href,
    label: item.title,
    disabled: item.disabled,
  }))

  return (
    <header className="bg-background sticky top-0 z-50 w-full">
      <div className="flex h-14 items-center gap-2 **:data-[slot=separator]:!h-4 md:gap-4">
        {/* Desktop: MainNav */}
        <MainNav
          items={translatedNav}
          school={school}
          locale={locale}
          displayName={displayName}
        />
        {/* Mobile: Popover-based menu */}
        <SiteMobileNav
          items={navItems}
          dictionary={dictionary}
          locale={locale}
        />
        <nav className="flex flex-1 items-center justify-end gap-0.5">
          <SearchMenu />
          <Separator orientation="vertical" className="mx-1" />
          <LangSwitcher />
          <ModeSwitcher />
          <Separator orientation="vertical" className="mx-1" />
          <UserButton variant="site" subdomain={school.domain} />
        </nav>
      </div>
    </header>
  )
}
