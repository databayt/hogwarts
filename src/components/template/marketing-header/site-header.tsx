import { marketingConfig } from "./config"
import { CommandMenu } from "./command-menu"
import { MainNav } from "./main-nav"
import { MobileNavButton } from "./mobile-nav-button"
import { ModeSwitcher } from "./mode-switcher"
import { LangSwitcher } from "./lang-switcher"
import type { Dictionary } from '@/components/internationalization/dictionaries'

interface SiteHeaderProps {
    dictionary?: Dictionary
}

export function SiteHeader({ dictionary }: SiteHeaderProps) {
    return (
        <header className="border-grid sticky top-0 z-50 w-full border-b-[0.5px] bg-background">
            <div className="flex h-14 items-center gap-2 md:gap-4">
                    <MainNav dictionary={dictionary} />
                    <MobileNavButton items={marketingConfig.mainNav} dictionary={dictionary} />
                    <nav className="flex flex-1 items-center justify-end">
                        <CommandMenu dictionary={dictionary} />
                        <LangSwitcher />
                        <ModeSwitcher />
                    </nav>
            </div>
        </header>
    )
}