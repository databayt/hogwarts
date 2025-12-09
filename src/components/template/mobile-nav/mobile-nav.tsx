"use client"

import * as React from "react"
import Link, { LinkProps } from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { Dictionary } from "@/components/internationalization/dictionaries"

export interface NavItem {
  href: string
  label: string
  disabled?: boolean
}

export interface NavSection {
  title: string
  items: { title: string; href: string; disabled?: boolean }[]
}

interface MobileNavProps {
  items?: NavItem[]
  sections?: NavSection[]
  className?: string
  dictionary?: Dictionary
  locale?: string
  homeHref?: string
  brandName?: string
}

export function MobileNav({
  items = [],
  sections,
  className,
  dictionary,
  locale = "en",
  homeHref = "/",
}: MobileNavProps) {
  const [open, setOpen] = React.useState(false)
  const pathname = usePathname()

  // Determine contextual section based on route
  const currentSection = sections?.find(s =>
    s.items.some(item => pathname?.includes(item.href))
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "extend-touch-target h-8 touch-manipulation items-center justify-start gap-2.5 !p-0 hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 active:bg-transparent dark:hover:bg-transparent",
            className
          )}
        >
          {/* Animated hamburger */}
          <div className="relative flex h-8 w-4 items-center justify-center">
            <div className="relative size-4">
              <span
                className={cn(
                  "bg-foreground absolute left-0 block h-0.5 w-4 transition-all duration-100",
                  open ? "top-[0.4rem] -rotate-45" : "top-1"
                )}
              />
              <span
                className={cn(
                  "bg-foreground absolute left-0 block h-0.5 w-4 transition-all duration-100",
                  open ? "top-[0.4rem] rotate-45" : "top-2.5"
                )}
              />
            </div>
            <span className="sr-only">{dictionary?.navigation?.toggleMenu || "Toggle Menu"}</span>
          </div>
          <span className="flex h-8 items-center text-lg leading-none font-medium">
            {dictionary?.navigation?.menu || "Menu"}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="bg-background/90 no-scrollbar h-(--radix-popper-available-height) w-(--radix-popper-available-width) overflow-y-auto rounded-none border-none p-0 shadow-none backdrop-blur duration-100"
        align="start"
        side="bottom"
        alignOffset={-16}
        sideOffset={14}
      >
        <div className="flex flex-col gap-12 overflow-auto px-6 py-6">
          {/* Main Menu Section */}
          <div className="flex flex-col gap-4">
            <div className="text-muted-foreground text-sm font-medium">
              {dictionary?.navigation?.menu || "Menu"}
            </div>
            <div className="flex flex-col gap-3">
              <MobileLink href={homeHref} onOpenChange={setOpen} locale={locale}>
                {dictionary?.common?.home || "Home"}
              </MobileLink>
              {items.map((item, index) => (
                <MobileLink
                  key={index}
                  href={item.href}
                  onOpenChange={setOpen}
                  locale={locale}
                  disabled={item.disabled}
                >
                  {item.label}
                </MobileLink>
              ))}
            </div>
          </div>

          {/* Contextual Section (if applicable) */}
          {currentSection && (
            <div className="flex flex-col gap-4">
              <div className="text-muted-foreground text-sm font-medium">
                {currentSection.title}
              </div>
              <div className="flex flex-col gap-3">
                {currentSection.items.map((item) => (
                  <MobileLink
                    key={item.href}
                    href={item.href}
                    onOpenChange={setOpen}
                    locale={locale}
                    disabled={item.disabled}
                  >
                    {item.title}
                  </MobileLink>
                ))}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function MobileLink({
  href,
  onOpenChange,
  className,
  children,
  locale,
  disabled,
  ...props
}: LinkProps & {
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
  className?: string
  locale?: string
  disabled?: boolean
}) {
  const router = useRouter()
  const fullHref = locale ? `/${locale}${href}` : href

  if (disabled) {
    return (
      <span className={cn("text-2xl font-medium text-muted-foreground cursor-not-allowed", className)}>
        {children}
      </span>
    )
  }

  return (
    <Link
      href={fullHref}
      onClick={() => {
        router.push(fullHref.toString())
        onOpenChange?.(false)
      }}
      className={cn("text-2xl font-medium", className)}
      {...props}
    >
      {children}
    </Link>
  )
}
