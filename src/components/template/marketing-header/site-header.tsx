// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { UserButton } from "@/components/auth/user-button"
import { DOCS_LINKS, helpSection } from "@/components/docs/docs-config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { MobileNav } from "@/components/template/mobile-nav"

import { marketingConfig } from "./config"
import { LangSwitcher } from "./lang-switcher"
import { MainNav } from "./main-nav"
import { ModeSwitcher } from "./mode-switcher"
import { SearchMenu } from "./search-menu"

interface SiteHeaderProps {
  dictionary?: Dictionary
  locale?: string
}

export function SiteHeader({ dictionary, locale = "en" }: SiteHeaderProps) {
  const isRTL = locale === "ar"
  const startHref = `/${locale}/onboarding`
  const startFree =
    dictionary?.navigation?.startFree || (isRTL ? "ابدأ مجانًا" : "Start free")
  const startFreeMonth =
    dictionary?.navigation?.startFreeMonth ||
    (isRTL ? "ابدأ شهرك المجاني" : "Start your free month")

  // Transform nav items for MobileNav
  const navItems = marketingConfig.mainNav.map((item) => ({
    href: item.href,
    label:
      (dictionary?.navigation?.[
        item.title.toLowerCase() as keyof typeof dictionary.navigation
      ] as string) || item.title,
    disabled: item.disabled,
  }))

  // Contextual sections for docs - uses same DOCS_LINKS as desktop sidebar
  const sections = [
    helpSection(locale),
    {
      title: dictionary?.navigation?.documentation || "Documentation",
      items: DOCS_LINKS.map(({ key, href, fallback }) => ({
        title:
          dictionary?.docs?.sidebar?.[
            key as keyof typeof dictionary.docs.sidebar
          ] || fallback,
        href,
        disabled: false,
      })),
    },
  ]

  // MainNav and MobileNav are client components: a prop is serialized into
  // the page, so they get the namespaces they read, not the whole dictionary.
  const navDictionary = dictionary
    ? ({
        navigation: dictionary.navigation,
        common: dictionary.common,
      } as Dictionary)
    : undefined

  return (
    <header
      data-slot="site-header"
      className="bleed-bg bg-background sticky top-0 z-50 w-full"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="flex h-14 items-center gap-2 **:data-[slot=separator]:!h-4 md:gap-4">
        {/* Left: Nav items */}
        <MainNav dictionary={navDictionary} />
        {/* Mobile: Popover-based menu */}
        <MobileNav
          items={navItems}
          sections={sections}
          className="flex lg:hidden"
          dictionary={navDictionary}
          locale={locale}
          showMarketingActions
        />
        {/* The one action every marketing page asks for. On a phone it sits
            in the bar itself, not inside the menu, so it is never a tap away. */}
        <Link
          href={startHref}
          className={cn(
            buttonVariants({ size: "sm" }),
            "ms-auto h-8 rounded-full px-3.5 lg:hidden"
          )}
        >
          {startFree}
        </Link>
        {/* Right: Actions - all hidden on mobile, shown in menu */}
        <nav className="hidden flex-1 items-center justify-end gap-0.5 lg:flex">
          <SearchMenu />
          <Separator orientation="vertical" className="mx-1" />
          <LangSwitcher />
          <ModeSwitcher />
          <UserButton variant="marketing" />
          <Link
            href={startHref}
            className={cn(
              buttonVariants({ size: "sm" }),
              "ms-2 h-8 rounded-full px-4"
            )}
          >
            {startFreeMonth}
          </Link>
        </nav>
      </div>
    </header>
  )
}
