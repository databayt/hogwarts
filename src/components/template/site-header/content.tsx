import React from 'react'
import { MainNav } from './main-nav'
import { SiteMobileNav } from './site-mobile-nav'
import { marketingConfig } from "./config"
import { auth } from "@/auth"
import { ModeSwitcher } from '@/components/template/marketing-header/mode-switcher'
import { LangSwitcher } from '@/components/template/marketing-header/lang-switcher'
import { Separator } from "@/components/ui/separator"
import { Button, buttonVariants } from '@/components/ui/button'
import { LogoutButton } from '@/components/auth/logout-button'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { SearchButton } from './search-button'
import { getDictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'

interface School {
  id: string;
  name: string;
  domain: string;
  logoUrl?: string | null;
  address?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  website?: string | null;
  timezone?: string;
  planType?: string;
  maxStudents?: number;
  maxTeachers?: number;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface SiteHeaderProps {
  school: School;
  locale: string;
}

export default async function SiteHeader({ school, locale }: SiteHeaderProps) {
  const session = await auth();
  const isAuthenticated = !!session?.user;
  const dictionary = await getDictionary(locale as Locale);

  // Transform nav items for MobileNav
  const navItems = marketingConfig.mainNav.map(item => ({
    href: item.href,
    label: item.title,
    disabled: item.disabled
  }))

  return (
    <header className="sticky top-0 z-50 w-full bg-background">
      <div className="flex h-14 items-center gap-2 md:gap-4 **:data-[slot=separator]:!h-4">
        {/* Desktop: MainNav */}
        <MainNav items={marketingConfig.mainNav} school={school} locale={locale} />
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
              className="px-4 text-muted-foreground"
              asChild
            >
              <LogoutButton>Logout</LogoutButton>
            </Button>
          ) : (
            <Link
              href={`/${locale}/login`}
              className={cn(
                buttonVariants({ variant: "secondary", size: "sm" }),
                "px-4 text-muted-foreground"
              )}
            >
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
