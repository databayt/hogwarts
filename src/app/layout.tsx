// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"
import { cookies, headers } from "next/headers"

import { fontRubik } from "@/components/atom/fonts"

import "./globals.css"

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
  const locale =
    headersList.get("x-locale") || cookieStore.get("NEXT_LOCALE")?.value || "ar"
  const dir = locale === "ar" ? "rtl" : "ltr"

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
            __html: `(function(){var m=window.location.pathname.match(/^\\/(en|ar)/);var l=m?m[1]:'ar';document.documentElement.lang=l;document.documentElement.dir=l==='ar'?'rtl':'ltr'})()`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
