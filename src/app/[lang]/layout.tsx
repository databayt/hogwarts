// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

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
import { DirectionProvider } from "@/components/providers/direction-provider"
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
      "A comprehensive school management school-dashboard",
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

  // Skip auth() during `next build` page-data collection. Each call to
  // auth() hits the DB; multiplied across every statically-collected route
  // it has tipped the build past Vercel's 45-min hobby ceiling. At runtime
  // (production phase or dev), call normally — pages render with a real
  // session. The try-catch still guards SSR contexts where cookies()/
  // headers() aren't available.
  let session = null
  if (process.env.NEXT_PHASE !== "phase-production-build") {
    try {
      session = await auth()
    } catch (error) {
      console.error("[LAYOUT] auth() failed:", error)
      // Continue with null session - page may still work for public routes
    }
  }

  const config = localeConfig[lang as Locale]
  const isRTL = config.dir === "rtl"

  // Check if we're in a subdomain route
  const headersList = await headers()
  const subdomain = headersList.get("x-subdomain")
  const isSubdomain = !!subdomain

  // Use dynamic font for subdomain pages, hardcoded fonts for saas-marketing/lab pages
  const fontClass = isSubdomain
    ? "font-sans"
    : isRTL
      ? rubik.className
      : GeistSans.className

  return (
    <DirectionProvider direction={config.dir} lang={lang}>
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
    </DirectionProvider>
  )
}

// Generate static params for all supported locales
export function generateStaticParams() {
  return i18n.locales.map((lang) => ({ lang }))
}
