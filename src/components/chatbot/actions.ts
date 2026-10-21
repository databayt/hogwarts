// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
"use server"

/**
 * The chats sheet's server actions. Every one resolves who is asking from
 * the Host and the session or visitor cookie — never from its arguments —
 * and touches only that profile's rows: a chat id from anyone else is "not
 * found". The tenant is the Host's, not `getTenantContext()`'s, whose
 * impersonation cookie must not move a developer's chats into a school.
 */
import { headers } from "next/headers"
import { auth } from "@/auth"
import { z } from "zod"

import { db } from "@/lib/db"
import { mainOriginForHost } from "@/lib/root-domain"
import { tenantForHost } from "@/lib/tenant-host"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"

import { forgetVisitor, profileFor } from "./identity"
import { SUPPORT_TOPICS } from "./support"
import { resourcesFor } from "./support-media"
import { listThreads, readThread, STUCK_MS } from "./threads"
import type { ChatMessage, ChatSummary } from "./type"

const mode = z.enum(["saasMarketing", "schoolSite", "schoolSupport"])
const id = z.string().min(1).max(64)

async function viewer() {
  const [h, session] = await Promise.all([headers(), auth()])
  const host = h.get("host")
  const tenant = await tenantForHost(host)
  const profile = await profileFor({
    tenant,
    userId: session?.user?.id,
    write: false,
  })
  return { tenant, profile, host }
}

export async function listChats(input: {
  mode: string
  cursor?: string
}): Promise<{
  threads: ChatSummary[]
  nextCursor: string | null
  visitor: boolean
}> {
  const parsed = z
    .object({ mode, cursor: z.string().max(40).optional() })
    .safeParse(input)
  const { profile } = await viewer()
  if (!parsed.success || !profile)
    return { threads: [], nextCursor: null, visitor: !profile }
  const page = await listThreads(profile, parsed.data.mode, parsed.data.cursor)
  return { ...page, visitor: profile.visitor }
}

export async function loadChat(input: {
  mode: string
  threadId: string
  locale: string
}): Promise<{ id: string; title: string; messages: ChatMessage[] } | null> {
  const parsed = z
    .object({ mode, threadId: id, locale: z.enum(["ar", "en"]) })
    .safeParse(input)
  if (!parsed.success) return null
  const { profile, host } = await viewer()
  if (!profile) return null
  const thread = await readThread(
    profile,
    parsed.data.mode,
    parsed.data.threadId
  )
  if (!thread) return null

  const { locale } = parsed.data
  const chatbot = (await getDictionary(locale as Locale)).chatbot as Record<
    string,
    string
  >
  // The help center lives on the main domain; the desk links carry it.
  const origin =
    parsed.data.mode === "schoolSupport" ? mainOriginForHost(host) : ""
  const labels = { video: chatbot.resourceVideo, guide: chatbot.resourceGuide }
  const now = Date.now()

  return {
    id: thread.id,
    title: thread.title,
    messages: thread.messages.map((m): ChatMessage => {
      if (m.role === "USER")
        return { id: m.id, role: "user", content: m.content }
      const topic = SUPPORT_TOPICS.find((t) => t.slug === m.topicSlugs[0])
      // An answer that never got its words: the request died mid-way.
      const stuck = !m.content && now - m.createdAt.getTime() > STUCK_MS
      return {
        id: m.id,
        serverId: m.id,
        role: "assistant",
        content: m.content,
        resources: topic
          ? resourcesFor(topic, locale, labels, undefined, origin)
          : undefined,
        partial: m.partial || stuck || undefined,
        notice: m.partial || stuck ? chatbot.answerCutOff : undefined,
        feedback: m.feedback === 1 || m.feedback === -1 ? m.feedback : undefined,
      }
    }),
  }
}

export async function renameChat(input: {
  threadId: string
  title: string
}): Promise<boolean> {
  const parsed = z
    .object({ threadId: id, title: z.string().trim().min(1).max(80) })
    .safeParse(input)
  if (!parsed.success) return false
  const { profile } = await viewer()
  if (!profile) return false
  const { count } = await db.chatbotThread.updateMany({
    where: {
      id: parsed.data.threadId,
      profileId: profile.id,
      schoolId: profile.schoolId,
    },
    data: { title: parsed.data.title },
  })
  return count > 0
}

export async function deleteChat(input: {
  threadId: string
}): Promise<boolean> {
  const parsed = z.object({ threadId: id }).safeParse(input)
  if (!parsed.success) return false
  const { profile } = await viewer()
  if (!profile) return false
  // Its messages and the notes learned in it go with it (FK cascade).
  const { count } = await db.chatbotThread.deleteMany({
    where: {
      id: parsed.data.threadId,
      profileId: profile.id,
      schoolId: profile.schoolId,
    },
  })
  return count > 0
}

export async function deleteAllChats(input: { mode: string }): Promise<number> {
  const parsed = z.object({ mode }).safeParse(input)
  if (!parsed.success) return 0
  const { profile } = await viewer()
  if (!profile) return 0
  const { count } = await db.chatbotThread.deleteMany({
    where: {
      profileId: profile.id,
      schoolId: profile.schoolId,
      mode: parsed.data.mode,
    },
  })
  return count
}

/** A visitor's "Forget this device": every chat and note, and the cookie. */
export async function forgetDevice(): Promise<boolean> {
  const { tenant } = await viewer()
  return forgetVisitor(tenant)
}

/**
 * "Helpful" / "Not helpful" on an answer — theirs only. Helpful closes the
 * conversation as resolved; both feed the review of unanswered questions
 * (scripts/chatbot/review-feedback.ts).
 */
export async function rateMessage(input: {
  messageId: string
  value: number
}): Promise<boolean> {
  const parsed = z
    .object({ messageId: id, value: z.union([z.literal(1), z.literal(-1)]) })
    .safeParse(input)
  if (!parsed.success) return false
  const { profile } = await viewer()
  if (!profile) return false
  const message = await db.chatbotMessage.findFirst({
    where: {
      id: parsed.data.messageId,
      schoolId: profile.schoolId,
      role: "ASSISTANT",
      thread: { profileId: profile.id },
    },
    select: { id: true, threadId: true },
  })
  if (!message) return false
  await db.chatbotMessage.updateMany({
    where: { id: message.id, schoolId: profile.schoolId },
    data: { feedback: parsed.data.value },
  })
  if (parsed.data.value === 1)
    await db.chatbotThread.updateMany({
      where: {
        id: message.threadId,
        profileId: profile.id,
        schoolId: profile.schoolId,
      },
      data: { status: "RESOLVED" },
    })
  return true
}

/** They took a next step out of the chat (a report, the school, our team). */
export async function markEscalated(input: {
  threadId: string
}): Promise<boolean> {
  const parsed = z.object({ threadId: id }).safeParse(input)
  if (!parsed.success) return false
  const { profile } = await viewer()
  if (!profile) return false
  const { count } = await db.chatbotThread.updateMany({
    where: {
      id: parsed.data.threadId,
      profileId: profile.id,
      schoolId: profile.schoolId,
    },
    data: { status: "ESCALATED", escalatedAt: new Date() },
  })
  return count > 0
}
