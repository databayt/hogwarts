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
  const heroDict = dictionary?.marketing?.hero || {
    title: "Automate Education,",
    subtitle:
      "Educational management system streamlining operations for students, educators, and school leaders. Transform your institution's efficiency today.",
    appointment: "Get Started",
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

  return (
    <section id="hero" className="bg-background min-h-[calc(100vh-3.5rem)]">
      <div className="grid min-h-[calc(100vh-3.5rem)] grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-16">
        {/* Left: Content */}
        <div className="space-y-6 py-12 lg:py-0">
          <h1 className="font-heading text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl xl:text-8xl">
            <span className="block">Automate</span>
            <span className="block">the boring,</span>
            <span className="block">elevate the</span>
            <span className="block">wonder.</span>
          </h1>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={`/${lang || "en"}/onboarding`}
              className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}
            >
              {heroDict.appointment}
            </Link>
            <Link
              href={getDemoUrl()}
              target="_blank"
              rel="noreferrer"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "w-full sm:w-auto"
              )}
            >
              Live Demo
            </Link>
          </div>
        </div>

        {/* Right: Illustration - hidden on mobile/tablet for performance */}
        <div className="hidden items-center justify-center lg:flex lg:justify-end">
          <HeroIllustration />
        </div>
      </div>
    </section>
  )
}

export default Hero
