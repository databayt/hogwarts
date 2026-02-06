import Link from "next/link"
import { LayoutGrid } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { siteConfig } from "@/components/table/config/site"
import { ModeToggle } from "@/components/table/layouts/mode-toggle"

export function SiteHeader() {
  return (
    <header className="border-border/40 bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur-sm">
      <div className="container flex h-14 items-center">
        <Link href="/" className="me-2 flex items-center md:me-6 md:gap-2">
          <LayoutGrid className="size-4" aria-hidden="true" />
          <span className="hidden md:inline-block">{siteConfig.name}</span>
        </Link>
        <nav className="muted flex w-full items-center gap-6">
          <Link
            href="https://diceui.com/docs/components/data-table"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground/60 hover:text-foreground transition-colors"
          >
            Docs
          </Link>
        </nav>
        <nav className="flex flex-1 items-center md:justify-end">
          <Button variant="ghost" size="icon" className="size-8" asChild>
            <Link
              aria-label="GitHub repo"
              href={siteConfig.links.github}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Icons.github className="size-4" aria-hidden="true" />
            </Link>
          </Button>
          <ModeToggle />
        </nav>
      </div>
    </header>
  )
}
