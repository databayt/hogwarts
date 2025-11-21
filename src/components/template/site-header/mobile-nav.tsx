import * as React from "react"
import Link from "next/link"

import { MainNavItem } from "./types"
import { siteConfig } from "./config"
import { cn } from "@/lib/utils"
import { useLockBody } from "./use-lock-body"
import { Icons } from "./icons"

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

interface MobileNavProps {
  items: MainNavItem[]
  children?: React.ReactNode
  school: School
  locale: string
}

export function MobileNav({ items, children, school, locale }: MobileNavProps) {
  useLockBody()

  // Use subdomain instead of full school name and capitalize first letter
  const displayName = school.domain.charAt(0).toUpperCase() + school.domain.slice(1);

  return (
    <div
      className={cn(
        "fixed inset-0 top-16 z-50 grid h-[calc(100vh-4rem)] grid-flow-row auto-rows-max overflow-auto p-6 pb-32 shadow-md animate-in slide-in-from-bottom-80 md:hidden"
      )}
    >
      <div className="relative z-20 grid gap-6 rounded-md bg-popover p-4 text-popover-foreground shadow-md">
        <Link href={`/${locale}`} className="flex items-center space-x-2">
          <Icons.logo />
          <span>{displayName}</span>
        </Link>
        <nav className="grid grid-flow-row auto-rows-max muted">
          {items.map((item, index) => (
            <Link
              key={index}
              href={item.disabled ? "#" : `/${locale}${item.href}`}
              className={cn(
                "flex w-full items-center rounded-md p-2 muted hover:underline",
                item.disabled && "cursor-not-allowed opacity-60"
              )}
            >
              {item.title}
            </Link>
          ))}
        </nav>
        {children}
      </div>
    </div>
  )
}