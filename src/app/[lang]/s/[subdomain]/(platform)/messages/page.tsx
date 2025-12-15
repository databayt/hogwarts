import { Suspense } from "react"
import type { Metadata } from "next"

import {
  MessagingContent,
  MessagingContentSkeleton,
} from "@/components/platform/messaging/content"

export const metadata: Metadata = {
  title: `Messages | Hogwarts`,
  description:
    "Send and receive messages, communicate with your school community",
}

interface MessagesPageProps {
  params: Promise<{
    lang: string
    subdomain: string
  }>
  searchParams: Promise<{
    conversation?: string
  }>
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
