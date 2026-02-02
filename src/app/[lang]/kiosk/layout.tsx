/**
 * Kiosk Layout
 *
 * Fullscreen layout for self-service attendance kiosks.
 * No navigation, optimized for touch screens.
 */
import type { ReactNode } from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Self-Service Kiosk",
  description: "Student check-in and check-out kiosk",
}

interface KioskLayoutProps {
  children: ReactNode
  params: Promise<{ lang: string }>
}

export default async function KioskLayout({
  children,
  params,
}: KioskLayoutProps) {
  const { lang } = await params
  const isRTL = lang === "ar"

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="bg-background fixed inset-0 flex items-center justify-center overflow-hidden"
    >
      {/* Fullscreen container with no padding/margins */}
      <main className="h-full w-full">{children}</main>
    </div>
  )
}
