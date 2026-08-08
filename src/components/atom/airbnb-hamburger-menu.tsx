"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import * as React from "react"
import Link from "next/link"
import {
  Bell,
  BookOpen,
  Building2,
  Calendar,
  ChevronRight,
  Globe,
  Heart,
  HelpCircle,
  Home,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  PlusCircle,
  Settings,
  Shield,
  Sparkles,
  Sun,
  User,
  UserPlus,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface AirbnbUser {
  name?: string
  email?: string
  avatarUrl?: string
  unreadCount?: number
  isHost?: boolean
  role?: string
}

export interface AirbnbHamburgerMenuProps {
  /** User authentication state */
  isLoggedIn?: boolean
  /** Active user details */
  user?: AirbnbUser | null
  /** Locale language code ('ar' | 'en') */
  locale?: string
  /** Custom trigger button container styling */
  className?: string
  /** Dropdown menu alignment ('end' | 'start' | 'center') */
  align?: "end" | "start" | "center"
  /** Callback on login click */
  onLogin?: () => void
  /** Callback on sign up click */
  onSignUp?: () => void
  /** Callback on logout click */
  onLogout?: () => void
  /** Show interactive toggle bar in demo mode */
  demoMode?: boolean
}

export function AirbnbHamburgerMenu({
  isLoggedIn: initialIsLoggedIn = false,
  user: initialUser = null,
  locale = "ar",
  className,
  align = "end",
  onLogin,
  onSignUp,
  onLogout,
  demoMode = false,
}: AirbnbHamburgerMenuProps) {
  const [isLoggedIn, setIsLoggedIn] = React.useState(initialIsLoggedIn)
  const [user, setUser] = React.useState<AirbnbUser | null>(initialUser)
  const [theme, setTheme] = React.useState<"light" | "dark">("light")

  React.useEffect(() => {
    setIsLoggedIn(initialIsLoggedIn)
  }, [initialIsLoggedIn])

  React.useEffect(() => {
    setUser(initialUser)
  }, [initialUser])

  const isRtl = locale === "ar"
  const activeUser = user || {
    name: isRtl ? "عبدالله محمد" : "Abdullah Mohammed",
    email: "abdullah@example.com",
    unreadCount: 3,
    isHost: true,
  }

  const userInitials = activeUser.name
    ? activeUser.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U"

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Interactive State Toggle Bar for Demo/Testing */}
      {demoMode && (
        <div className="bg-muted/50 flex items-center gap-2 rounded-full border p-1 text-xs">
          <button
            type="button"
            onClick={() => setIsLoggedIn(false)}
            className={cn(
              "cursor-pointer rounded-full px-3 py-1 font-medium transition-all",
              !isLoggedIn
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {isRtl ? "زائر (غير مسجّل)" : "Logged Out"}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsLoggedIn(true)
              setUser(activeUser)
            }}
            className={cn(
              "cursor-pointer rounded-full px-3 py-1 font-medium transition-all",
              isLoggedIn
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {isRtl ? "مستخدم مسجّل" : "Logged In"}
          </button>
        </div>
      )}

      {/* Main Airbnb Hamburger Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={isRtl ? "القائمة الرئيسية" : "Main menu"}
            className={cn(
              "group border-border/80 bg-background focus-visible:ring-ring relative inline-flex cursor-pointer items-center gap-3 rounded-full border px-3 py-1.5 shadow-xs transition-all duration-200 select-none hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-95",
              className
            )}
          >
            {/* Hamburger Icon (3 horizontal bars inspired by Airbnb) */}
            <Menu className="text-foreground/80 group-hover:text-foreground size-4 stroke-[2.2] transition-colors" />

            {/* Avatar Pill */}
            <div className="relative flex items-center justify-center">
              {isLoggedIn ? (
                <Avatar className="border-border/50 size-7 border">
                  <AvatarImage
                    src={activeUser.avatarUrl || ""}
                    alt={activeUser.name || "User"}
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-bold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="flex size-7 items-center justify-center rounded-full bg-neutral-700 text-white shadow-inner dark:bg-neutral-600">
                  <User className="size-4 fill-white text-neutral-700 dark:text-neutral-600" />
                </div>
              )}

              {/* Notification Red Dot Badge */}
              {isLoggedIn && (activeUser.unreadCount || 0) > 0 && (
                <span className="absolute -end-0.5 -top-0.5 flex size-2.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-rose-400 opacity-75" />
                  <span className="ring-background relative inline-flex size-2.5 rounded-full bg-rose-500 ring-2" />
                </span>
              )}
            </div>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align={align}
          sideOffset={8}
          className="border-border/60 bg-popover/95 text-popover-foreground animate-in fade-in-80 zoom-in-95 w-64 rounded-2xl p-1.5 shadow-2xl backdrop-blur-xl"
        >
          {isLoggedIn ? (
            /* ================= LOGGED IN MENU ================= */
            <>
              {/* User Profile Header */}
              <DropdownMenuLabel className="p-2 font-normal">
                <div className="bg-muted/40 flex items-center gap-3 rounded-xl p-2.5">
                  <Avatar className="border-border/40 size-9 border">
                    <AvatarImage src={activeUser.avatarUrl || ""} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <p className="truncate text-sm leading-tight font-semibold">
                      {activeUser.name}
                    </p>
                    <p className="text-muted-foreground truncate text-xs leading-tight">
                      {activeUser.email}
                    </p>
                  </div>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator className="my-1" />

              {/* Primary User Actions */}
              <DropdownMenuGroup>
                <DropdownMenuItem
                  asChild
                  className="cursor-pointer rounded-xl px-3 py-2.5"
                >
                  <Link
                    href={`/${locale}/messages`}
                    className="flex w-full items-center justify-between text-sm font-medium"
                  >
                    <div className="flex items-center gap-2.5">
                      <MessageSquare className="text-muted-foreground size-4" />
                      <span>{isRtl ? "الرسائل" : "Messages"}</span>
                    </div>
                    {(activeUser.unreadCount || 0) > 0 && (
                      <Badge
                        variant="destructive"
                        className="flex size-5 items-center justify-center rounded-full p-0 text-[10px] font-bold"
                      >
                        {activeUser.unreadCount}
                      </Badge>
                    )}
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem
                  asChild
                  className="cursor-pointer rounded-xl px-3 py-2.5"
                >
                  <Link
                    href={`/${locale}/notifications`}
                    className="flex w-full items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2.5">
                      <Bell className="text-muted-foreground size-4" />
                      <span>{isRtl ? "الإشعارات" : "Notifications"}</span>
                    </div>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem
                  asChild
                  className="cursor-pointer rounded-xl px-3 py-2.5"
                >
                  <Link
                    href={`/${locale}/bookings`}
                    className="flex w-full items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2.5">
                      <Calendar className="text-muted-foreground size-4" />
                      <span>
                        {isRtl ? "الحجوزات والرحلات" : "Trips & Bookings"}
                      </span>
                    </div>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem
                  asChild
                  className="cursor-pointer rounded-xl px-3 py-2.5"
                >
                  <Link
                    href={`/${locale}/wishlists`}
                    className="flex w-full items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2.5">
                      <Heart className="text-muted-foreground size-4" />
                      <span>{isRtl ? "قوائم المفضلات" : "Wishlists"}</span>
                    </div>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator className="my-1" />

              {/* Hosting / Enterprise Section */}
              <DropdownMenuGroup>
                <DropdownMenuItem
                  asChild
                  className="cursor-pointer rounded-xl px-3 py-2.5"
                >
                  <Link
                    href={`/${locale}/host`}
                    className="flex w-full items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2.5">
                      <Home className="text-primary size-4" />
                      <span className="text-primary font-semibold">
                        {isRtl
                          ? "إضافة عقارك أو مدرستك"
                          : "Airbnb your home / school"}
                      </span>
                    </div>
                    <Sparkles className="size-3.5 text-amber-500" />
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem
                  asChild
                  className="cursor-pointer rounded-xl px-3 py-2.5"
                >
                  <Link
                    href={`/${locale}/account`}
                    className="flex w-full items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2.5">
                      <Settings className="text-muted-foreground size-4" />
                      <span>
                        {isRtl ? "إعدادات الحساب" : "Account settings"}
                      </span>
                    </div>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator className="my-1" />

              {/* Utility Section */}
              <DropdownMenuGroup>
                <DropdownMenuItem
                  asChild
                  className="cursor-pointer rounded-xl px-3 py-2.5"
                >
                  <Link
                    href={`/${locale}/help`}
                    className="flex w-full items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2.5">
                      <HelpCircle className="text-muted-foreground size-4" />
                      <span>{isRtl ? "مركز المساعدة" : "Help Center"}</span>
                    </div>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                  className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 text-sm"
                >
                  <div className="flex items-center gap-2.5">
                    {theme === "light" ? (
                      <Sun className="text-muted-foreground size-4" />
                    ) : (
                      <Moon className="text-muted-foreground size-4" />
                    )}
                    <span>{isRtl ? "المظهر" : "Appearance"}</span>
                  </div>
                  <span className="text-muted-foreground text-xs capitalize">
                    {theme}
                  </span>
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator className="my-1" />

              {/* Logout Action */}
              <DropdownMenuItem
                onClick={onLogout}
                className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer rounded-xl px-3 py-2.5 text-sm"
              >
                <div className="flex items-center gap-2.5">
                  <LogOut className="size-4 rtl:scale-x-[-1]" />
                  <span className="font-medium">
                    {isRtl ? "تسجيل الخروج" : "Log out"}
                  </span>
                </div>
              </DropdownMenuItem>
            </>
          ) : (
            /* ================= LOGGED OUT MENU ================= */
            <>
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={onSignUp}
                  className="hover:bg-muted/80 cursor-pointer rounded-xl px-3 py-2.5 text-sm font-semibold"
                >
                  <div className="flex items-center gap-2.5">
                    <UserPlus className="text-primary size-4" />
                    <span>{isRtl ? "إنشاء حساب" : "Sign up"}</span>
                  </div>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={onLogin}
                  className="hover:bg-muted/80 cursor-pointer rounded-xl px-3 py-2.5 text-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <User className="text-muted-foreground size-4" />
                    <span>{isRtl ? "تسجيل الدخول" : "Log in"}</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator className="my-1" />

              <DropdownMenuGroup>
                <DropdownMenuItem
                  asChild
                  className="cursor-pointer rounded-xl px-3 py-2.5"
                >
                  <Link
                    href={`/${locale}/host`}
                    className="flex w-full items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2.5">
                      <Home className="text-muted-foreground size-4" />
                      <span>
                        {isRtl ? "تأجير مسكنك على Airbnb" : "Airbnb your home"}
                      </span>
                    </div>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem
                  asChild
                  className="cursor-pointer rounded-xl px-3 py-2.5"
                >
                  <Link
                    href={`/${locale}/experiences`}
                    className="flex w-full items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2.5">
                      <Sparkles className="text-muted-foreground size-4" />
                      <span>
                        {isRtl ? "استضافة تجربة" : "Host an experience"}
                      </span>
                    </div>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator className="my-1" />

              <DropdownMenuGroup>
                <DropdownMenuItem
                  asChild
                  className="cursor-pointer rounded-xl px-3 py-2.5"
                >
                  <Link
                    href={`/${locale}/help`}
                    className="flex w-full items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2.5">
                      <HelpCircle className="text-muted-foreground size-4" />
                      <span>{isRtl ? "مركز المساعدة" : "Help Center"}</span>
                    </div>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem
                  asChild
                  className="cursor-pointer rounded-xl px-3 py-2.5"
                >
                  <Link
                    href={`/${locale}/language`}
                    className="flex w-full items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2.5">
                      <Globe className="text-muted-foreground size-4" />
                      <span>
                        {isRtl ? "اللغة والعملة" : "Language & region"}
                      </span>
                    </div>
                    <span className="text-muted-foreground text-xs font-semibold">
                      {isRtl ? "العربية ($)" : "EN ($)"}
                    </span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
