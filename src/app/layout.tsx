// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"
import { cookies, headers } from "next/headers"

import { fontRubik } from "@/components/atom/fonts"
import {
  i18n,
  isRTL,
  type Locale,
} from "@/components/internationalization/config"

import "./globals.css"
import "@/styles/zenda-clone.css"
import "@/styles/apple-clone.css"

export const metadata: Metadata = {
  title: "Hogwarts",
  description: "School automation",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const headersList = await headers()
  const cookieStore = await cookies()
  const detected =
    headersList.get("x-locale") || cookieStore.get("NEXT_LOCALE")?.value || ""
  const locale: Locale = (i18n.locales as readonly string[]).includes(detected)
    ? (detected as Locale)
    : i18n.defaultLocale
  const dir = isRTL(locale) ? "rtl" : "ltr"

  // The corrective inline script is rendered server-side, so the locale list
  // and RTL set are interpolated from config — single source of truth.
  const localeAlternation = i18n.locales.join("|")
  const rtlLocales = JSON.stringify(i18n.locales.filter((l) => isRTL(l)))

  return (
    <html
      lang={locale}
      dir={dir}
      className={fontRubik.variable}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var m=window.location.pathname.match(/^\\/(${localeAlternation})/);var l=m?m[1]:'${i18n.defaultLocale}';document.documentElement.lang=l;document.documentElement.dir=${rtlLocales}.indexOf(l)>-1?'rtl':'ltr'})()`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
