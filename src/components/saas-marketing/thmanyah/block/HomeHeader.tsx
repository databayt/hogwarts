// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Separator } from "@/components/ui/separator"
import { UserButton } from "@/components/auth/user-button"
import { DOCS_LINKS, helpSection } from "@/components/docs/docs-config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { marketingConfig } from "@/components/template/marketing-header/config"
import { LangSwitcher } from "@/components/template/marketing-header/lang-switcher"
import { MainNav } from "@/components/template/marketing-header/main-nav"
import { ModeSwitcher } from "@/components/template/marketing-header/mode-switcher"
import { SearchMenu } from "@/components/template/marketing-header/search-menu"
import { MobileNav } from "@/components/template/mobile-nav"

import { SmartBar } from "./SmartBar"

/**
 * The homepage's header, drawn IN the green hero rather than above it: the
 * same parts as the shared SiteHeader — brand + the four page links, then
 * search, language, theme and sign-in icons — with no white bar cutting the
 * full-screen hero. SmartBar frames it: transparent on the hero, hidden while
 * the reader scrolls down past it, back (solid) the moment they scroll up.
 *
 * It sits OUTSIDE `.thmanyah-shell` — the clone's scoped reset restyles every
 * `button` — inside the same `.marketing-container` the shared layout gives
 * its header, so the links line up with every other page.
 */
export function HomeHeader({
  dictionary,
  locale,
}: {
  dictionary: Dictionary
  locale: "ar" | "en"
}) {
  // MainNav / MobileNav are client components: they get the namespaces they
  // read, not the whole dictionary (same trim as SiteHeader).
  const navDictionary = {
    navigation: dictionary.navigation,
    common: dictionary.common,
  } as Dictionary

  const navItems = marketingConfig.mainNav.map((item) => ({
    href: item.href,
    label:
      (dictionary.navigation?.[
        item.title.toLowerCase() as keyof typeof dictionary.navigation
      ] as string) || item.title,
    disabled: item.disabled,
  }))

  const sections = [
    helpSection(locale),
    {
      title: dictionary.navigation?.documentation || "Documentation",
      items: DOCS_LINKS.map(({ key, href, fallback }) => ({
        title:
          dictionary.docs?.sidebar?.[
            key as keyof typeof dictionary.docs.sidebar
          ] || fallback,
        href,
        disabled: false,
      })),
    },
  ]

  return (
    <SmartBar>
      <header
        data-slot="site-header"
        dir={locale === "ar" ? "rtl" : "ltr"}
        className="marketing-container text-foreground"
      >
        <div className="flex h-14 items-center gap-2 **:data-[slot=separator]:!h-4 md:gap-4">
          <MainNav dictionary={navDictionary} />
          <MobileNav
            items={navItems}
            sections={sections}
            className="flex lg:hidden"
            dictionary={navDictionary}
            locale={locale}
            showMarketingActions
          />
          <nav className="ms-auto flex items-center gap-0.5">
            <SearchMenu />
            <Separator orientation="vertical" className="mx-1" />
            <LangSwitcher />
            <ModeSwitcher />
            <UserButton variant="marketing" />
          </nav>
        </div>
      </header>
    </SmartBar>
  )
}
