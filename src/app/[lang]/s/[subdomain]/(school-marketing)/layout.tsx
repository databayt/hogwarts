// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { getSchoolBySubdomain } from "@/lib/subdomain-actions"
import { Chatbot } from "@/components/chatbot"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { DictionaryProvider } from "@/components/internationalization/dictionary-context"
import { LoadingWrapper } from "@/components/marketing/loading"
import { ApplicationStatusBanner } from "@/components/school-marketing/admission/application-status-banner"
import SiteHeader from "@/components/template/site-header/content"

// import { SiteFooter } from "@/components/school-marketing-footer";

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

  return (
    <DictionaryProvider dictionary={dictionary}>
      <LoadingWrapper>
        <ApplicationStatusBanner schoolId={school.id} locale={lang as Locale} />
        <div data-slot="site-layout" className="marketing-container">
          <SiteHeader school={school} locale={lang} />
          <main data-slot="main-content" role="main">
            {children}
          </main>
          {/* <SiteFooter /> */}
          <Chatbot
            lang={lang as Locale}
            promptType="schoolSite"
            subdomain={subdomain}
          />
        </div>
      </LoadingWrapper>
    </DictionaryProvider>
  )
}
