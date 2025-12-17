"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { ExitIcon, GearIcon, PersonIcon } from "@radix-ui/react-icons"
import {
  Building2,
  CreditCard,
  HelpCircle,
  LayoutDashboard,
  LogIn,
  School,
  Settings,
  User,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
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

import { useCurrentUser } from "./use-current-user"

type Variant = "marketing" | "site" | "saas" | "platform"

interface UserButtonProps {
  /** Context variant for different entry points */
  variant?: Variant
  /** Optional subdomain for school context */
  subdomain?: string
  /** Custom class name */
  className?: string
}

export const UserButton = ({
  variant = "platform",
  subdomain,
  className,
}: UserButtonProps) => {
  const user = useCurrentUser()
  const params = useParams()
  const locale = (params?.lang as string) || "ar"

  // Build URLs based on variant and locale
  const loginUrl = `/${locale}/login`

  // Not logged in - show login button (matches other header icons)
  if (!user) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn("size-8", className)}
        asChild
      >
        <Link href={loginUrl}>
          <LogIn className="size-4" />
          <span className="sr-only">Login</span>
        </Link>
      </Button>
    )
  }

  // Get user display info
  const userInitials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email?.charAt(0).toUpperCase() || "U"

  const displayName = user.name || user.email?.split("@")[0] || "User"
  const displayEmail = user.email || ""

  // Render menu based on variant
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={cn("size-8", className)}>
          <Avatar className="size-6">
            <AvatarImage src={user.image || ""} alt={displayName} />
            <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-medium">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <span className="sr-only">User menu</span>
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
        {variant === "marketing" && (
          <MarketingMenu locale={locale} role={user.role} />
        )}
        {variant === "site" && (
          <SiteMenu locale={locale} subdomain={subdomain} />
        )}
        {variant === "saas" && <SaasMenu locale={locale} role={user.role} />}
        {variant === "platform" && (
          <PlatformMenu
            locale={locale}
            subdomain={subdomain}
            role={user.role}
          />
        )}

        {/* Logout - common to all variants */}
        <DropdownMenuSeparator />
        <LogoutButton>
          <DropdownMenuItem variant="destructive" className="cursor-pointer">
            <ExitIcon />
            Logout
            <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
          </DropdownMenuItem>
        </LogoutButton>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ============================================================================
// Variant-specific Menu Components
// ============================================================================

interface MenuProps {
  locale: string
  subdomain?: string
  role?: string
}

/**
 * Marketing Menu (SaaS marketing site - ed.databayt.org)
 * - Dashboard (go to operator dashboard)
 * - Schools (manage schools)
 * - Settings
 */
function MarketingMenu({ locale, role }: MenuProps) {
  const isOperator = role === "DEVELOPER" || role === "ADMIN"

  return (
    <DropdownMenuGroup>
      <DropdownMenuItem asChild className="cursor-pointer">
        <Link href={`/${locale}/o`}>
          <LayoutDashboard />
          Dashboard
        </Link>
      </DropdownMenuItem>
      {isOperator && (
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href={`/${locale}/o/schools`}>
            <Building2 />
            Schools
          </Link>
        </DropdownMenuItem>
      )}
      <DropdownMenuItem asChild className="cursor-pointer">
        <Link href={`/${locale}/o/settings`}>
          <Settings />
          Settings
        </Link>
      </DropdownMenuItem>
    </DropdownMenuGroup>
  )
}

/**
 * Site Menu (School marketing site - school.databayt.org)
 * - Go to Platform (enter school dashboard)
 * - Profile
 */
function SiteMenu({ locale, subdomain }: MenuProps) {
  // For school sites, platform URL uses the subdomain routing
  const platformUrl = subdomain
    ? `/${locale}/s/${subdomain}/dashboard`
    : `/${locale}/dashboard`

  return (
    <DropdownMenuGroup>
      <DropdownMenuItem asChild className="cursor-pointer">
        <Link href={platformUrl}>
          <School />
          Go to Platform
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild className="cursor-pointer">
        <Link href={`/${locale}/profile`}>
          <User />
          Profile
        </Link>
      </DropdownMenuItem>
    </DropdownMenuGroup>
  )
}

/**
 * SaaS Menu (Operator dashboard - /o/*)
 * - Profile
 * - Account/Billing
 * - Schools (operators only)
 * - Settings
 */
function SaasMenu({ locale, role }: MenuProps) {
  const isOperator = role === "DEVELOPER" || role === "ADMIN"

  return (
    <DropdownMenuGroup>
      <DropdownMenuItem asChild className="cursor-pointer">
        <Link href={`/${locale}/o/profile`}>
          <User />
          Profile
          <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild className="cursor-pointer">
        <Link href={`/${locale}/o/billing`}>
          <CreditCard />
          Billing
        </Link>
      </DropdownMenuItem>
      {isOperator && (
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href={`/${locale}/o/schools`}>
            <Building2 />
            Schools
          </Link>
        </DropdownMenuItem>
      )}
      <DropdownMenuItem asChild className="cursor-pointer">
        <Link href={`/${locale}/o/settings`}>
          <Settings />
          Settings
          <DropdownMenuShortcut>⌘,</DropdownMenuShortcut>
        </Link>
      </DropdownMenuItem>
    </DropdownMenuGroup>
  )
}

/**
 * Platform Menu (School platform - /s/[subdomain]/*)
 * - Profile
 * - My Account
 * - Switch School (if has multiple)
 * - Help & Support
 */
function PlatformMenu({ locale, subdomain, role }: MenuProps) {
  // Build URLs with subdomain context
  const baseUrl = subdomain ? `/${locale}/s/${subdomain}` : `/${locale}`
  const isAdmin = role === "ADMIN" || role === "DEVELOPER"

  return (
    <DropdownMenuGroup>
      <DropdownMenuItem asChild className="cursor-pointer">
        <Link href={`${baseUrl}/profile`}>
          <User />
          Profile
          <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild className="cursor-pointer">
        <Link href={`${baseUrl}/account`}>
          <PersonIcon />
          My Account
        </Link>
      </DropdownMenuItem>
      {isAdmin && (
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href={`${baseUrl}/admin/settings`}>
            <GearIcon />
            School Settings
          </Link>
        </DropdownMenuItem>
      )}
      <DropdownMenuItem asChild className="cursor-pointer">
        <Link href={`${baseUrl}/help`}>
          <HelpCircle />
          Help & Support
        </Link>
      </DropdownMenuItem>
    </DropdownMenuGroup>
  )
}
