// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// 1 hour — school marketing pages change infrequently

import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { getSchoolBySubdomain } from "@/lib/subdomain-actions"
import { isRTL, type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
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
  // The layout already loaded this; `getDictionary` is wrapped in React
  // `cache()`, so the second call is free rather than a second merge.
  const [result, dictionary] = await Promise.all([
    getSchoolBySubdomain(subdomain),
    getDictionary(lang),
  ])

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
        stylesheet to this subtree only, and `dir` follows the locale -- the
        attribute activates the `.zenda-clone[dir="rtl"]` overlay that
        scope-zenda.mjs emits, and must stay on the same element as the scope
        class so the sheet and the layout engine agree on reading direction.

        <ZendaRootScale/> restores zenda's fluid root font size on <html>, which
        cannot be class-scoped -- hence rendering it from the page, so it applies
        here and not on the sibling marketing pages.

        <HeroIntro/> renders nothing -- it drives the GSAP timeline that reveals
        the page and animates the nav's logo and links alongside the hero.
      */}
      <ZendaRootScale />
      {/*
        Hold the page invisible until the intro has staged its first frame.
        Without it the browser paints the settled layout first and the hero
        visibly snaps back to the centred splash a beat later -- measured at
        ~300ms of wrong-frame, not the single frame it might sound like.

        The reference does this with `style={{opacity: 0}}` on its own
        `.page-wrapper`. Ours lives in the shared layout, so the gate is a rule
        rendered from the page instead: it exists on this route only, and the
        sibling marketing pages -- which have no HeroIntro to turn them back on
        -- never see it. Server-rendered, so it applies from the very first
        paint. <HeroIntro/> clears it, with a failsafe timer behind that.
      */}
      <style>{`.page-wrapper{opacity:0}`}</style>
      <noscript>
        <style>{`.page-wrapper{opacity:1!important}`}</style>
      </noscript>
      <div className="zenda-clone" dir={isRTL(lang) ? "rtl" : "ltr"}>
        <div className="body-v2 bg-beige-home">
          <HomeContent lang={lang} dictionary={dictionary} />
        </div>
        <HeroIntro />
      </div>
    </div>
  )
}
