import React from "react"
import Link from "next/link"

import { env } from "@/env.mjs"
import { cn } from "@/lib/utils"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { buttonVariants } from "../ui/button"
import { HeroIllustration } from "./hero-illustration"

interface HeroProps {
  dictionary?: Dictionary
  lang?: Locale
}

const Hero = ({ dictionary, lang }: HeroProps) => {
  const isRTL = lang === "ar"
  const heroDict = dictionary?.marketing?.hero || {
    title: "Automate\nthe boring,\nelevate the\nwonder.",
    subtitle:
      "Educational management system streamlining operations for students, educators, and school leaders. Transform your institution's efficiency today.",
    appointment: "Get Started",
    liveDemo: "Live Demo",
    services: "GitHub",
  }

  // Construct demo URL based on environment
  const getDemoUrl = () => {
    // If demo URL is explicitly configured, use it
    if (env.NEXT_PUBLIC_DEMO_URL) {
      return `${env.NEXT_PUBLIC_DEMO_URL}/${lang || "en"}`
    }

    // Fallback to constructing from root domain for local development
    const rootDomain = env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000"
    const isLocal = rootDomain.includes("localhost")
    const protocol = isLocal ? "http" : "https"

    if (isLocal) {
      // For localhost, keep the current behavior
      return `${protocol}://demo.${rootDomain}/${lang || "en"}`
    }

    // For production domains, extract base domain (e.g., ed.databayt.org -> databayt.org)
    const parts = rootDomain.split(".")
    const baseDomain =
      parts.length >= 2 ? parts.slice(-2).join(".") : rootDomain

    return `${protocol}://demo.${baseDomain}/${lang || "en"}`
  }

  // Split title by newlines to render each line as a block
  const titleLines = (heroDict.title || "").split("\n")

  return (
    <section id="hero" className="bg-background" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center gap-6 py-8 md:gap-8 lg:flex-row lg:gap-16 lg:py-0">
        {/* Illustration - shown first on mobile (column), second on desktop (row) */}
        <div className="flex items-center justify-center lg:order-2 lg:flex-1 lg:justify-end">
          <HeroIllustration />
        </div>

        {/* Content */}
        <div className="flex flex-col items-start space-y-6 text-start lg:order-1 lg:flex-1">
          <h1 className="font-heading text-5xl font-black tracking-tight sm:text-6xl md:text-7xl lg:text-7xl xl:text-8xl">
            {titleLines.map((line, index) => (
              <span key={index} className="block">
                {line}
              </span>
            ))}
          </h1>

          <div className="flex flex-row gap-3">
            <Link
              href={`/${lang || "en"}/onboarding`}
              className={cn(buttonVariants({ size: "lg" }))}
            >
              {heroDict.appointment}
            </Link>
            <Link
              href={getDemoUrl()}
              target="_blank"
              rel="noreferrer"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              {heroDict.liveDemo || "Live Demo"}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
