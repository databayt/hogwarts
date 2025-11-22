"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { siteConfig } from "./config"
import { cn } from "@/lib/utils"
import { Icons } from "./icons"
import Image from "next/image"
import type { Dictionary } from '@/components/internationalization/dictionaries'

interface MainNavProps {
  dictionary?: Dictionary
}

export function MainNav({ dictionary }: MainNavProps) {
  const pathname = usePathname()

  return (
    <div className="me-4 hidden md:flex">
      <Link href="/" className="me-4 flex items-center gap-2 text-foreground lg:me-6">
        <Image src="/logo.png" alt="Hogwarts Logo" width={24} height={24} className="dark:invert" />
        <h5 className="hidden lg:inline-block font-semibold">
          {dictionary?.navigation?.brandName || siteConfig.name}
        </h5>
      </Link>
      <nav className="flex items-center gap-6 xl:gap-8">
        <Link
          href="/docs"
          className={cn(
            "text-sm font-medium transition-colors hover:text-foreground/80",
            pathname?.startsWith("/docs")
              ? "text-foreground"
              : "text-foreground/60"
          )}
        >
          <h6>{dictionary?.navigation?.documentation || "Docs"}</h6>
        </Link>
        <Link
          href="/features"
          className={cn(
            "text-sm font-medium transition-colors hover:text-foreground/80",
            pathname?.startsWith("/features")
              ? "text-foreground"
              : "text-foreground/60"
          )}
        >
          <h6>{dictionary?.navigation?.features || "Features"}</h6>
        </Link>
        <Link
          href="/pricing"
          className={cn(
            "text-sm font-medium transition-colors hover:text-foreground/80",
            pathname?.startsWith("/pricing")
              ? "text-foreground"
              : "text-foreground/60"
          )}
        >
          <h6>{dictionary?.navigation?.pricing || "Pricing"}</h6>
        </Link>
        <Link
          href="/blog"
          className={cn(
            "text-sm font-medium transition-colors hover:text-foreground/80",
            pathname?.startsWith("/blog")
              ? "text-foreground"
              : "text-foreground/60"
          )}
        >
          <h6>{dictionary?.navigation?.blog || "Blog"}</h6>
        </Link>
      </nav>
    </div>
  )
}