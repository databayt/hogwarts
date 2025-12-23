import type { Metadata } from "next"
import { Rubik } from "next/font/google"
import { headers } from "next/headers"
import { auth } from "@/auth"
import { GeistSans } from "geist/font/sans"
import { SessionProvider } from "next-auth/react"
import { NuqsAdapter } from "nuqs/adapters/next/app"

import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/components/atom/theme-provider"
import {
  i18n,
  localeConfig,
  type Locale,
} from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { AnalyticsProvider } from "@/components/monitoring/analytics-provider"
import { ServiceWorkerProvider } from "@/components/providers/service-worker-provider"
import { UserThemeProvider } from "@/components/theme/theme-provider"

import "leaflet/dist/leaflet.css"

// Configure fonts - Rubik supports both Arabic and Latin scripts
const rubik = Rubik({
  subsets: ["arabic", "latin"],
  variable: "--font-rubik",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
})

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang as Locale)
  const config = localeConfig[lang as Locale]

  return {
    title: dictionary.metadata?.title || "Hogwarts - School Management System",
    description:
      dictionary.metadata?.description ||
      "A comprehensive school management platform",
    other: {
      "accept-language": lang,
    },
    alternates: {
      languages: {
        en: "/en",
        ar: "/ar",
        "x-default": "/en",
      },
    },
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params

  // Wrap auth() in try-catch to prevent layout failures during SSR
  // This can happen if cookies() or other Next.js context isn't available
  let session = null
  try {
    session = await auth()
  } catch (error) {
    console.error("[LAYOUT] auth() failed:", error)
    // Continue with null session - page may still work for public routes
  }

  const config = localeConfig[lang as Locale]
  const isRTL = config.dir === "rtl"

  // Check if we're in a subdomain route
  const headersList = await headers()
  const subdomain = headersList.get("x-subdomain")
  const isSubdomain = !!subdomain

  // Use dynamic font for subdomain pages, hardcoded fonts for marketing/lab pages
  const fontClass = isSubdomain
    ? "font-sans"
    : isRTL
      ? rubik.className
      : GeistSans.className

  return (
    <div
      className={`${fontClass} ${GeistSans.variable} ${rubik.variable} layout-container antialiased [--footer-height:calc(var(--spacing)*14)] [--header-height:calc(var(--spacing)*14)] xl:[--footer-height:calc(var(--spacing)*24)]`}
    >
      <SessionProvider session={session}>
        <NuqsAdapter>
          <ThemeProvider>
            <UserThemeProvider>
              {children}
              <Toaster />
              <AnalyticsProvider />
              <ServiceWorkerProvider />
            </UserThemeProvider>
          </ThemeProvider>
        </NuqsAdapter>
      </SessionProvider>
    </div>
  )
}

// Generate static params for all supported locales
export function generateStaticParams() {
  return i18n.locales.map((lang) => ({ lang }))
}
