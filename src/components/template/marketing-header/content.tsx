import Link from "next/link"
import { siteConfig, marketingConfig } from "./config"
import { Icons } from "./icons"
import { MainNav } from "./main-nav"
import { MobileNav } from "./mobile-nav"
import { ModeSwitcher } from "./mode-switcher"
import { LangSwitcher } from "./lang-switcher"
import { Button } from "@/components/ui/button"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Dictionary } from '@/components/internationalization/dictionaries'
import { auth } from "@/auth"
import { LogoutButton } from '@/components/auth/logout-button'

interface MarketingHeaderProps {
  dictionary?: Dictionary
}

export default async function MarketingHeader({ dictionary }: MarketingHeaderProps) {
  const session = await auth()
  const isAuthenticated = !!session?.user

  return (
    <header className="border-grid sticky top-0 z-50 w-full border-b bg-background">
      <div className="container flex h-14 items-center gap-2 md:gap-4">
        <MainNav dictionary={dictionary} />
        <MobileNav items={marketingConfig.mainNav} dictionary={dictionary} />
        <div className="ms-auto flex items-center gap-2 md:flex-1 md:justify-end">
          <div className="hidden w-full flex-1 md:flex md:w-auto md:flex-none">
            {/* Login/Logout instead of CommandMenu */}
            <div className="mr-4">
              {isAuthenticated ? (
                <LogoutButton
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "px-4"
                  )}
                >
                  {dictionary?.auth?.signOut || 'Logout'}
                </LogoutButton>
              ) : (
                <Link
                  href="/login"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "px-4"
                  )}
                >
                  {dictionary?.auth?.signIn || 'Login'}
                </Link>
              )}
            </div>
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