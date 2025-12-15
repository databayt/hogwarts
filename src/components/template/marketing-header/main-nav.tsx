"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { siteConfig } from "./config"

interface MainNavProps {
  dictionary?: Dictionary
}

export function MainNav({ dictionary }: MainNavProps) {
  const pathname = usePathname()

  return (
    <div className="me-4 hidden md:flex">
      <Link
        href="/"
        className="text-foreground me-4 flex items-center gap-2 lg:me-6"
      >
        <div className="pt-0.5">
          <Image
            src="/logo.png"
            alt="Hogwarts Logo"
            width={18}
            height={18}
            className="dark:invert"
          />
        </div>
        <h6 className="hidden font-bold lg:inline-block">
          {dictionary?.navigation?.brandName || siteConfig.name}
        </h6>
      </Link>
      <nav className="flex items-center gap-6 xl:gap-8">
        <Link
          href="/features"
          className={cn(
            "text-muted-foreground hover:text-foreground text-sm transition-colors",
            pathname?.startsWith("/features") && "text-foreground"
          )}
        >
          <span>{dictionary?.navigation?.features || "Features"}</span>
        </Link>
        <Link
          href="/blog"
          className={cn(
            "text-muted-foreground hover:text-foreground text-sm transition-colors",
            pathname?.startsWith("/blog") && "text-foreground"
          )}
        >
          <span>{dictionary?.navigation?.blog || "Blog"}</span>
        </Link>
        <Link
          href="/pricing"
          className={cn(
            "text-muted-foreground hover:text-foreground text-sm transition-colors",
            pathname?.startsWith("/pricing") && "text-foreground"
          )}
        >
          <span>{dictionary?.navigation?.pricing || "Pricing"}</span>
        </Link>
        <Link
          href="/docs"
          className={cn(
            "text-muted-foreground hover:text-foreground text-sm transition-colors",
            pathname?.startsWith("/docs") && "text-foreground"
          )}
        >
          <span>
            {dictionary?.navigation?.documentation || "Documentation"}
          </span>
        </Link>
      </nav>
    </div>
  )
}
