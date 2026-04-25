"use client"

import { useState } from "react"
import { notFound } from "next/navigation"

import { IosChatList } from "@/components/school-dashboard/messaging/mobile"
import type { ConversationDTO } from "@/components/school-dashboard/messaging/types"

const CURRENT_USER_ID = "u-self"

const MOCK: ConversationDTO[] = [
  buildDirect({
    id: "c1",
    name: "Jenny ❤️",
    preview: 'You reacted 😘 to "That\'s good advice, Marty."',
    at: "16:14",
    unread: 0,
    pinned: true,
    online: true,
  }),
  buildDirect({
    id: "c2",
    name: "Mom 💕",
    preview: "Mom is typing...",
    at: "19:45",
    unread: 1,
    mentioned: true,
    typing: true,
  }),
  buildDirect({
    id: "c3",
    name: "Daddy",
    preview: "I mean he wrecked it! 😭",
    at: "19:42",
    unread: 0,
    sent: true,
    read: true,
  }),
  buildDirect({
    id: "c4",
    name: "Biff Tannen",
    preview: "Say hi to your mom for me.",
    at: "18:23",
    unread: 0,
  }),
  buildDirect({
    id: "c5",
    name: "Clocktower Lady",
    preview: "Save the clock tower?",
    at: "16:15",
    unread: 0,
    contentType: "voice",
  }),
  buildDirect({
    id: "c6",
    name: "Mr. Strickland",
    preview: "",
    at: "08:57",
    unread: 0,
    deleted: true,
  }),
  buildDirect({
    id: "c7",
    name: 'Emmett "Doc" Brown',
    preview: "Location",
    at: "08:24",
    unread: 0,
    contentType: "location",
  }),
  buildDirect({
    id: "c8",
    name: "Dave",
    preview: "Thanks bro!",
    at: "08:01",
    unread: 0,
  }),
  buildDirect({
    id: "c9",
    name: "Lynda",
    preview: "Ok!",
    at: "Yesterday",
    unread: 0,
    sent: true,
  }),
  buildGroup({
    id: "c10",
    name: "The time travelers ⏰",
    preview: "Titor: ...until the clock hits 2:17 AM, March 14th, 2036.",
    at: "Yesterday",
  }),
]

export default function WaPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound()
  const [activeId, setActiveId] = useState<string | null>(null)
  const typing = new Map<string, boolean>([["c2", true]])
  const mentioned = new Set<string>(["c2"])
  const online = new Set<string>(["user-c1"])
  return (
    <div className="flex h-screen w-screen items-stretch justify-center bg-neutral-200">
      <div className="flex h-full w-[393px] max-w-full flex-col overflow-hidden shadow-xl">
        <IosChatList
          conversations={MOCK}
          currentUserId={CURRENT_USER_ID}
          activeConversationId={activeId}
          typingConversations={typing}
          mentionedConversations={mentioned}
          onlineUserIds={online}
          onConversationClick={setActiveId}
          onNewChat={() => alert("New chat")}
          onCamera={() => alert("Camera")}
          onOptions={() => alert("Options")}
        />
      </div>
    </div>
  )
}

function buildDirect(args: {
  id: string
  name: string
  preview: string
  at: string
  unread: number
  pinned?: boolean
  mentioned?: boolean
  online?: boolean
  sent?: boolean
  read?: boolean
  typing?: boolean
  deleted?: boolean
  contentType?: string
}): ConversationDTO {
  const now = new Date()
  const date = new Date(now)
  if (args.at === "Yesterday") date.setDate(now.getDate() - 1)

  return {
    id: args.id,
    schoolId: "s1",
    type: "direct",
    title: args.name,
    avatar: null,
    directParticipant1Id: CURRENT_USER_ID,
    directParticipant2Id: `user-${args.id}`,
    lastMessageAt: date,
    isArchived: false,
    whatsappEnabled: false,
    createdAt: date,
    updatedAt: date,
    participantCount: 2,
    unreadCount: args.unread,
    lastMessage: args.typing
      ? null
      : ({
          id: `m-${args.id}`,
          conversationId: args.id,
          senderId: args.sent ? CURRENT_USER_ID : `user-${args.id}`,
          sender: {
            id: `user-${args.id}`,
            username: args.name,
            email: null,
            image: null,
          },
          content: args.preview,
          contentType: args.contentType ?? "text",
          status: args.read ? "read" : args.sent ? "sent" : "delivered",
          replyToId: null,
          replyTo: null,
          forwardedFromId: null,
          isEdited: false,
          editedAt: null,
          isDeleted: Boolean(args.deleted),
          deletedAt: null,
          isSystem: false,
          metadata: null,
          whatsappStatus: null,
          whatsappPhone: null,
          createdAt: date,
          updatedAt: date,
          attachments: [],
        } as never),
    participants: [
      {
        id: `p1-${args.id}`,
        conversationId: args.id,
        userId: CURRENT_USER_ID,
        user: {
          id: CURRENT_USER_ID,
          username: "Me",
          email: "me@example.com",
          image: null,
          role: "student",
        },
        role: "member",
        nickname: null,
        isPinned: Boolean(args.pinned),
        lastReadAt: null,
        isMuted: false,
        unreadCount: args.unread,
        isActive: true,
        leftAt: null,
        createdAt: date,
        updatedAt: date,
      },
      {
        id: `p2-${args.id}`,
        conversationId: args.id,
        userId: `user-${args.id}`,
        user: {
          id: `user-${args.id}`,
          username: args.name,
          email: null,
          image: null,
          role: "student",
        },
        role: "member",
        nickname: null,
        isPinned: false,
        lastReadAt: null,
        isMuted: false,
        unreadCount: 0,
        isActive: true,
        leftAt: null,
        createdAt: date,
        updatedAt: date,
      },
    ],
  } as never
}

function buildGroup(args: {
  id: string
  name: string
  preview: string
  at: string
}): ConversationDTO {
  const now = new Date()
  const date = new Date(now)
  date.setDate(now.getDate() - 1)
  return {
    ...buildDirect({
      id: args.id,
      name: args.name,
      preview: args.preview,
      at: args.at,
      unread: 0,
    }),
    type: "group",
    directParticipant1Id: null,
    directParticipant2Id: null,
  }
}
