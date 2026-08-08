// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { getSchoolBySubdomain } from "@/lib/subdomain-actions"
import { Chatbot } from "@/components/chatbot"
import { isRTL, type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { DictionaryProvider } from "@/components/internationalization/dictionary-context"
import { ApplicationStatusBanner } from "@/components/school-marketing/admission/application-status-banner"
import { resolveSchoolDisplayName } from "@/components/template/site-header/display-name"
import { fontDmSans, fontPoppins } from "@/components/template/zenda-fonts"
import { Footer as ZendaFooter } from "@/components/template/zenda-footer/footer"
import { ZendaNav } from "@/components/template/zenda-nav/header"

// import { SiteFooter } from "@/components/school-marketing-footer";

// Tenant marketing pages depend on subdomain + DB lookup - always dynamic
export const dynamic = "force-dynamic"

interface SiteLayoutProps {
  children: React.ReactNode
  params: Promise<{ subdomain: string; lang: string }>
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subdomain: string; lang: string }>
}): Promise<Metadata> {
  const { subdomain, lang } = await params
  const isProd = process.env.NODE_ENV === "production"
  const baseUrl = isProd
    ? `https://${subdomain}.databayt.org`
    : `http://${subdomain}.localhost:3000`

  return {
    alternates: {
      canonical: `${baseUrl}/${lang}`,
    },
  }
}

export default async function SiteLayout({
  children,
  params,
}: Readonly<SiteLayoutProps>) {
  const { subdomain, lang } = await params
  const [result, dictionary] = await Promise.all([
    getSchoolBySubdomain(subdomain),
    getDictionary(lang as Locale),
  ])

  if (!result.success) {
    if (result.errorType === "db_error") {
      throw new Error("Database temporarily unavailable")
    }
    notFound()
  }

  const school = result.data

  // Resolved here rather than inside the nav: getText hits the DB, so it can't
  // live in a client component.
  const displayName = await resolveSchoolDisplayName(school, lang)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const site = (dictionary as any)?.marketing?.site
  const navLabels = site?.nav as Record<string, string> | undefined
  const footerLabels = site?.footer as Record<string, string> | undefined

  // The chrome now follows the locale. It was pinned `dir="ltr"` because the
  // vendored Webflow sheet had no RTL handling at all; scope-zenda.mjs now
  // emits a `.zenda-clone[dir="rtl"]` overlay for every directional rule, so
  // the attribute is what activates it. It has to sit on the SAME element that
  // carries `.zenda-clone`: the overlay keys off `.zenda-clone[dir="rtl"]`, and
  // the logical properties in the base sheet resolve against this element's own
  // computed direction — put the two on different elements and the stylesheet
  // and the layout engine disagree about which way the page runs.
  const dir = isRTL(lang as Locale) ? "rtl" : "ltr"

  return (
    <DictionaryProvider dictionary={dictionary}>
      {/*
        No LoadingWrapper here, deliberately. It held the page at
        `visibility: hidden` behind a full-screen "0%..100%" counter for ~2s,
        then faded it in from `scale(0.98)` over 700ms. Zenda has no such
        preloader, and the two fought: the hero's GSAP intro starts on mount, so
        it played out its whole 1.8s centred hold while still hidden, and the
        page arrived mid-split, 2% undersized and offset ~98px down the screen.
        The zenda intro IS the entrance for this block.
      */}
      <>
        <ApplicationStatusBanner schoolId={school.id} locale={lang as Locale} />
        {/*
          The zenda page shell. Deliberately NOT inside `.marketing-container`:
          zenda's chrome runs edge to edge and does its own guttering with
          `.padding-global-v2`, so the container's max-width would box it in.
          Sibling pages carry `.marketing-container` themselves instead.

          `.zenda-clone` wraps only the nav and the footer, never <main> -- the
          generated sheet carries unlayered bare-tag rules (a, h1, p, button,
          img) that beat Tailwind and would restyle every sibling page's markup.
          The shell classes are hand-ported unscoped into
          src/styles/zenda-shell.css for the same reason. `body-v2 bg-beige-home`
          are zenda's own <body> classes, which its CSS keys off for the cream
          background and the black nav links. `dir` follows the locale as of
          2026-08-08 -- see the note on `const dir` above.

          The font variables are here to pull DM Sans and Poppins onto these
          routes -- the Webflow rules ask for them by literal name, and the
          generated sheet's own @import for them is dropped at bundle time (see
          the note in components/atom/fonts.ts).
        */}
        <div data-slot="site-layout">
          <div
            className={`page-wrapper ${fontDmSans.variable} ${fontPoppins.variable}`}
          >
            <div className="zenda-clone" dir={dir}>
              <div className="body-v2 bg-beige-home">
                <ZendaNav
                  locale={lang}
                  displayName={displayName}
                  subdomain={school.domain}
                  logoUrl={school.logoUrl}
                  navLabels={navLabels}
                />
              </div>
            </div>
            <main data-slot="main-content" role="main" className="main-wrapper">
              {children}
            </main>
            <div className="zenda-footer-slot zenda-clone" dir={dir}>
              <div className="body-v2 bg-beige-home">
                <ZendaFooter
                  displayName={displayName}
                  locale={lang}
                  footerLabels={footerLabels}
                  navLabels={navLabels}
                />
              </div>
            </div>
          </div>
          <Chatbot
            lang={lang as Locale}
            promptType="schoolSite"
            subdomain={subdomain}
          />
        </div>
      </>
    </DictionaryProvider>
  )
}
