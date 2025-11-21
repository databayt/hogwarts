import { siteConfig } from "./config"
import { cn } from '@/lib/utils'
import Link from 'next/link'
import React from 'react'
import { buttonVariants } from '../ui/button'
import type { Dictionary } from '@/components/internationalization/dictionaries'
import type { Locale } from '@/components/internationalization/config'
import { env } from '@/env.mjs'

interface HeroProps {
  dictionary?: Dictionary
  lang?: Locale
}

const Hero = ({ dictionary, lang }: HeroProps) => {
  const heroDict = dictionary?.marketing?.hero || {
    title: "Automate Education,\nelevate the curiosity.",
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
    <section id="hero" className="h-[calc(100vh-3.5rem)] flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center space-y-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <Link
            href={siteConfig.links.twitter}
            className="rounded-2xl bg-muted px-4 py-1.5"
            target="_blank"
          >
            <small>{heroDict.badge || "700+ School automated"}</small>
          </Link>
            <h1 className="font-heading font-extrabold text-3xl sm:text-5xl md:text-6xl lg:text-[90px]">
            {heroDict.title}
          </h1>
          <p className="lead max-w-[48rem]">
            {heroDict.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:space-x-4 w-full sm:w-auto px-4 sm:px-0 max-w-[300px] sm:max-w-none mx-auto pt-2">
            <Link href={`/${lang}/onboarding`} className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}>
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
      </div>
    </section>
  )
}

export default Hero
