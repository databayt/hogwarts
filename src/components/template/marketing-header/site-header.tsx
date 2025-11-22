import Link from "next/link"
import { siteConfig, marketingConfig } from "./config"
import { CommandMenu } from "./command-menu"
import { Icons } from "./icons"
import { MainNav } from "./main-nav"
import { MobileNavButton } from "./mobile-nav-button"
import { ModeSwitcher } from "./mode-switcher"
import { LangSwitcher } from "./lang-switcher"
import { Button } from "@/components/ui/button"
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
                    <div className="ms-auto flex items-center gap-2 md:flex-1 md:justify-end">
                        <div className="hidden w-full flex-1 md:flex md:w-auto md:flex-none">
                            <CommandMenu dictionary={dictionary} />
                        </div>
                        <nav className="flex items-center gap-0.5">
                            <Button
                                asChild
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 px-0"
                            >
                                <Link
                                    href={siteConfig.links.github}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <Icons.gitHub className="h-4 w-4" />
                                    <span className="sr-only">GitHub</span>
                                </Link>
                            </Button>
                            <LangSwitcher />
                            <ModeSwitcher />
                        </nav>
                    </div>
            </div>
        </header>
    )
}