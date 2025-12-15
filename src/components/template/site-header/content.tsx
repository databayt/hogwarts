import React from "react"
import Link from "next/link"
import { auth } from "@/auth"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { LogoutButton } from "@/components/auth/logout-button"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { LangSwitcher } from "@/components/template/marketing-header/lang-switcher"
import { ModeSwitcher } from "@/components/template/marketing-header/mode-switcher"

import { marketingConfig } from "./config"
import { MainNav } from "./main-nav"
import { SearchButton } from "./search-button"
import { SiteMobileNav } from "./site-mobile-nav"

interface School {
  id: string
  name: string
  domain: string
  logoUrl?: string | null
  address?: string | null
  phoneNumber?: string | null
  email?: string | null
  website?: string | null
  timezone?: string
  planType?: string
  maxStudents?: number
  maxTeachers?: number
  isActive?: boolean
  createdAt?: Date
  updatedAt?: Date
}

interface SiteHeaderProps {
  school: School
  locale: string
}

export default async function SiteHeader({ school, locale }: SiteHeaderProps) {
  const session = await auth()
  const isAuthenticated = !!session?.user
  const dictionary = await getDictionary(locale as Locale)

  // Transform nav items for MobileNav
  const navItems = marketingConfig.mainNav.map((item) => ({
    href: item.href,
    label: item.title,
    disabled: item.disabled,
  }))

  return (
    <header className="bg-background sticky top-0 z-50 w-full">
      <div className="flex h-14 items-center gap-2 **:data-[slot=separator]:!h-4 md:gap-4">
        {/* Desktop: MainNav */}
        <MainNav
          items={marketingConfig.mainNav}
          school={school}
          locale={locale}
        />
        {/* Mobile: Popover-based menu */}
        <SiteMobileNav
          items={navItems}
          dictionary={dictionary}
          locale={locale}
        />
        <nav className="flex flex-1 items-center justify-end gap-0.5">
          <SearchButton />
          <Separator orientation="vertical" className="mx-1" />
          <LangSwitcher />
          <ModeSwitcher />
          <Separator orientation="vertical" className="mx-1" />
          {isAuthenticated ? (
            <Button
              variant="secondary"
              size="sm"
              className="text-muted-foreground px-4"
              asChild
            >
              <LogoutButton>Logout</LogoutButton>
            </Button>
          ) : (
            <Link
              href={`/${locale}/login`}
              className={cn(
                buttonVariants({ variant: "secondary", size: "sm" }),
                "text-muted-foreground px-4"
              )}
            >
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
