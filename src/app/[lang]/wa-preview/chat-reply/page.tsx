"use client"

import { useState } from "react"
import { notFound } from "next/navigation"

import {
  MessagesView,
  type ChatItem,
} from "@/components/school-dashboard/messaging/mobile"

const ITEMS: ChatItem[] = [
  { kind: "date", id: "d1", label: "Today" },
  { kind: "text", id: "m1", side: "other", text: "Marty?", time: "08:21" },
  {
    kind: "text",
    id: "m2",
    side: "me",
    text: "Hey, hey, Doc, where are you?",
    time: "08:21",
    status: "read",
  },
  {
    kind: "text",
    id: "m3",
    side: "other",
    text: "That's good advice, Marty.",
    time: "08:21",
  },
  {
    kind: "text",
    id: "m4",
    side: "other",
    text: "Well, you know, I'm a man of my word.",
    time: "08:21",
  },
  {
    kind: "text",
    id: "m5",
    side: "me",
    text: "Wait a minute, wait a minute. 1:15 in the morning?",
    time: "08:21",
    status: "read",
  },
]

export default function ChatReplyPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound()
  const [reply, setReply] = useState<{
    senderName: string
    text: string
  } | null>({ senderName: "Jenny ❤️", text: "That's good advice, Marty." })
  return (
    <div className="flex h-screen w-screen items-stretch justify-center bg-neutral-200">
      <div className="flex h-full w-[393px] max-w-full flex-col overflow-hidden shadow-xl">
        <MessagesView
          contactName={'Emmett "Doc" Br'}
          unreadCount={1}
          items={ITEMS}
          onBack={() => window.history.back()}
          draftText="Alright, okay..."
          onSend={(t) => {
            console.log("send:", t, "reply-to:", reply)
            setReply(null)
          }}
          replyDraft={
            reply
              ? {
                  senderName: reply.senderName,
                  text: reply.text,
                  onClose: () => setReply(null),
                }
              : null
          }
        />
      </div>
    </div>
  )
}
