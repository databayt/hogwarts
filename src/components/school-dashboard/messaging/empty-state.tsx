"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { MessageSquare, MessageSquarePlus } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useDictionary } from "@/components/internationalization/use-dictionary"

/* ------------------------------------------------------------------ */
/*  No Active Conversation — Desktop right panel                       */
/* ------------------------------------------------------------------ */

export function NoActiveConversation({
  locale = "en",
  onNewConversation,
}: {
  locale?: "ar" | "en"
  onNewConversation?: () => void
}) {
  const { dictionary } = useDictionary()
  const m = dictionary?.messaging

  return (
    <div
      className="flex h-full flex-col items-center text-center"
      style={{ backgroundColor: "#ECECEC" }}
    >
      {/* Spacer to push content to center */}
      <div className="flex-1" />

      {/* WhatsApp-style icon */}
      <svg className="mb-6 h-16 w-16" viewBox="0 0 24 24" fill="#8B8C8C">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>

      <h2
        className="mb-2 text-[1.35rem] font-medium"
        style={{ color: "#8B8C8C" }}
      >
        {m?.ui?.app_title || "School Messaging"}
      </h2>

      {/* Spacer to push encryption text toward bottom */}
      <div className="flex-1" />

      <p
        className="mb-14 flex items-center gap-1 text-xs font-medium"
        style={{ color: "#8B8C8C" }}
      >
        <img src="/lock.svg" alt="" className="h-3 w-3" aria-hidden="true" />
        {m?.ui?.end_to_end_encrypted || "End-to-end encrypted"}
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  No Conversations — Empty sidebar list                              */
/* ------------------------------------------------------------------ */

export function ConversationListEmpty({
  locale = "en",
  onNewConversation,
}: {
  locale?: "ar" | "en"
  onNewConversation?: () => void
}) {
  const { dictionary } = useDictionary()
  const m = dictionary?.messaging

  return (
    <div className="flex h-64 flex-col items-center justify-center p-6 text-center">
      <MessageSquare className="text-muted-foreground/40 mb-3 h-10 w-10" />
      <p className="text-foreground mb-1 font-medium">
        {m?.ui?.no_conversations || "No conversations yet"}
      </p>
      <p className="text-muted-foreground mb-4 max-w-[240px] text-sm">
        {m?.ui?.welcome_description ||
          "Start a conversation with your school community."}
      </p>
      {onNewConversation && (
        <Button
          variant="outline"
          size="sm"
          onClick={onNewConversation}
          className="gap-2 rounded-full"
        >
          <MessageSquarePlus className="h-4 w-4" />
          {m?.ui?.new_conversation || "New Conversation"}
        </Button>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Chat Empty — No messages in a conversation                         */
/* ------------------------------------------------------------------ */

export function ChatEmpty({ locale = "en" }: { locale?: "ar" | "en" }) {
  const { dictionary } = useDictionary()
  const m = dictionary?.messaging

  return (
    <div className="flex h-full flex-col items-start justify-start pt-8 text-center">
      <div
        className="mx-auto max-w-[360px] rounded-lg px-3 py-1.5 text-[12px] leading-relaxed shadow-sm"
        style={{ backgroundColor: "#D9FDD3", color: "#0A2618" }}
      >
        <img
          src="/lock.svg"
          alt=""
          className="mb-0.5 inline h-3 w-3"
          aria-hidden="true"
        />{" "}
        {m?.ui?.encryption_notice ||
          "Messages and calls are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them."}
      </div>
    </div>
  )
}
