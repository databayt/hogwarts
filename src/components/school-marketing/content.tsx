// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { ReportIssue } from "@/components/report-issue"

import { CTA } from "./admission-process"
import { Core } from "./core"
import EventCard from "./event"
import { Faculty } from "./faculty"
import FAQs from "./faqs"
import { Features } from "./features"
import Footer from "./footer"
import { Hero } from "./hero"
import { Houses } from "./houses"
import LetsWorkTogether from "./lets-work-together"
import LogoCloud from "./logo-cloud"
import { NewComers } from "./new-comers"
import Newsletter from "./newsletter"
import { SpecialOffers } from "./offer"
import { PhoneMockup } from "./phone-mockup"
import { BackgroundGradientAnimationDemo } from "./ready"
import { Testimonials } from "./testimonials"

interface School {
  id: string
  name: string
  domain: string
  logoUrl?: string | null
  address?: string | null
  phoneNumber?: string | null
  email?: string | null
  website?: string | null
  timezone?: string
  planType?: string
  maxStudents?: number
  maxTeachers?: number
  isActive?: boolean
  createdAt?: Date
  updatedAt?: Date
  branding?: {
    heroImageUrl?: string | null
  } | null
}

interface SiteProps {
  school: School // Required - we always pass school data now
  dictionary: Dictionary
  lang: Locale
  subdomain?: string
}

export default function SiteContent({
  school,
  dictionary,
  lang,
  subdomain,
}: SiteProps) {
  const subdomainValue = subdomain || school.domain

  return (
    <div>
      <Hero
        lang={lang}
        subdomain={subdomainValue}
        dictionary={dictionary}
        heroImageUrl={school.branding?.heroImageUrl}
        logoUrl={school.logoUrl}
      />
      <Houses />
      <Features />
      <PhoneMockup dictionary={dictionary} lang={lang} />
      <Core />
      <Faculty />
      <Testimonials />
      <CTA />
      <SpecialOffers />
      <LogoCloud />
      <EventCard />
      <LetsWorkTogether />
      <BackgroundGradientAnimationDemo lang={lang} subdomain={subdomainValue} />
      <Newsletter />
      <FAQs />
      <NewComers lang={lang} subdomain={subdomainValue} />
      <div className="text-muted-foreground py-4 text-sm">
        <ReportIssue />
      </div>
      <Footer />
    </div>
  )
}
