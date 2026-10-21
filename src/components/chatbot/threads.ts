// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import "server-only"

import type { ChatbotMode } from "@prisma/client"
import type { ModelMessage } from "ai"

import { db } from "@/lib/db"

import type { ChatProfile } from "./identity"
import { clean } from "./prompts"

/** What the model sees of a thread: the latest messages, each capped. */
const HISTORY = 24
const HISTORY_CHARS = 4000
/** An empty answer older than this was never finished — show it as cut off. */
export const STUCK_MS = 2 * 60 * 1000
const PAGE = 30

export interface Turn {
  threadId: string
  userMessageId: string
  assistantMessageId: string
  /** The thread's history, oldest first, ending with the question. */
  history: ModelMessage[]
}

/**
 * Open one answer. The question and an empty answer are written together,
 * BEFORE the model runs — a crash mid-answer leaves an empty row the thread
 * shows as cut off, never a question with no trace — and the history comes
 * from the database, never from the client (a client could put any words
 * in the assistant's mouth).
 *
 * `retryOf` asks the latest question again: it must name the thread's last
 * message, an answer; that answer is replaced, the question is not repeated.
 */
export async function startTurn(opts: {
  profile: ChatProfile
  mode: ChatbotMode
  lang: "ar" | "en"
  threadId?: string
  message?: string
  retryOf?: string
}): Promise<Turn | "not_found"> {
  const { profile, mode, lang } = opts
  const schoolId = profile.schoolId

  const threadId = opts.threadId
  if (threadId) {
    const thread = await db.chatbotThread.findFirst({
      where: { id: threadId, profileId: profile.id, schoolId, mode },
      select: { id: true },
    })
    if (!thread) return "not_found"
  }

  let question = opts.message ?? ""
  let userMessageId: string | null = null
  if (opts.retryOf) {
    if (!threadId) return "not_found"
    const [last, before] = await db.chatbotMessage.findMany({
      where: { threadId, schoolId },
      orderBy: { createdAt: "desc" },
      take: 2,
      select: { id: true, role: true, content: true },
    })
    if (
      last?.id !== opts.retryOf ||
      last.role !== "ASSISTANT" ||
      before?.role !== "USER"
    )
      return "not_found"
    await db.chatbotMessage.deleteMany({
      where: { id: last.id, threadId, schoolId },
    })
    question = before.content
    userMessageId = before.id
  }
  if (!question.trim()) return "not_found"

  // Explicit times: both rows are written in one transaction, where the
  // database clock would give them the same instant and an arbitrary order.
  const at = Date.now()
  const result = await db.$transaction(async (tx) => {
    const id =
      threadId ??
      (
        await tx.chatbotThread.create({
          data: {
            schoolId,
            profileId: profile.id,
            mode,
            lang,
            title: clean(question, 120) || "…",
          },
          select: { id: true },
        })
      ).id
    const user =
      userMessageId ??
      (
        await tx.chatbotMessage.create({
          data: {
            schoolId,
            threadId: id,
            role: "USER",
            content: question,
            createdAt: new Date(at),
          },
          select: { id: true },
        })
      ).id
    const answer = await tx.chatbotMessage.create({
      data: {
        schoolId,
        threadId: id,
        role: "ASSISTANT",
        createdAt: new Date(at + 1),
      },
      select: { id: true },
    })
    await tx.chatbotThread.updateMany({
      where: { id, schoolId },
      data: {
        lastMessageAt: new Date(at + 1),
        messageCount: { increment: userMessageId ? 0 : 2 },
      },
    })
    return { threadId: id, userMessageId: user, assistantMessageId: answer.id }
  })

  const rows = await db.chatbotMessage.findMany({
    where: {
      threadId: result.threadId,
      schoolId,
      NOT: { id: result.assistantMessageId },
    },
    orderBy: { createdAt: "desc" },
    take: HISTORY,
    select: { role: true, content: true },
  })
  const history: ModelMessage[] = rows
    .reverse()
    .filter((m) => m.content.trim())
    .map((m) => ({
      role: m.role === "USER" ? "user" : "assistant",
      content: m.content.slice(0, HISTORY_CHARS),
    }))
  return { ...result, history }
}

/** Close one answer: its words, how it ended, and the guide it was about. */
export async function finishTurn(opts: {
  schoolId: string
  threadId: string
  assistantMessageId: string
  text: string
  partial: boolean
  provider: string
  fallbackReason: string | null
  topicSlugs: string[]
  latencyMs: number
  model?: string | null
  usage?: {
    input: number
    read: number
    write: number
    output: number
  } | null
  costUsd?: number | null
  firstTokenMs?: number | null
}) {
  const { schoolId, threadId, usage } = opts
  await db.chatbotMessage.updateMany({
    where: { id: opts.assistantMessageId, threadId, schoolId },
    data: {
      content: opts.text,
      partial: opts.partial,
      provider: opts.provider,
      fallbackReason: opts.fallbackReason,
      topicSlugs: opts.topicSlugs,
      latencyMs: opts.latencyMs,
      model: opts.model ?? null,
      inputTokens: usage?.input ?? null,
      cacheReadTokens: usage?.read ?? null,
      cacheWriteTokens: usage?.write ?? null,
      outputTokens: usage?.output ?? null,
      costUsd: opts.costUsd ?? null,
      firstTokenMs: opts.firstTokenMs ?? null,
    },
  })
  if (opts.topicSlugs[0])
    await db.chatbotThread.updateMany({
      where: { id: threadId, schoolId },
      data: { topicSlug: opts.topicSlugs[0] },
    })
}

/** The newest chats first, a page at a time — what the sheet lists. */
export async function listThreads(
  profile: ChatProfile,
  mode: ChatbotMode,
  cursor?: string
) {
  const before = cursor ? new Date(cursor) : null
  const rows = await db.chatbotThread.findMany({
    where: {
      profileId: profile.id,
      schoolId: profile.schoolId,
      mode,
      ...(before && !Number.isNaN(before.getTime())
        ? { lastMessageAt: { lt: before } }
        : {}),
    },
    orderBy: { lastMessageAt: "desc" },
    take: PAGE + 1,
    select: { id: true, title: true, lastMessageAt: true, status: true },
  })
  const page = rows.slice(0, PAGE)
  return {
    threads: page.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      lastMessageAt: t.lastMessageAt.toISOString(),
    })),
    nextCursor:
      rows.length > PAGE ? page.at(-1)!.lastMessageAt.toISOString() : null,
  }
}

/** One chat with its messages, oldest first — or null if it isn't theirs. */
export async function readThread(
  profile: ChatProfile,
  mode: ChatbotMode,
  threadId: string
) {
  return db.chatbotThread.findFirst({
    where: {
      id: threadId,
      profileId: profile.id,
      schoolId: profile.schoolId,
      mode,
    },
    select: {
      id: true,
      title: true,
      messages: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          role: true,
          content: true,
          topicSlugs: true,
          partial: true,
          feedback: true,
          createdAt: true,
        },
      },
    },
  })
}
