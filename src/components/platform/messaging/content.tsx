import { Suspense } from "react"
import { auth } from "@/auth"
import { getTenantContext } from "@/lib/tenant-context"
import { getConversationsList, getConversation, getMessagesList } from "./queries"
import { MessagingClient } from "./messaging-client"

// Helper function to safely serialize dates
function safeSerializeDate(date: Date | null | undefined): string {
  if (!date) return new Date().toISOString()
  try {
    return new Date(date).toISOString()
  } catch (error) {
    console.error('[safeSerializeDate] Invalid date:', date, error)
    return new Date().toISOString()
  }
}

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
  let conversationsData: any[] = []
  let activeConversationData: any = null
  let messagesData: any[] = []

  try {
    const conversationsResult = await getConversationsList(schoolId, userId, {
      page: 1,
      perPage: 50,
    })

    // Serialize conversations
    conversationsData = conversationsResult.rows.map((conv: any) => ({
      ...conv,
      createdAt: safeSerializeDate(conv.createdAt),
      updatedAt: safeSerializeDate(conv.updatedAt),
      lastMessageAt: safeSerializeDate(conv.lastMessageAt),
      participants: conv.participants?.map((p: any) => ({
        ...p,
        joinedAt: safeSerializeDate(p.joinedAt),
        lastReadAt: safeSerializeDate(p.lastReadAt),
        mutedUntil: safeSerializeDate(p.mutedUntil),
      })) || [],
      createdBy: conv.createdBy ? {
        ...conv.createdBy,
      } : null,
    }))

    // Fetch active conversation and messages if conversationId provided
    if (conversationId) {
      try {
        const activeConversation = await getConversation(schoolId, userId, conversationId)

        if (activeConversation) {
          // Serialize active conversation
          activeConversationData = {
            ...activeConversation,
            createdAt: safeSerializeDate(activeConversation.createdAt),
            updatedAt: safeSerializeDate(activeConversation.updatedAt),
            lastMessageAt: safeSerializeDate(activeConversation.lastMessageAt),
            participants: activeConversation.participants?.map((p: any) => ({
              ...p,
              joinedAt: safeSerializeDate(p.joinedAt),
              lastReadAt: safeSerializeDate(p.lastReadAt),
              mutedUntil: safeSerializeDate(p.mutedUntil),
            })) || [],
          }

          const messagesResult = await getMessagesList(schoolId, {
            conversationId,
            page: 1,
            perPage: 50,
          })

          // Serialize messages
          messagesData = messagesResult.rows.map((msg: any) => ({
            ...msg,
            createdAt: safeSerializeDate(msg.createdAt),
            updatedAt: safeSerializeDate(msg.updatedAt),
            editedAt: safeSerializeDate(msg.editedAt),
            deletedAt: safeSerializeDate(msg.deletedAt),
            attachments: msg.attachments?.map((a: any) => ({
              ...a,
              uploadedAt: safeSerializeDate(a.uploadedAt),
            })) || [],
            reactions: msg.reactions?.map((r: any) => ({
              ...r,
              createdAt: safeSerializeDate(r.createdAt),
            })) || [],
            readReceipts: msg.readReceipts?.map((rr: any) => ({
              ...rr,
              readAt: safeSerializeDate(rr.readAt),
            })) || [],
            replyTo: msg.replyTo ? {
              ...msg.replyTo,
              createdAt: safeSerializeDate(msg.replyTo.createdAt),
            } : null,
          }))
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
