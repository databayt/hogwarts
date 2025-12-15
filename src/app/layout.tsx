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
      <body>{children}</body>
    </html>
  )
}
