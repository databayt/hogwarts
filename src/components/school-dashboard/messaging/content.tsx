import { Suspense } from "react"
import { auth } from "@/auth"

import { getTenantContext } from "@/lib/tenant-context"

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
  if (!session?.user?.id) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">
          {locale === "ar" ? "يجب تسجيل الدخول" : "Please sign in"}
        </p>
      </div>
    )
  }

  const tenantContext = await getTenantContext()
  if (!tenantContext.schoolId) {
    return <div>No school context found</div>
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
      locale={locale}
    />
  )
}

export function MessagingContentSkeleton({
  locale = "en",
}: {
  locale?: "ar" | "en"
}) {
  return (
    <div className="bg-background flex h-full">
      {/* Sidebar skeleton - responsive */}
      <div className="border-border w-full flex-shrink-0 space-y-4 border-r p-4 sm:w-96 md:w-[430px]">
        <div className="bg-muted h-10 animate-pulse rounded" />
        <div className="bg-muted h-10 animate-pulse rounded" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="bg-muted h-12 w-12 animate-pulse rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="bg-muted h-4 w-32 animate-pulse rounded" />
              <div className="bg-muted h-3 w-48 animate-pulse rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Chat skeleton - hidden on mobile, visible on desktop */}
      <div className="bg-muted/20 hidden flex-1 items-center justify-center md:flex">
        <p className="text-muted-foreground">
          {locale === "ar"
            ? "اختر محادثة للبدء"
            : "Select a conversation to start"}
        </p>
      </div>
    </div>
  )
}
