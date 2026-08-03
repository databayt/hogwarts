// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { ReportIssue } from "@/components/report-issue"

import { Academics } from "./academics"
import { AdmissionsCTA } from "./admissions-cta"
import { Faculty } from "./faculty"
import FAQs from "./faqs"
import Footer from "./footer"
import { Hero } from "./hero"
import { Life } from "./life"
import { NewComers } from "./new-comers"
import Newsletter from "./newsletter"
import { PhoneMockup } from "./phone-mockup"
import { Stages } from "./stages"
import { Stats } from "./stats"
import { Testimonials } from "./testimonials"
import Trust from "./trust"
import { Why } from "./why"

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

/**
 * The public homepage every tenant school gets on its subdomain.
 *
 * Order is the argument a visiting parent walks through: what this school is
 * (Hero) -> what it teaches (Trust) -> whether it is any good (Stats) -> where
 * my child would go (Stages) -> why here and not the school down the road (Why)
 * -> what daily life looks like (PhoneMockup, Life, Academics) -> who teaches
 * (Faculty) -> who else trusted it (Testimonials) -> how to apply (AdmissionsCTA).
 *
 * Colored bands alternate deliberately: Trust (sand) and Testimonials (cool)
 * and AdmissionsCTA (ink) break the page into three acts. Adjacent sections
 * must not both carry a band, or the page reads as stripes.
 */
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
        schoolName={school.name}
      />
      <Trust />
      <Stats />
      <Stages lang={lang} dictionary={dictionary} />
      <Why dictionary={dictionary} />
      <PhoneMockup dictionary={dictionary} lang={lang} />
      <Life dictionary={dictionary} />
      <Academics />
      <Faculty />
      <Testimonials />
      <AdmissionsCTA lang={lang} dictionary={dictionary} />
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
