"use client"

import { useMemo } from "react"

import { cn } from "@/lib/utils"

import type { BubbleStatus } from "./bubble-timestamp"
import { ChatWallpaper } from "./chat-wallpaper"
import { DateSeparator } from "./date-separator"
import { InputBar, type ReplyDraft } from "./input-bar"
import { LocationBubble } from "./location-bubble"
import { MessageBubble } from "./message-bubble"
import { ReactionCluster } from "./reaction-cluster"
import { ReplyBubble } from "./reply-bubble"
import { TopContactHeader } from "./top-contact-header"
import { VoiceNoteBubble } from "./voice-note-bubble"

export type ChatItem =
  | { kind: "date"; id: string; label: string }
  | {
      kind: "text"
      id: string
      side: "me" | "other"
      text: string
      time: string
      status?: BubbleStatus
      senderName?: string
      tail?: boolean
      reactions?: string[]
    }
  | {
      kind: "reply"
      id: string
      side: "me" | "other"
      text: string
      time: string
      status?: BubbleStatus
      replySenderName: string
      replyText: string
    }
  | {
      kind: "voice"
      id: string
      side: "me" | "other"
      avatarUrl?: string | null
      avatarFallback?: string
      durationLabel: string
      time: string
      status?: BubbleStatus
    }
  | {
      kind: "location"
      id: string
      side: "me" | "other"
      mapImageUrl?: string
      time: string
      status?: BubbleStatus
    }

type Props = {
  contactName: string
  contactSubtitle?: string
  contactAvatarUrl?: string | null
  unreadCount?: number
  items: ChatItem[]
  onBack?: () => void
  onVideo?: () => void
  onPhone?: () => void
  onTapInfo?: () => void
  onSend?: (text: string) => void
  onAttach?: () => void
  onSticker?: () => void
  onCamera?: () => void
  onMic?: () => void
  replyDraft?: ReplyDraft | null
  draftText?: string
  className?: string
}

export function MessagesView({
  contactName,
  contactSubtitle,
  contactAvatarUrl,
  unreadCount,
  items,
  onBack,
  onVideo,
  onPhone,
  onTapInfo,
  onSend,
  onAttach,
  onSticker,
  onCamera,
  onMic,
  replyDraft,
  draftText,
  className,
}: Props) {
  const renderedItems = useMemo(
    () =>
      items.map((item) => {
        switch (item.kind) {
          case "date":
            return <DateSeparator key={item.id} label={item.label} />
          case "text":
            return (
              <div key={item.id}>
                <MessageBubble
                  side={item.side}
                  text={item.text}
                  time={item.time}
                  status={item.status}
                  tail={item.tail}
                  senderName={item.senderName}
                />
                {item.reactions && item.reactions.length > 0 && (
                  <ReactionCluster emojis={item.reactions} side={item.side} />
                )}
              </div>
            )
          case "reply":
            return (
              <ReplyBubble
                key={item.id}
                side={item.side}
                text={item.text}
                time={item.time}
                status={item.status}
                replySenderName={item.replySenderName}
                replyText={item.replyText}
              />
            )
          case "voice":
            return (
              <VoiceNoteBubble
                key={item.id}
                side={item.side}
                avatarUrl={item.avatarUrl}
                avatarFallback={item.avatarFallback}
                durationLabel={item.durationLabel}
                time={item.time}
                status={item.status}
              />
            )
          case "location":
            return (
              <LocationBubble
                key={item.id}
                side={item.side}
                mapImageUrl={item.mapImageUrl}
                time={item.time}
                status={item.status}
              />
            )
        }
      }),
    [items]
  )

  return (
    <div className={cn("relative flex h-full w-full flex-col", className)}>
      <TopContactHeader
        name={contactName}
        subtitle={contactSubtitle}
        avatarUrl={contactAvatarUrl}
        unreadCount={unreadCount}
        onBack={onBack}
        onVideo={onVideo}
        onPhone={onPhone}
        onTapInfo={onTapInfo}
      />

      <ChatWallpaper className="flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto pb-[8px]">{renderedItems}</div>
      </ChatWallpaper>

      <InputBar
        value={draftText}
        onSend={onSend}
        onAttach={onAttach}
        onSticker={onSticker}
        onCamera={onCamera}
        onMic={onMic}
        replyDraft={replyDraft}
      />
    </div>
  )
}
