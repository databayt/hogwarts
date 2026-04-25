"use client"

import { notFound } from "next/navigation"

import {
  MessagesView,
  type ChatItem,
} from "@/components/school-dashboard/messaging/mobile"

const ITEMS: ChatItem[] = [
  { kind: "date", id: "d1", label: "Yesterday" },
  {
    kind: "voice",
    id: "v1",
    side: "me",
    avatarFallback: "M",
    durationLabel: "0:25",
    time: "22:30",
    status: "read",
  },
  { kind: "date", id: "d2", label: "Today" },
  {
    kind: "text",
    id: "m1",
    side: "other",
    text: "Marty?",
    time: "08:21",
  },
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
    text: "Thank God I found you.",
    time: "08:21",
    tail: false,
  },
  {
    kind: "text",
    id: "m4",
    side: "other",
    text: "Listen, can you meet me at Twin Pines Mall tonight at 1:15? I've made a major breakthrough… I'll need your assistance.",
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
  {
    kind: "reply",
    id: "r1",
    side: "other",
    text: "Yes. In the morning. 😃",
    time: "08:21",
    replySenderName: "You",
    replyText: "Wait a minute, wait a minute. 1:15 in the morning?",
  },
  {
    kind: "text",
    id: "m6",
    side: "me",
    text: "What's goin' on? Where have you been all week?",
    time: "08:21",
    status: "read",
  },
  {
    kind: "text",
    id: "m7",
    side: "other",
    text: "Working. 👍",
    time: "08:22",
  },
  {
    kind: "text",
    id: "m8",
    side: "me",
    text: "Where's Einstein, is he with you? 🐕",
    time: "08:22",
    status: "read",
  },
  {
    kind: "text",
    id: "m9",
    side: "other",
    text: "Yeah, he's right here.",
    time: "08:22",
    tail: false,
  },
  {
    kind: "text",
    id: "m10",
    side: "me",
    text: "You know, Doc, you left your equipment on all week.",
    time: "08:22",
    status: "read",
  },
  {
    kind: "text",
    id: "m11",
    side: "other",
    text: "My equipment, that reminds me, Marty, you better not hook up to the amplifier…",
    time: "08:22",
  },
  {
    kind: "text",
    id: "m12",
    side: "other",
    text: "There's a slight possibility for overload 😱",
    time: "08:23",
  },
  {
    kind: "text",
    id: "m13",
    side: "me",
    text: "Yeah, I'll keep that in mind…",
    time: "08:23",
    status: "read",
    reactions: ["❤️", "❤️", "❤️"],
  },
  {
    kind: "text",
    id: "m14",
    side: "other",
    text: "Good, I'll see you tonight. Don't forget, now, 1:15 a.m., Twin Pines Mall.",
    time: "08:23",
  },
  {
    kind: "text",
    id: "m15",
    side: "me",
    text: "Right.",
    time: "08:24",
    status: "read",
  },
  {
    kind: "location",
    id: "l1",
    side: "me",
    time: "08:24",
    status: "read",
  },
]

export default function ChatPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound()
  return (
    <div className="flex h-screen w-screen items-stretch justify-center bg-neutral-200">
      <div className="flex h-full w-[393px] max-w-full flex-col overflow-hidden shadow-xl">
        <MessagesView
          contactName={'Emmett "Doc" Br'}
          unreadCount={1}
          items={ITEMS}
          onBack={() => window.history.back()}
          onSend={(t) => console.log("send:", t)}
        />
      </div>
    </div>
  )
}
