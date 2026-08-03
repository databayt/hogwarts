// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// 1 hour — school marketing pages change infrequently

import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { getSchoolBySubdomain } from "@/lib/subdomain-actions"
import { type Locale } from "@/components/internationalization/config"
import {
  generateDefaultMetadata,
  generateSchoolMetadata,
} from "@/components/school-marketing/metadata"
import { getCurrentDomain } from "@/components/school-marketing/utils"
import { HomeContent } from "@/components/school-marketing/zenda-home/content"
import { HeroIntro } from "@/components/school-marketing/zenda-home/hero-intro"
import { ZendaRootScale } from "@/components/school-marketing/zenda-home/root-scale"

// Inert in practice: the layout above exports `dynamic = "force-dynamic"`,
// which forces this whole subtree dynamic. Kept so the intent survives if that
// ever changes.
export const revalidate = 3600

interface SiteProps {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({
  params,
}: SiteProps): Promise<Metadata> {
  const { subdomain, lang } = await params
  const result = await getSchoolBySubdomain(subdomain)
  const { rootDomain } = await getCurrentDomain()

  if (!result.success || !result.data) {
    return generateDefaultMetadata(rootDomain)
  }

  return generateSchoolMetadata({
    school: result.data,
    subdomain,
    rootDomain,
    locale: lang,
  })
}

export default async function Site({ params }: SiteProps) {
  const { lang, subdomain } = await params
  const result = await getSchoolBySubdomain(subdomain)

  if (!result.success || !result.data) {
    notFound()
  }

  const school = result.data

  return (
    <div
      className="school-content"
      data-school-id={school.id}
      data-subdomain={subdomain}
    >
      {/*
        The zenda homepage, copied verbatim. `.zenda-clone` scopes the Webflow
        stylesheet to this subtree only; dir="ltr" because that CSS has no RTL
        handling, so /ar renders the same left-to-right page for now.

        <ZendaRootScale/> restores zenda's fluid root font size on <html>, which
        cannot be class-scoped -- hence rendering it from the page, so it applies
        here and not on the sibling marketing pages.

        <HeroIntro/> renders nothing -- it drives the GSAP timeline that reveals
        the page and animates the nav's logo and links alongside the hero.
      */}
      <ZendaRootScale />
      <div className="zenda-clone" dir="ltr">
        <div className="body-v2 bg-beige-home">
          <HomeContent lang={lang} />
        </div>
        <HeroIntro />
      </div>
    </div>
  )
}
