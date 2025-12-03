import { marketingConfig } from "./config"
import { CommandMenu } from "./command-menu"
import { MainNav } from "./main-nav"
import { MobileNavButton } from "./mobile-nav-button"
import { ModeSwitcher } from "./mode-switcher"
import { LangSwitcher } from "./lang-switcher"
import { GitHubLink } from "./github-link"
import { Separator } from "@/components/ui/separator"
import type { Dictionary } from '@/components/internationalization/dictionaries'

interface SiteHeaderProps {
    dictionary?: Dictionary
}

export function SiteHeader({ dictionary }: SiteHeaderProps) {
    return (
        <header className="sticky top-0 z-50 w-full bg-background">
            <div className="flex h-14 items-center gap-2 md:gap-4 **:data-[slot=separator]:!h-4">
                    <MainNav dictionary={dictionary} />
                    <MobileNavButton items={marketingConfig.mainNav} dictionary={dictionary} />
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