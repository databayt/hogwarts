"use client"

import * as React from "react"
import Link from "next/link"
import { useSelectedLayoutSegment } from "next/navigation"
import { MainNavItem } from "./types"
import { siteConfig } from "./config"
import { cn } from "@/lib/utils"
import { Icons } from "./icons"
import { MobileNav } from "./mobile-nav"
import Image from "next/image"

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

interface MainNavProps {
  items?: MainNavItem[]
  children?: React.ReactNode
  school: School
  locale: string
}

export function MainNav({ items, children, school, locale }: MainNavProps) {
  const segment = useSelectedLayoutSegment()
  const [showMobileMenu, setShowMobileMenu] = React.useState<boolean>(false)

  // Use subdomain instead of full school name and capitalize first letter
  const displayName = school.domain.charAt(0).toUpperCase() + school.domain.slice(1);

  return (
    <div className="flex gap-6 md:gap-10">
      <Link href={`/${locale}`} className="hidden items-center gap-2 md:flex">
        <Image src="/logo.png" alt={`${displayName} Logo`} width={20} height={20} className="dark:invert" />
        <span className="hidden sm:inline-block  ">
          {displayName}
        </span>
      </Link>
      {items?.length ? (
        <nav className="hidden gap-6 md:flex">
          {items?.map((item, index) => (
            <Link
              key={index}
              href={item.disabled ? "#" : `/${locale}${item.href}`}
              className={cn(
                "flex items-center text-sm transition-colors hover:text-foreground/80",
                item.href.startsWith(`/${segment}`)
                  ? "text-foreground"
                  : "text-foreground/60",
                item.disabled && "cursor-not-allowed opacity-80"
              )}
            >
              {item.title}
            </Link>
          ))}
        </nav>
      ) : null}
      <button
        className="flex items-center space-x-2 md:hidden"
        onClick={() => setShowMobileMenu(!showMobileMenu)}
      >
        {showMobileMenu ? <Icons.close /> : <Icons.logo />}
        <span>Menu</span>
      </button>
      {showMobileMenu && items && (
        <MobileNav items={items} school={school} locale={locale}>{children}</MobileNav>
      )}
    </div>
  )
}