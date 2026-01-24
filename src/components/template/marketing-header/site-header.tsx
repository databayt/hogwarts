import { Separator } from "@/components/ui/separator"
import { UserButton } from "@/components/auth/user-button"
import { DOCS_LINKS } from "@/components/docs/docs-config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { MobileNav } from "@/components/template/mobile-nav"

import { CommandMenu } from "./command-menu"
import { marketingConfig } from "./config"
import { GitHubLink } from "./github-link"
import { LangSwitcher } from "./lang-switcher"
import { MainNav } from "./main-nav"
import { ModeSwitcher } from "./mode-switcher"

interface SiteHeaderProps {
  dictionary?: Dictionary
  locale?: string
}

export function SiteHeader({ dictionary, locale = "en" }: SiteHeaderProps) {
  const isRTL = locale === "ar"

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

  return (
    <header
      className="bg-background sticky top-0 z-50 w-full"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="flex h-14 items-center gap-2 **:data-[slot=separator]:!h-4 md:gap-4">
        {/* Left: Nav items */}
        <MainNav dictionary={dictionary} />
        {/* Mobile: Popover-based menu */}
        <MobileNav
          items={navItems}
          sections={sections}
          className="flex lg:hidden"
          dictionary={dictionary}
          locale={locale}
          showMarketingActions
        />
        {/* Right: Actions */}
        <nav className="flex flex-1 items-center justify-end gap-0.5">
          <CommandMenu dictionary={dictionary} />
          <Separator orientation="vertical" className="ms-2 hidden lg:block" />
          <GitHubLink />
          {/* Desktop: Show all actions */}
          <Separator orientation="vertical" className="mx-1 hidden lg:block" />
          <LangSwitcher className="hidden lg:flex" />
          <ModeSwitcher className="hidden lg:flex" />
          <UserButton variant="marketing" className="hidden lg:flex" />
        </nav>
      </div>
    </header>
  )
}
