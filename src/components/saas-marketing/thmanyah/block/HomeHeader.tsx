// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Separator } from "@/components/ui/separator"
import { UserButton } from "@/components/auth/user-button"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { LangSwitcher } from "@/components/template/marketing-header/lang-switcher"
import { ModeSwitcher } from "@/components/template/marketing-header/mode-switcher"
import { SearchMenu } from "@/components/template/marketing-header/search-menu"

import { SmartBar } from "./SmartBar"

/**
 * The homepage's header, drawn IN the green hero rather than above it. At rest
 * it is a lone hamburger; the hamburger unfolds the bar in place — Home and
 * the four page links, then the search, language, theme and sign-in icons the
 * shared SiteHeader carries. No logo or site name: on the homepage the hero's
 * own title is the brand, and "Home" is the way back from anywhere in the bar.
 * SmartBar owns the toggle and the scroll behaviour (transparent on the hero,
 * hidden while scrolling down past it, back solid on the first scroll up).
 *
 * It sits OUTSIDE `.thmanyah-shell` — the clone's scoped reset restyles every
 * `button` — on the hero's own gutters (20/40/60/80px, content capped at
 * 1320px), so the hamburger sits on the same edge as the headline.
 */
export function HomeHeader({
  dictionary,
  locale,
  variant = "hero",
}: {
  dictionary: Dictionary
  locale: "ar" | "en"
  /** "hero" on the homepage; "page" (solid, starts open) everywhere else. */
  variant?: "hero" | "page"
}) {
  const nav = dictionary.navigation
  const ar = locale === "ar"
  const links = [
    // On the homepage, Home closes the contact panel back to the hero
    // (HeroBlock listens); elsewhere it navigates home.
    {
      label: ar ? "الرئيسية" : "Home",
      href: `/${locale}`,
      event: "balqalam:home",
    },
    { label: nav?.features || "Features", href: `/${locale}/features` },
    { label: nav?.community || "Community", href: `/${locale}/community` },
    { label: nav?.pricing || "Pricing", href: `/${locale}/pricing` },
    // On the homepage this swaps the hero for its contact panel in place
    // (HeroBlock listens for the event); elsewhere it opens /{lang}#contact.
    {
      label: ar ? "تواصل معنا" : "Contact",
      href: `/${locale}#contact`,
      event: "balqalam:contact",
    },
    { label: nav?.documentation || "Documentation", href: `/${locale}/docs` },
  ]

  return (
    <SmartBar
      dir={ar ? "rtl" : "ltr"}
      variant={variant}
      links={links}
      labels={{
        open: ar ? "افتح القائمة" : "Open menu",
        close: ar ? "أغلق القائمة" : "Close menu",
        nav: ar ? "التنقل الرئيسي" : "Main navigation",
      }}
    >
      <SearchMenu />
      <Separator orientation="vertical" className="mx-1" />
      <LangSwitcher />
      <ModeSwitcher />
      <UserButton variant="marketing" />
    </SmartBar>
  )
}
