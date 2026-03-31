// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Suspense } from "react"
import { auth } from "@/auth"

import { getTenantContext } from "@/lib/tenant-context"
import { Skeleton } from "@/components/ui/skeleton"
import { getMessagingDictionary } from "@/components/internationalization/dictionaries"

import { MessagingClient } from "./messaging-client"
import {
  getConversation,
  getConversationsList,
  getMessagesList,
} from "./queries"
import {
  serializeConversation,
  serializeConversations,
  serializeMessages,
} from "./serialization"

export interface MessagingContentProps {
  locale?: "ar" | "en"
  conversationId?: string
}

export async function MessagingContent({
  locale = "en",
  conversationId,
}: MessagingContentProps) {
  const session = await auth()
  const dict = await getMessagingDictionary(locale)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const m = dict?.messaging as Record<string, any> | undefined

  if (!session?.user?.id) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">
          {m?.ui?.sign_in_required || "Please sign in"}
        </p>
      </div>
    )
  }

  const tenantContext = await getTenantContext()
  if (!tenantContext.schoolId) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">
          {m?.errors?.no_school_context || "No school context found"}
        </p>
      </div>
    )
  }
  const schoolId = tenantContext.schoolId
  const userId = session.user.id

  // Fetch conversations list
  let conversationsData: any[] = []
  let activeConversationData: any = null
  let messagesData: any[] = []

  try {
    const conversationsResult = await getConversationsList(schoolId, userId, {
      page: 1,
      perPage: 50,
    })

    // Serialize conversations using centralized utility
    conversationsData = serializeConversations(conversationsResult.rows)

    // Fetch active conversation and messages if conversationId provided
    if (conversationId) {
      try {
        const activeConversation = await getConversation(
          schoolId,
          userId,
          conversationId
        )

        if (activeConversation) {
          // Serialize active conversation using centralized utility
          activeConversationData = serializeConversation(activeConversation)

          const messagesResult = await getMessagesList(schoolId, {
            conversationId,
            page: 1,
            perPage: 50,
          })

          // Serialize messages using centralized utility
          messagesData = serializeMessages(messagesResult.rows)
        }
      } catch (error) {
        console.error("[MessagingContent] Error fetching conversation:", error)
      }
    }
  } catch (error) {
    console.error("[MessagingContent] Error fetching conversations:", error)
  }

  return (
    <MessagingClient
      initialConversations={conversationsData}
      initialActiveConversation={activeConversationData}
      initialMessages={messagesData}
      currentUserId={userId}
      currentUserRole={session.user.role}
      locale={locale}
    />
  )
}

export async function MessagingContentSkeleton({
  locale = "en",
}: {
  locale?: "ar" | "en"
}) {
  const dict = await getMessagingDictionary(locale)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const m = dict?.messaging as Record<string, any> | undefined

  return (
    <div className="bg-background flex h-full">
      {/* Sidebar skeleton - responsive */}
      <div className="border-border w-full flex-shrink-0 space-y-4 border-e p-4 sm:w-96 md:w-[430px]">
        <Skeleton className="h-10 w-full rounded" />
        <Skeleton className="h-10 w-full rounded" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        ))}
      </div>

      {/* Chat skeleton - hidden on mobile, visible on desktop */}
      <div className="bg-muted/20 hidden flex-1 items-center justify-center md:flex">
        <p className="text-muted-foreground">
          {m?.ui?.select_conversation_start || "Select a conversation to start"}
        </p>
      </div>
    </div>
  )
}
