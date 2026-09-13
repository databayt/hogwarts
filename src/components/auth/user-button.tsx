"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type { ComponentType } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ExitIcon, GearIcon, PersonIcon } from "@radix-ui/react-icons"
import {
  Building2,
  CreditCard,
  HelpCircle,
  LayoutDashboard,
  LogIn,
  Rocket,
  School,
  Settings,
  User,
} from "lucide-react"

import { tenantOriginForHost } from "@/lib/root-domain"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogoutButton } from "@/components/auth/logout-button"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import { DemoLink } from "@/components/saas-marketing/demo-link"

import { useCurrentUser } from "./use-current-user"

/* SSR/first-paint href for the SaaS marketing header's sign-in, which opens
   the demo school's dashboard rather than the main site's login. Same
   resolution the homepage hero CTA uses: NEXT_PUBLIC_DEMO_URL wins, else the
   primary root's demo tenant, which DemoLink re-resolves to the visitor's own
   root after mount. */
const DEMO_DASHBOARD_FALLBACK_HREF = `${
  process.env.NEXT_PUBLIC_DEMO_URL || tenantOriginForHost(null, "demo")
}/ar/dashboard`

type Variant = "marketing" | "site" | "saas" | "platform"

interface UserButtonProps {
  /** Context variant for different entry points */
  variant?: Variant
  /** Size of the avatar itself, e.g. `size-6` on the phone menu's row. */
  avatarClassName?: string
  /** Optional subdomain for school context */
  subdomain?: string
  /** Custom class name */
  className?: string
}

export const UserButton = ({
  variant = "platform",
  subdomain,
  className,
  avatarClassName,
}: UserButtonProps) => {
  const user = useCurrentUser()
  const params = useParams()
  const locale = (params?.lang as string) || "ar"
  const { dictionary } = useDictionary()
  const t: Translate = (key, fallback) =>
    (dictionary?.userMenu as Record<string, string> | undefined)?.[key] ||
    fallback

  // Build login URL with context params
  // - SaaS marketing: ?context=saas
  // - School marketing: ?context=school&subdomain=X
  // This helps the login action determine where to redirect after authentication
  const buildLoginUrl = () => {
    const base = `/${locale}/login`
    if (variant === "site" && subdomain) {
      return `${base}?context=school&subdomain=${subdomain}`
    }
    if (variant === "marketing" && subdomain) {
      return `${base}?context=school&subdomain=${subdomain}`
    }
    // Default: SaaS context (no subdomain)
    return `${base}?context=saas`
  }

  const loginUrl = buildLoginUrl()

  // Not logged in - show login button (matches other header icons). On the
  // SaaS marketing header it opens the demo school instead of the login form,
  // matching the homepage hero CTA; every other surface keeps its own login.
  if (!user && variant === "marketing" && !subdomain) {
    return (
      <DemoLink
        fallbackHref={DEMO_DASHBOARD_FALLBACK_HREF}
        lang="ar"
        path="/dashboard"
        newTab={false}
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "size-8",
          className
        )}
      >
        <LogIn className="size-4 rtl:-scale-x-100" />
        <span className="sr-only">{t("login", "Login")}</span>
      </DemoLink>
    )
  }

  if (!user) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn("size-8", className)}
        asChild
      >
        <Link href={loginUrl}>
          <LogIn className="size-4 rtl:-scale-x-100" />
          <span className="sr-only">{t("login", "Login")}</span>
        </Link>
      </Button>
    )
  }

  const { initials: userInitials, displayName, displayEmail } = identity(user)
  const items = getUserMenuItems(variant, {
    locale,
    role: user.role,
    schoolId: user.schoolId,
    t,
  })

  // Render menu based on variant
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={cn("size-8", className)}>
          <Avatar className={cn("size-4", avatarClassName)}>
            <AvatarImage src={user.image || ""} alt={displayName} />
            <AvatarFallback className="bg-primary text-primary-foreground text-[8px] font-medium">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <span className="sr-only">{t("userMenu", "User menu")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" sideOffset={8}>
        {/* User Info Header */}
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm leading-none font-medium">{displayName}</p>
            <p className="text-muted-foreground text-xs leading-none">
              {displayEmail}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Variant-specific menu items */}
        <DropdownMenuGroup>
          {items.map(({ href, label, Icon, shortcut }) => (
            <DropdownMenuItem key={href} asChild className="cursor-pointer">
              <Link href={href}>
                <Icon />
                {label}
                {shortcut && (
                  <DropdownMenuShortcut>{shortcut}</DropdownMenuShortcut>
                )}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>

        {/* Logout - common to all variants */}
        <DropdownMenuSeparator />
        <LogoutButton>
          <DropdownMenuItem variant="destructive" className="cursor-pointer">
            <ExitIcon />
            {t("logout", "Logout")}
            <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
          </DropdownMenuItem>
        </LogoutButton>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ============================================================================
// Variant-specific menu items
// ============================================================================

type Translate = (key: string, fallback: string) => string

interface UserMenuItem {
  href: string
  label: string
  Icon: ComponentType<{ className?: string }>
  shortcut?: string
}

interface MenuContext {
  locale: string
  role?: string
  schoolId?: string
  t: Translate
}

/**
 * The account links each entry point offers, as data rather than JSX, so the
 * avatar's dropdown and the phone menu that lists them inline (`UserMenuInline`)
 * cannot drift apart.
 *
 * - marketing (ed.databayt.org): DEVELOPER → Dashboard + Tenants; with a school
 *   → My School; without → Get Started; then Settings
 * - site ({school}.databayt.org): Go to Platform, Profile
 * - saas (operator dashboard): Profile, Billing, Tenants (DEVELOPER), Settings
 * - platform (school dashboard): Profile, My Account, School Settings (ADMIN /
 *   DEVELOPER), Help & Support
 */
function getUserMenuItems(
  variant: Variant,
  { locale, role, schoolId, t }: MenuContext
): UserMenuItem[] {
  const base = `/${locale}`
  const isDeveloper = role === "DEVELOPER"

  switch (variant) {
    case "marketing":
      return [
        ...(isDeveloper
          ? [
              {
                href: `${base}/dashboard`,
                label: t("dashboard", "Dashboard"),
                Icon: LayoutDashboard,
              },
              {
                href: `${base}/tenants`,
                label: t("tenants", "Tenants"),
                Icon: Building2,
              },
            ]
          : schoolId
            ? [
                {
                  href: `${base}/my-school`,
                  label: t("mySchool", "My School"),
                  Icon: School,
                },
              ]
            : [
                {
                  href: `${base}/newcomers`,
                  label: t("getStarted", "Get Started"),
                  Icon: Rocket,
                },
              ]),
        {
          href: `${base}/settings`,
          label: t("settings", "Settings"),
          Icon: Settings,
        },
      ]
    case "site":
      // School sites reach the dashboard through the subdomain rewrite.
      return [
        {
          href: `${base}/dashboard`,
          label: t("goToPlatform", "Go to Platform"),
          Icon: School,
        },
        { href: `${base}/profile`, label: t("profile", "Profile"), Icon: User },
      ]
    case "saas":
      return [
        {
          href: `${base}/profile`,
          label: t("profile", "Profile"),
          Icon: User,
          shortcut: "⇧⌘P",
        },
        {
          href: `${base}/billing`,
          label: t("billing", "Billing"),
          Icon: CreditCard,
        },
        ...(isDeveloper
          ? [
              {
                href: `${base}/tenants`,
                label: t("tenants", "Tenants"),
                Icon: Building2,
              },
            ]
          : []),
        {
          href: `${base}/settings`,
          label: t("settings", "Settings"),
          Icon: Settings,
          shortcut: "⌘,",
        },
      ]
    case "platform":
      return [
        {
          href: `${base}/profile`,
          label: t("profile", "Profile"),
          Icon: User,
          shortcut: "⇧⌘P",
        },
        {
          href: `${base}/account`,
          label: t("myAccount", "My Account"),
          Icon: PersonIcon,
        },
        ...(role === "ADMIN" || isDeveloper
          ? [
              {
                href: `${base}/admin/settings`,
                label: t("schoolSettings", "School Settings"),
                Icon: GearIcon,
              },
            ]
          : []),
        {
          href: `${base}/help`,
          label: t("helpSupport", "Help & Support"),
          Icon: HelpCircle,
        },
      ]
  }
}

// ============================================================================
// Inline menu
// ============================================================================

interface UserMenuInlineProps {
  variant?: Variant
  subdomain?: string
  className?: string
  /** Fired when a link is followed, for a sheet that should close behind it. */
  onNavigate?: () => void
}

/**
 * The avatar's dropdown, laid out flat — for a phone menu sheet, where a menu
 * that opens a second menu is one tap too many. Same identity header, same
 * items (`getUserMenuItems`), same logout; a signed-out visitor gets the login
 * link the avatar button would have been.
 */
export function UserMenuInline({
  variant = "platform",
  subdomain,
  className,
  onNavigate,
}: UserMenuInlineProps) {
  const user = useCurrentUser()
  const params = useParams()
  const locale = (params?.lang as string) || "ar"
  const { dictionary } = useDictionary()
  const t: Translate = (key, fallback) =>
    (dictionary?.userMenu as Record<string, string> | undefined)?.[key] ||
    fallback

  const row =
    "flex items-center gap-3 py-2 text-lg font-medium [&_svg]:size-5 [&_svg]:shrink-0"

  if (!user) {
    const loginUrl = subdomain
      ? `/${locale}/login?context=school&subdomain=${subdomain}`
      : `/${locale}/login?context=saas`
    return (
      <div
        data-slot="user-menu-inline"
        className={cn("flex flex-col", className)}
      >
        <Link href={loginUrl} onClick={onNavigate} className={row}>
          <LogIn className="rtl:-scale-x-100" />
          {t("login", "Login")}
        </Link>
      </div>
    )
  }

  const { initials, displayName, displayEmail } = identity(user)
  const items = getUserMenuItems(variant, {
    locale,
    role: user.role,
    schoolId: user.schoolId,
    t,
  })

  return (
    <div
      data-slot="user-menu-inline"
      className={cn("flex flex-col", className)}
    >
      <div className="flex items-center gap-3 pb-3">
        <Avatar className="size-10">
          <AvatarImage src={user.image || ""} alt={displayName} />
          <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="truncate text-base leading-tight font-medium">
            {displayName}
          </p>
          <p className="text-muted-foreground truncate text-sm leading-tight">
            {displayEmail}
          </p>
        </div>
      </div>
      {items.map(({ href, label, Icon }) => (
        <Link key={href} href={href} onClick={onNavigate} className={row}>
          <Icon />
          {label}
        </Link>
      ))}
      <LogoutButton className={cn(row, "text-destructive cursor-pointer")}>
        <ExitIcon />
        {t("logout", "Logout")}
      </LogoutButton>
    </div>
  )
}

function identity(user: { name?: string | null; email?: string | null }) {
  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email?.charAt(0).toUpperCase() || "U"
  return {
    initials,
    displayName: user.name || user.email?.split("@")[0] || "User",
    displayEmail: user.email || "",
  }
}
