"use client"

import { useParams, usePathname } from "next/navigation"

import type { Locale } from "./config"
import { i18n, localeConfig } from "./config"

export function useSwitchLocaleHref() {
  const pathname = usePathname()

  return function switchLocaleHref(targetLocale: Locale): string {
    // Extract current locale from pathname
    const currentLocale = i18n.locales.find(
      (locale) =>
        pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    )

    if (!currentLocale) {
      // If no current locale detected, prepend target locale
      return `/${targetLocale}${pathname}`
    }

    // Replace current locale with target locale
    const newPathname = pathname.replace(
      `/${currentLocale}`,
      `/${targetLocale}`
    )
    return newPathname
  }
}

export function useLocale() {
  const params = useParams()
  const locale = (params?.lang as Locale) || i18n.defaultLocale

  return {
    locale,
    isRTL: localeConfig[locale]?.dir === "rtl",
    localeConfig: localeConfig[locale],
  }
}
