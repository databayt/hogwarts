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
    <div className="bg-msg-chat-bg flex h-full flex-col items-center justify-center text-center">
      {/* WhatsApp-style centered icon */}
      <div className="bg-msg-date-pill mb-6 flex h-20 w-20 items-center justify-center rounded-full">
        <MessageSquare className="text-muted-foreground h-10 w-10" />
      </div>

      <h2 className="text-foreground mb-2 text-xl font-light">
        {m?.ui?.welcome_title || "Hogwarts Messages"}
      </h2>
      <p className="text-muted-foreground max-w-sm text-sm">
        {m?.ui?.select_conversation_description ||
          "Send and receive messages from your school community. Select a conversation or start a new one."}
      </p>

      {onNewConversation && (
        <Button
          variant="outline"
          onClick={onNewConversation}
          className="mt-6 gap-2 rounded-full"
        >
          <MessageSquarePlus className="h-4 w-4" />
          {m?.ui?.new_conversation || "New Conversation"}
        </Button>
      )}
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
    <div className="bg-msg-chat-bg flex h-full flex-col items-center justify-center text-center">
      {/* WhatsApp-style date pill */}
      <span className="bg-msg-date-pill mb-4 rounded-lg px-3 py-1 text-[12.5px] shadow-sm">
        {m?.ui?.today || "Today"}
      </span>

      {/* Typing dots animation */}
      <div className="bg-msg-incoming inline-flex items-center gap-1 rounded-lg px-4 py-3 shadow-sm">
        {[0, 150, 300].map((delay) => (
          <div
            key={delay}
            className="bg-msg-typing-dot h-2 w-2 animate-bounce rounded-full"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>

      <p className="text-muted-foreground mt-4 text-sm">
        {m?.ui?.no_messages_description ||
          "Say something to start the conversation"}
      </p>
    </div>
  )
}
