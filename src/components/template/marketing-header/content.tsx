import { Separator } from "@/components/ui/separator"
import { UserButton } from "@/components/auth/user-button"
import { DOCS_LINKS } from "@/components/docs/docs-config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { marketingConfig } from "./config"
import { GitHubLink } from "./github-link"
import { LangSwitcher } from "./lang-switcher"
import { MainNav } from "./main-nav"
import { MarketingMobileNav } from "./marketing-mobile-nav"
import { ModeSwitcher } from "./mode-switcher"

interface MarketingHeaderProps {
  dictionary?: Dictionary
  locale?: string
}

export default function MarketingHeader({
  dictionary,
  locale = "en",
}: MarketingHeaderProps) {
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
      className="border-grid bg-background sticky top-0 z-50 w-full border-b"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="container flex h-14 items-center gap-2 md:gap-4">
        <MainNav dictionary={dictionary} />
        <MarketingMobileNav
          items={navItems}
          sections={sections}
          dictionary={dictionary}
          locale={locale}
        />
        <div className="ms-auto flex items-center gap-2 md:flex-1 md:justify-end">
          <nav className="flex items-center gap-0.5 **:data-[slot=separator]:!h-4">
            <GitHubLink />
            <Separator orientation="vertical" className="mx-1" />
            <LangSwitcher />
            <ModeSwitcher />
            <Separator orientation="vertical" className="mx-1" />
            <UserButton variant="marketing" />
          </nav>
        </div>
      </div>
    </header>
  )
}
