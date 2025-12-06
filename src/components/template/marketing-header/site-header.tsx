import { marketingConfig, docsConfig } from "./config"
import { CommandMenu } from "./command-menu"
import { MainNav } from "./main-nav"
import { MobileNav } from "@/components/template/mobile-nav"
import { ModeSwitcher } from "./mode-switcher"
import { LangSwitcher } from "./lang-switcher"
import { GitHubLink } from "./github-link"
import { Separator } from "@/components/ui/separator"
import type { Dictionary } from '@/components/internationalization/dictionaries'

interface SiteHeaderProps {
    dictionary?: Dictionary
    locale?: string
}

export function SiteHeader({ dictionary, locale = "en" }: SiteHeaderProps) {
    // Transform nav items for MobileNav
    const navItems = marketingConfig.mainNav.map(item => ({
        href: item.href,
        label: dictionary?.navigation?.[item.title.toLowerCase() as keyof typeof dictionary.navigation] as string || item.title,
        disabled: item.disabled
    }))

    // Contextual sections for docs
    const sections = [{
        title: dictionary?.navigation?.documentation || "Documentation",
        items: docsConfig.sidebarNav.flatMap(section =>
            (section.items || []).map(item => ({
                title: item.title,
                href: item.href,
                disabled: item.disabled
            }))
        )
    }]

    return (
        <header className="sticky top-0 z-50 w-full bg-background">
            <div className="flex h-14 items-center gap-2 md:gap-4 **:data-[slot=separator]:!h-4">
                    {/* Left: Nav items */}
                    <MainNav dictionary={dictionary} />
                    {/* Mobile: Popover-based menu */}
                    <MobileNav
                        items={navItems}
                        sections={sections}
                        className="flex lg:hidden"
                        dictionary={dictionary}
                        locale={locale}
                    />
                    {/* Right: Actions */}
                    <nav className="flex flex-1 items-center justify-end gap-0.5">
                        <CommandMenu dictionary={dictionary} />
                        <Separator orientation="vertical" className="ms-2 hidden lg:block" />
                        <GitHubLink />
                        <Separator orientation="vertical" className="mx-1" />
                        <LangSwitcher />
                        <ModeSwitcher />
                    </nav>
            </div>
        </header>
    )
}