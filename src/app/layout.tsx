import type { Metadata } from "next"

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
    <html suppressHydrationWarning>
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
