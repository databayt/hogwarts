import Link from "next/link"
import { marketingConfig } from "./config"
import { MainNav } from "./main-nav"
import { MobileNavButton } from "./mobile-nav-button"
import { ModeSwitcher } from "./mode-switcher"
import { LangSwitcher } from "./lang-switcher"
import { GitHubLink } from "./github-link"
import { buttonVariants } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
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
        <MobileNavButton items={marketingConfig.mainNav} dictionary={dictionary} />
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
          <nav className="flex items-center gap-0.5 **:data-[slot=separator]:!h-4">
            <Separator orientation="vertical" className="mx-1 hidden md:block" />
            <GitHubLink />
            <Separator orientation="vertical" className="mx-1" />
            <LangSwitcher />
            <ModeSwitcher />
          </nav>
        </div>
      </div>
    </header>
  )
}