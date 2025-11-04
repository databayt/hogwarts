import { siteConfig } from "./config"
import { cn } from '@/lib/utils'
import Link from 'next/link'
import React from 'react'
import { buttonVariants } from '../ui/button'
import type { Dictionary } from '@/components/internationalization/dictionaries'
import type { Locale } from '@/components/internationalization/config'

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
              href="https://demo.databayt.org"
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
