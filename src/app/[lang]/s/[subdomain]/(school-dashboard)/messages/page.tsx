// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Suspense } from "react"
import type { Metadata } from "next"

import {
  MessagingContent,
  MessagingContentSkeleton,
} from "@/components/school-dashboard/messaging/content"

interface MessagesPageProps {
  params: Promise<{
    lang: string
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
  return {
    title: lang === "ar" ? "الرسائل | هوغوارتس" : "Messages | Hogwarts",
    description:
      lang === "ar"
        ? "إرسال واستقبال الرسائل، التواصل مع مجتمع المدرسة"
        : "Send and receive messages, communicate with your school community",
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
