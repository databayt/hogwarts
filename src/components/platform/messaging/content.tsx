import { Suspense } from "react"
import { auth } from "@/auth"
import { getTenantContext } from "@/lib/tenant-context"
import { getConversationsList, getConversation, getMessagesList } from "./queries"
import { MessagingClient } from "./messaging-client"

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
      <div className="flex items-center justify-center h-full">
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
  const conversationsResult = await getConversationsList(schoolId, userId, {
    page: 1,
    perPage: 50,
  })

  // Fetch active conversation and messages if conversationId provided
  let activeConversation = null
  let messages: any[] = []

  if (conversationId) {
    try {
      activeConversation = await getConversation(schoolId, userId, conversationId)

      if (activeConversation) {
        const messagesResult = await getMessagesList(schoolId, {
          conversationId,
          page: 1,
          perPage: 50,
        })
        messages = messagesResult.rows
      }
    } catch (error) {
      console.error("Error fetching conversation:", error)
    }
  }

  return (
    <MessagingClient
      initialConversations={conversationsResult.rows as any}
      initialActiveConversation={activeConversation as any}
      initialMessages={messages as any}
      currentUserId={userId}
      locale={locale}
    />
  )
}

export function MessagingContentSkeleton({ locale = "en" }: { locale?: "ar" | "en" }) {
  return (
    <div className="flex h-full">
      {/* Sidebar skeleton */}
      <div className="w-80 border-r border-border p-4 space-y-4">
        <div className="h-10 bg-muted animate-pulse rounded" />
        <div className="h-10 bg-muted animate-pulse rounded" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              <div className="h-3 w-48 bg-muted animate-pulse rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Chat skeleton */}
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">
          {locale === "ar" ? "اختر محادثة للبدء" : "Select a conversation to start"}
        </p>
      </div>
    </div>
  )
}
