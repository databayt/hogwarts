// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Suspense } from "react"
import type { Metadata } from "next"

import { type Locale } from "@/components/internationalization/config"
import { getMessagingDictionary } from "@/components/internationalization/dictionaries"
import {
  MessagingContent,
  MessagingContentSkeleton,
} from "@/components/school-dashboard/messaging/content"

interface MessagesPageProps {
  params: Promise<{
    lang: Locale
    subdomain: string
  }>
  searchParams: Promise<{
    conversation?: string
  }>
}

export async function generateMetadata({
  params,
}: MessagesPageProps): Promise<Metadata> {
  const { lang } = await params
  const dict = await getMessagingDictionary(lang)
  const m = dict?.messaging
  return {
    title: m?.ui?.title || "Messages",
    description: m?.ui?.description || "Send and receive messages",
  }
}

export default async function MessagesPage({
  params,
  searchParams,
}: MessagesPageProps) {
  const { lang } = await params
  const { conversation } = await searchParams
  const locale = lang as "ar" | "en"

  return (
    <div className="h-full">
      <Suspense fallback={<MessagingContentSkeleton locale={locale} />}>
        <MessagingContent locale={locale} conversationId={conversation} />
      </Suspense>
    </div>
  )
}
