// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { Skeleton } from "@/components/ui/skeleton"
import { getMessagingDictionary } from "@/components/internationalization/dictionaries"
import { getNames } from "@/components/translation/person"

import { MessagingClient } from "./messaging-client"
import { getConversation, getConversationsList } from "./queries"
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

  // Fetch all data in parallel
  let conversationsData: any[] = []
  let activeConversationData: any = null
  let messagesData: any[] = []

  let whatsappConnected = false
  let whatsappSessionData:
    | import("../whatsapp/types").WhatsAppSessionDTO
    | null = null

  try {
    const [conversationsResult, activeConversation, waSession] =
      await Promise.all([
        getConversationsList(schoolId, userId, { page: 1, perPage: 50 }),
        conversationId
          ? getConversation(schoolId, userId, conversationId).catch(() => null)
          : Promise.resolve(null),
        db.whatsAppSession
          .findUnique({ where: { schoolId } })
          .catch(() => null),
      ])

    conversationsData = serializeConversations(conversationsResult.rows)
    whatsappConnected = waSession?.status === "connected"
    if (waSession) {
      whatsappSessionData = {
        id: waSession.id,
        schoolId: waSession.schoolId,
        instanceName: waSession.instanceName,
        phoneNumber: waSession.phoneNumber,
        status: waSession.status,
        qrCode: waSession.qrCode,
        connectedAt: waSession.connectedAt?.toISOString() ?? null,
        createdAt: waSession.createdAt.toISOString(),
      }
    }

    if (activeConversation) {
      activeConversationData = serializeConversation(activeConversation)
      // Messages already included via conversationDetailSelect (take: 50)
      const rawMessages = (activeConversation as any).messages ?? []
      messagesData = serializeMessages(rawMessages).reverse()
    }
  } catch (error) {
    console.error("[MessagingContent] Error fetching conversations:", error)
  }

  // Localize every display name in ONE batched call (getNames dedupes,
  // skips same-script names, and transliterates ar→Latin when the API is
  // down). The previous per-name getText inside nested .map()s fired up to
  // ~250 individual resolutions per page load.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nameRefs: Array<{ obj: any }> = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const collect = (obj: any) => {
    if (obj?.username) nameRefs.push({ obj })
  }
  for (const conv of conversationsData) {
    for (const p of conv.participants ?? []) collect(p.user)
    collect(conv.createdBy)
    collect(conv.lastMessage?.sender)
  }
  for (const p of activeConversationData?.participants ?? []) collect(p.user)
  for (const msg of messagesData) collect(msg.sender)

  if (nameRefs.length > 0) {
    const translated = await getNames(
      nameRefs,
      (r) => ({ firstName: r.obj.username as string }),
      locale,
      schoolId
    )
    for (const r of nameRefs) {
      r.obj.username = translated.get(r.obj.username) ?? r.obj.username
    }
  }

  return (
    <MessagingClient
      initialConversations={conversationsData}
      initialActiveConversation={activeConversationData}
      initialMessages={messagesData}
      currentUserId={userId}
      currentUserRole={session.user.role}
      locale={locale}
      whatsappConnected={whatsappConnected}
      whatsappSession={whatsappSessionData}
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
      {/* Sidebar skeleton - matches ContactsPanel layout */}
      <div className="border-border flex w-full flex-shrink-0 flex-col border-e md:w-[350px] md:max-w-[30vw]">
        <div className="space-y-4 px-6 pt-4">
          {/* Title + settings */}
          <div className="flex items-center justify-between px-0.5">
            <Skeleton className="h-6 w-16 rounded" />
            <Skeleton className="h-5 w-5 rounded" />
          </div>
          {/* Search */}
          <Skeleton className="h-9 w-full rounded-lg" />
          {/* Filter chips */}
          <div className="flex gap-2 pb-2">
            {["w-10", "w-16", "w-18", "w-16", "w-16"].map((w, i) => (
              <Skeleton
                key={i}
                className={`h-7 ${w} flex-shrink-0 rounded-full`}
              />
            ))}
          </div>
        </div>
        {/* Contact cards */}
        <div className="px-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex h-[72px] items-center gap-3 px-3">
              <Skeleton className="h-[49px] w-[49px] rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-3 w-24 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel skeleton - matches NoActiveConversation */}
      <div
        className="hidden flex-1 flex-col items-center md:flex"
        style={{ backgroundColor: "#ECECEC" }}
      >
        <div className="flex-1" />
        <Skeleton className="mb-6 h-16 w-16 rounded-full" />
        <Skeleton className="mb-2 h-6 w-44 rounded" />
        <div className="flex-1" />
        <Skeleton className="mb-14 h-4 w-40 rounded" />
      </div>
    </div>
  )
}
