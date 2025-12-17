"use client"

import { useMemo } from "react"
import Link from "next/link"
import { useParams, usePathname } from "next/navigation"
import { Bell, Mail } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { GenericCommandMenu } from "@/components/atom/generic-command-menu"
import { platformSearchConfig } from "@/components/atom/generic-command-menu/platform-config"
import type { Role } from "@/components/atom/generic-command-menu/types"
import { useCurrentRole } from "@/components/auth/use-current-role"
import { UserButton } from "@/components/auth/user-button"
import { LanguageSwitcher } from "@/components/internationalization/language-switcher"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import { useLocale } from "@/components/internationalization/use-locale"
import { useBreadcrumbs } from "@/components/operator/hooks/use-breadcrumbs"
import type { School } from "@/components/site/types"
import { ModeSwitcher } from "@/components/template/marketing-header/mode-switcher"
import { MobileNav } from "@/components/template/mobile-nav"
import {
  platformNav,
  type Role as PlatformRole,
} from "@/components/template/platform-sidebar/config"

import ImpersonationBanner from "../../operator/impersonation-banner"

interface PlatformHeaderProps {
  school?: School
  lang?: string
}

export default function PlatformHeader({
  school,
  lang,
}: PlatformHeaderProps = {}) {
  const breadcrumbItems = useBreadcrumbs()
  const { dictionary } = useDictionary()
  const { isRTL, locale } = useLocale()
  const role = useCurrentRole() as Role | undefined
  const pathname = usePathname()
  const params = useParams()

  // Prepend locale to href (middleware handles subdomain rewriting)
  const messagesUrl = `/${locale}/messages`
  const notificationsUrl = `/${locale}/notifications`

  // Filter platform nav items by role for mobile menu
  const mobileNavItems = useMemo(() => {
    return platformNav
      .filter((item) => !role || item.roles.includes(role as PlatformRole))
      .map((item) => ({
        href: item.href,
        label: item.title,
      }))
  }, [role])

  return (
    <div className="bg-background sticky top-0 z-40 -mx-2">
      <header className="mx-2 flex h-12 shrink-0 items-center gap-2 border-b">
        <div className="flex items-center gap-2">
          {/* Desktop: Sidebar trigger */}
          <SidebarTrigger
            className={cn(
              "hidden size-7 lg:flex",
              isRTL ? "-mr-1.5" : "-ml-1.5"
            )}
          />
          {/* Mobile: Popover-based menu */}
          <MobileNav
            items={mobileNavItems}
            className="flex lg:hidden"
            dictionary={dictionary ?? undefined}
            locale={locale}
          />
          <div className="hidden items-center md:flex">
            {breadcrumbItems.length > 0 && (
              <Breadcrumb>
                <BreadcrumbList
                  className={`flex items-center ${isRTL ? "space-x-reverse" : ""} space-x-1`}
                >
                  {breadcrumbItems.map((item, index) => {
                    // Translate breadcrumb title
                    const titleKey = item.title.toLowerCase()
                    const breadcrumbDict = dictionary?.platform?.breadcrumb as
                      | Record<string, string>
                      | undefined
                    const translatedTitle =
                      breadcrumbDict?.[titleKey] || item.title

                    return (
                      <div key={item.title} className="flex items-center">
                        {index !== breadcrumbItems.length - 1 && (
                          <BreadcrumbItem className="flex items-center">
                            <BreadcrumbLink
                              href={item.link}
                              className="flex items-center"
                            >
                              {translatedTitle}
                            </BreadcrumbLink>
                          </BreadcrumbItem>
                        )}
                        {index < breadcrumbItems.length - 1 && (
                          <BreadcrumbSeparator
                            className={`hidden md:block ${isRTL ? "mr-2" : "ml-2"}`}
                          />
                        )}
                        {index === breadcrumbItems.length - 1 && (
                          <BreadcrumbPage className="flex items-center">
                            {translatedTitle}
                          </BreadcrumbPage>
                        )}
                      </div>
                    )
                  })}
                </BreadcrumbList>
              </Breadcrumb>
            )}
          </div>
        </div>
        <div
          className={`flex items-center gap-1.5 ${isRTL ? "mr-auto" : "ml-auto"}`}
        >
          <GenericCommandMenu
            config={platformSearchConfig}
            context={{
              currentRole: role,
              currentPath: pathname,
              schoolId: school?.id,
            }}
            variant="icon"
          />
          <LanguageSwitcher variant="toggle" />
          <ModeSwitcher />
          <Button
            variant="link"
            size="icon"
            className="size-7 cursor-pointer transition-opacity hover:opacity-70"
            asChild
          >
            <Link href={notificationsUrl}>
              <Bell className="h-4 w-4" />
              <span className="sr-only">Notifications</span>
            </Link>
          </Button>
          <Button
            variant="link"
            size="icon"
            className="size-7 cursor-pointer transition-opacity hover:opacity-70"
            asChild
          >
            <Link href={messagesUrl}>
              <Mail className="h-4 w-4" />
              <span className="sr-only">Messages</span>
            </Link>
          </Button>
          <UserButton
            variant="platform"
            subdomain={params?.subdomain as string}
          />
        </div>
      </header>
      <ImpersonationBanner />
    </div>
  )
}
