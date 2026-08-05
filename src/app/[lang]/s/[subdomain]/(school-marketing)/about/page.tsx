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
import { AboutContent } from "@/components/school-marketing/zenda-about/content"
import { ZendaRootScale } from "@/components/school-marketing/zenda-home/root-scale"

// Inert in practice: the layout above exports `dynamic = "force-dynamic"`,
// which forces this whole subtree dynamic. Kept so the intent survives if that
// ever changes.
export const revalidate = 3600

interface AboutProps {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({
  params,
}: AboutProps): Promise<Metadata> {
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

export default async function About({ params }: AboutProps) {
  const { subdomain } = await params
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
        The zenda about-us page, copied verbatim (see zenda-about/). Same shell
        as the homepage clone: `.zenda-clone` scopes the Webflow stylesheet to
        this subtree; dir="ltr" because that CSS has no RTL handling, so /ar
        renders the same left-to-right page for now.

        <ZendaRootScale/> restores zenda's fluid root font size on <html> for
        this route only -- the rem-based type ladder resolves against the
        document root, which cannot be class-scoped.

        `about-page` is the reference's page modifier (beige #f4f2ec). It nests
        INSIDE `.body-v2.bg-beige-home` rather than sharing its div: on the same
        element `.body-v2.bg-beige-home` outspecifies `.about-page` and paints
        #f5f4ee -- nested, it layers #f4f2ec over, exactly like the reference
        (body #f5f4ee behind, about-page wrapper #f4f2ec in front).

        No HeroIntro / opacity gate here -- the about page has no entrance
        timeline, its sections animate on scroll instead.
      */}
      <ZendaRootScale />
      <div className="zenda-clone" dir="ltr">
        <div className="body-v2 bg-beige-home">
          <div className="about-page">
            <AboutContent />
          </div>
        </div>
      </div>
    </div>
  )
}
