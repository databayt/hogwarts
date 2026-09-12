"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { cn } from "@/lib/utils"

import type { WhatsAppSessionDTO } from "../whatsapp/types"
import { ChatInterface, type ChatInterfaceProps } from "./chat-interface"
import { ContactsPanel } from "./contacts/contacts-panel"
import { ConversationInfoPanel } from "./conversation-info-panel"
import { NoActiveConversation } from "./empty-state"
import type { ConversationDTO } from "./types"

export type DesktopViewProps = {
  conversations: ConversationDTO[]
  activeConversation: ConversationDTO | null
  currentUserId: string
  currentUserRole: string
  locale: "ar" | "en"
  whatsappSession: WhatsAppSessionDTO | null
  typingConversations: Map<string, boolean>
  showInfoPanel: boolean
  onContactClick: (userId: string) => void
  onCloseInfoPanel: () => void
  /** Everything the open thread needs, minus the conversation itself. */
  thread: Omit<ChatInterfaceProps, "conversation" | "isTyping">
}

/**
 * The split-pane: contacts, the open thread, the info panel. Loaded only
 * at desktop widths — a phone never downloads this chunk or runs its
 * effects (the contacts fetch on mount, the virtualizer, the dialogs).
 */
export function DesktopView({
  conversations,
  activeConversation,
  currentUserId,
  currentUserRole,
  locale,
  whatsappSession,
  typingConversations,
  showInfoPanel,
  onContactClick,
  onCloseInfoPanel,
  thread,
}: DesktopViewProps) {
  const activeContactUserId = activeConversation?.participants?.find(
    (p) => p.userId !== currentUserId
  )?.userId

  return (
    <>
      <div
        className={cn(
          "bg-msg-sidebar-bg border-border flex min-h-0 w-[350px] max-w-[30vw] flex-shrink-0 flex-col overflow-hidden border-e"
        )}
      >
        <ContactsPanel
          currentUserRole={currentUserRole}
          conversations={conversations}
          currentUserId={currentUserId}
          locale={locale}
          onContactClick={onContactClick}
          activeContactUserId={activeContactUserId}
          whatsappSession={whatsappSession}
          typingConversations={typingConversations}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        {activeConversation ? (
          <ChatInterface
            {...thread}
            conversation={activeConversation}
            isTyping={typingConversations.get(activeConversation.id) ?? false}
          />
        ) : (
          <NoActiveConversation locale={locale} />
        )}
      </div>

      {showInfoPanel && activeConversation && (
        <div className="border-border border-s">
          <ConversationInfoPanel
            conversation={activeConversation}
            currentUserId={currentUserId}
            locale={locale}
            onClose={onCloseInfoPanel}
          />
        </div>
      )}
    </>
  )
}
