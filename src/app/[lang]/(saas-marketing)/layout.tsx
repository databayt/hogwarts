import { Suspense } from "react"

import { Chatbot } from "@/components/chatbot"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { AccessCheck } from "@/components/saas-marketing/access-check"
import { SiteFooter } from "@/components/template/marketing-header/site-footer"
import { SiteHeader } from "@/components/template/marketing-header/site-header"

interface MarketingLayoutProps {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}

export default async function MarketingLayout({
  children,
  params,
}: MarketingLayoutProps) {
  const { lang } = await params
  const dictionary = await getDictionary(lang as Locale)

  return (
    <div className="marketing-container flex min-h-screen flex-col">
      <Suspense fallback={null}>
        <AccessCheck />
      </Suspense>
      <SiteHeader dictionary={dictionary} locale={lang} />
      <main className="flex-1">{children}</main>
      <SiteFooter dictionary={dictionary} locale={lang} />
      <Chatbot lang={lang as Locale} promptType="saasMarketing" />
    </div>
  )
}
