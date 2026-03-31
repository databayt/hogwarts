import { Suspense } from "react"
import type { Metadata } from "next"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import {
  WhatsAppContent,
  WhatsAppContentSkeleton,
} from "@/components/school-dashboard/whatsapp/content"

interface WhatsAppPageProps {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({
  params,
}: WhatsAppPageProps): Promise<Metadata> {
  const { lang } = await params
  const dict = await getDictionary(lang)
  return {
    title: dict?.whatsapp?.title || "WhatsApp",
    description:
      dict?.whatsapp?.description ||
      "WhatsApp integration for school communication",
  }
}

export default async function WhatsAppPage({ params }: WhatsAppPageProps) {
  const { lang } = await params
  return (
    <Suspense fallback={<WhatsAppContentSkeleton />}>
      <WhatsAppContent locale={lang} />
    </Suspense>
  )
}
