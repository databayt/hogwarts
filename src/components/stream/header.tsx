"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  LogIn,
  Star,
  User,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useDictionary } from "@/components/internationalization/use-dictionary"

interface NavItem {
  href: string
  labelKey: string
  icon: React.ReactNode
  requiresAuth?: boolean
  requiresAdmin?: boolean
}

interface Props {
  lang: string
  user: {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    role: string
  } | null
}

export function StreamHeader({ lang, user }: Props) {
  const { dictionary } = useDictionary()
  const pathname = usePathname()

  const isAdmin =
    user?.role === "ADMIN" ||
    user?.role === "TEACHER" ||
    user?.role === "DEVELOPER"

  const navItems: NavItem[] = [
    {
      href: `/${lang}/stream`,
      labelKey: "home",
      icon: <GraduationCap className="size-4" />,
    },
    {
      href: `/${lang}/stream/courses`,
      labelKey: "courses",
      icon: <BookOpen className="size-4" />,
    },
    {
      href: `/${lang}/stream/dashboard`,
      labelKey: "favorite",
      icon: <Star className="size-4" />,
      requiresAuth: true,
    },
    {
      href: `/${lang}/stream/admin`,
      labelKey: "dashboard",
      icon: <LayoutDashboard className="size-4" />,
      requiresAuth: true,
      requiresAdmin: true,
    },
  ]

  const filteredNavItems = navItems.filter((item) => {
    if (item.requiresAuth && !user) return false
    if (item.requiresAdmin && !isAdmin) return false
    return true
  })

  const isActive = (href: string) => {
    if (href === `/${lang}/stream`) {
      return pathname === href
    }
    return pathname?.startsWith(href)
  }

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="container flex h-14 items-center">
        {/* Logo */}
        <Link
          href={`/${lang}/stream`}
          className="flex items-center font-semibold"
        >
          <GraduationCap className="size-6" />
        </Link>

        {/* Navigation */}
        <nav className="mx-6 flex flex-1 items-center gap-1">
          {filteredNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive(item.href)
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {item.icon}
              <span className="hidden md:inline-block">
                {dictionary?.stream?.header?.[
                  item.labelKey as keyof typeof dictionary.stream.header
                ] ?? item.labelKey}
              </span>
            </Link>
          ))}
        </nav>

        {/* User Menu */}
        <div className="flex items-center gap-2">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="focus:ring-ring flex items-center gap-2 rounded-full focus:ring-2 focus:ring-offset-2 focus:outline-none">
                  <Avatar className="size-8">
                    <AvatarImage src={user.image || undefined} />
                    <AvatarFallback>
                      {user.name?.charAt(0) || user.email?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    {user.name && <p className="font-medium">{user.name}</p>}
                    {user.email && (
                      <p className="text-muted-foreground w-[200px] truncate text-sm">
                        {user.email}
                      </p>
                    )}
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`/${lang}/stream/dashboard`}>
                    <Star className="me-2 size-4" />
                    {dictionary?.stream?.header?.favorite ?? "Favorite"}
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href={`/${lang}/stream/admin`}>
                      <LayoutDashboard className="me-2 size-4" />
                      {dictionary?.stream?.header?.dashboard ?? "Dashboard"}
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`/${lang}/profile`}>
                    <User className="me-2 size-4" />
                    {dictionary?.stream?.header?.profile ?? "Profile"}
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              href={`/${lang}/auth/login`}
              className={buttonVariants({ variant: "default", size: "sm" })}
            >
              <LogIn className="size-4" />
              <span className="hidden sm:inline-block">
                {dictionary?.stream?.header?.signIn ?? "Sign In"}
              </span>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
