import { siteConfig } from "./config"
import { cn } from '@/lib/utils'
import Link from 'next/link'
import React from 'react'
import { buttonVariants } from '../ui/button'
import type { Dictionary } from '@/components/internationalization/dictionaries'
import type { Locale } from '@/components/internationalization/config'
import { env } from '@/env.mjs'
import { HeroIllustration } from './hero-illustration'

interface HeroProps {
  dictionary?: Dictionary
  lang?: Locale
}

const Hero = ({ dictionary, lang }: HeroProps) => {
  const heroDict = dictionary?.marketing?.hero || {
    title: "Automate Education,",
    subtitle: "Educational management system streamlining operations for students, educators, and school leaders. Transform your institution's efficiency today.",
    badge: "700+ School automated",
    appointment: "Get Started",
    services: "GitHub"
  }

  // Construct demo URL based on environment
  const getDemoUrl = () => {
    // If demo URL is explicitly configured, use it
    if (env.NEXT_PUBLIC_DEMO_URL) {
      return `${env.NEXT_PUBLIC_DEMO_URL}/${lang || 'en'}`
    }

    // Fallback to constructing from root domain for local development
    const rootDomain = env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000'
    const isLocal = rootDomain.includes('localhost')
    const protocol = isLocal ? 'http' : 'https'

    if (isLocal) {
      // For localhost, keep the current behavior
      return `${protocol}://demo.${rootDomain}/${lang || 'en'}`
    }

    // For production domains, extract base domain (e.g., ed.databayt.org -> databayt.org)
    const parts = rootDomain.split('.')
    const baseDomain = parts.length >= 2 ? parts.slice(-2).join('.') : rootDomain

    return `${protocol}://demo.${baseDomain}/${lang || 'en'}`
  }

  return (
    <section id="hero" className="min-h-[calc(100vh-3.5rem)] bg-background">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center min-h-[calc(100vh-3.5rem)]">
        {/* Left: Content */}
        <div className="space-y-6 py-12 lg:py-0">
          <Link
            href={siteConfig.links.twitter}
            className="rounded-2xl bg-muted px-4 py-1.5 inline-block hover:bg-muted/80 transition-colors"
            target="_blank"
          >
            <small>{heroDict.badge || "700+ School automated"}</small>
          </Link>

          <h1 className="font-heading font-extrabold text-4xl sm:text-5xl lg:text-6xl xl:text-7xl tracking-tight">
            <span className="block">Automate Education,</span>
            <span className="block">elevate the wonder.</span>
          </h1>

          <p className="text-lg lg:text-xl text-muted-foreground max-w-xl">
            {heroDict.subtitle}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Link
              href={`/${lang || 'en'}/onboarding`}
              className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}
            >
              {heroDict.appointment}
            </Link>
            <Link
              href={getDemoUrl()}
              target="_blank"
              rel="noreferrer"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full sm:w-auto")}
            >
              Live Demo
            </Link>
          </div>
        </div>

        {/* Right: Illustration - hidden on mobile/tablet for performance */}
        <div className="hidden lg:flex justify-center lg:justify-end items-center">
          <HeroIllustration />
        </div>
      </div>
    </section>
  )
}

export default Hero
