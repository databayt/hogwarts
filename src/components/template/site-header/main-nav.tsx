"use client"

import Image from "next/image"
import Link from "next/link"
import { useSelectedLayoutSegment } from "next/navigation"

import { cn } from "@/lib/utils"

import { MainNavItem } from "./types"

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

interface MainNavProps {
  items?: MainNavItem[]
  school: School
  locale: string
}

export function MainNav({ items, school, locale }: MainNavProps) {
  const segment = useSelectedLayoutSegment()

  // Use subdomain instead of full school name and capitalize first letter
  const displayName =
    school.domain.charAt(0).toUpperCase() + school.domain.slice(1)

  return (
    <div className="me-4 hidden lg:flex">
      <Link
        href={`/${locale}`}
        className="text-foreground me-4 flex items-center gap-2 lg:me-6"
      >
        <div className="pt-0.5">
          <Image
            src="/logo.png"
            alt={`${displayName} Logo`}
            width={18}
            height={18}
            className="dark:invert"
          />
        </div>
        <h6 className="hidden font-bold lg:inline-block">{displayName}</h6>
      </Link>
      {items?.length ? (
        <nav className="flex items-center gap-6 xl:gap-8">
          {items?.map((item, index) => {
            const href = item.disabled ? "#" : `/${locale}${item.href}`
            const classes = cn(
              "text-muted-foreground hover:text-foreground text-sm transition-colors",
              item.href.startsWith(`/${segment}`) && "text-foreground",
              item.disabled && "cursor-not-allowed opacity-80"
            )

            // Links that cross route groups (marketing → dashboard) need
            // full page navigation so the proxy rewrite runs correctly
            if (item.href === "/dashboard") {
              return (
                <a key={index} href={href} className={classes}>
                  {item.title}
                </a>
              )
            }

            return (
              <Link key={index} href={href} className={classes}>
                {item.title}
              </Link>
            )
          })}
        </nav>
      ) : null}
    </div>
  )
}
