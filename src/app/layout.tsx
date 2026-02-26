// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"

import { fontRubik } from "@/components/atom/fonts"

import "./globals.css"

export const metadata: Metadata = {
  title: "Hogwarts",
  description: "School automation",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
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
