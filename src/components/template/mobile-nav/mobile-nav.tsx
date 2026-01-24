"use client"

import * as React from "react"
import Link, { LinkProps } from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Bell, Mail } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { GenericCommandMenu } from "@/components/atom/generic-command-menu"
import { platformSearchConfig } from "@/components/atom/generic-command-menu/platform-config"
import type { Role } from "@/components/atom/generic-command-menu/types"
import { UserButton } from "@/components/auth/user-button"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { LanguageSwitcher } from "@/components/internationalization/language-switcher"
import type { School } from "@/components/site/types"
import { ModeSwitcher } from "@/components/template/marketing-header/mode-switcher"

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
  // Toolbar props for mobile
  school?: School
  notificationsUrl?: string
  messagesUrl?: string
  currentPath?: string
  role?: Role
  subdomain?: string
  // Marketing mode - show basic actions without platform toolbar
  showMarketingActions?: boolean
}

export function MobileNav({
  items = [],
  sections,
  className,
  dictionary,
  locale = "en",
  homeHref = "/",
  school,
  notificationsUrl,
  messagesUrl,
  currentPath,
  role,
  subdomain,
  showMarketingActions,
}: MobileNavProps) {
  const [open, setOpen] = React.useState(false)
  const pathname = usePathname()

  // Check if toolbar props are provided (platform mode)
  const showToolbar = !!(notificationsUrl || messagesUrl || subdomain)

  // Determine contextual section based on route
  const currentSection = sections?.find((s) =>
    s.items.some((item) => pathname?.includes(item.href))
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
            <span className="sr-only">
              {dictionary?.navigation?.toggleMenu || "Toggle Menu"}
            </span>
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
        <div className="flex flex-col gap-8 overflow-auto px-6 py-6">
          {/* Quick Actions Row (Platform toolbar) */}
          {showToolbar && (
            <div className="flex items-center justify-between gap-2 border-b pb-4">
              <div className="flex items-center gap-1">
                <GenericCommandMenu
                  config={platformSearchConfig}
                  context={{
                    currentRole: role,
                    currentPath: currentPath,
                    schoolId: school?.id,
                  }}
                  variant="icon"
                />
                <LanguageSwitcher variant="toggle" />
                <ModeSwitcher />
                {notificationsUrl && (
                  <Button
                    variant="link"
                    size="icon"
                    className="size-8 cursor-pointer transition-opacity hover:opacity-70"
                    asChild
                    onClick={() => setOpen(false)}
                  >
                    <Link href={notificationsUrl}>
                      <Bell className="h-4 w-4" />
                      <span className="sr-only">Notifications</span>
                    </Link>
                  </Button>
                )}
                {messagesUrl && (
                  <Button
                    variant="link"
                    size="icon"
                    className="size-8 cursor-pointer transition-opacity hover:opacity-70"
                    asChild
                    onClick={() => setOpen(false)}
                  >
                    <Link href={messagesUrl}>
                      <Mail className="h-4 w-4" />
                      <span className="sr-only">Messages</span>
                    </Link>
                  </Button>
                )}
              </div>
              {subdomain && (
                <UserButton variant="platform" subdomain={subdomain} />
              )}
            </div>
          )}

          {/* Main Menu Section */}
          <div className="flex flex-col gap-4">
            <div className="text-muted-foreground text-sm font-medium">
              {dictionary?.navigation?.menu || "Menu"}
            </div>
            <div className="flex flex-col gap-3">
              <MobileLink
                href={homeHref}
                onOpenChange={setOpen}
                locale={locale}
              >
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

          {/* Marketing Actions (language, theme, sign in) */}
          {showMarketingActions && (
            <div className="flex flex-col gap-4 border-t pt-4">
              <div className="flex items-center gap-2">
                <LanguageSwitcher variant="toggle" />
                <ModeSwitcher />
                <UserButton variant="marketing" />
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
      <span
        className={cn(
          "text-muted-foreground cursor-not-allowed text-2xl font-medium",
          className
        )}
      >
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
