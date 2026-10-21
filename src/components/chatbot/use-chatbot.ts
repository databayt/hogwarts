"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useEffect, useRef, useState } from "react"

import { loadChat } from "./actions"
import type { SystemPromptType } from "./prompts"
import { readEvents } from "./sse"
import type { ChatMessage, ChatResource, ChatStatus } from "./type"

/** A failure the server already worded for the visitor. */
class ChatError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message)
  }
}

interface UseChatbotOptions {
  promptType?: SystemPromptType
  subdomain?: string
  locale?: string
  /** The bubble shown when the request fails — localized by the caller. */
  errorText?: string
}

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`

/** The open conversation, per tab and per bot — survives a reload. */
const storageKey = (promptType: string) => `bq-chat:${promptType}`

function readStored(key: string): string | null {
  try {
    return sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStored(key: string, value: string | null) {
  try {
    if (value) sessionStorage.setItem(key, value)
    else sessionStorage.removeItem(key)
  } catch {
    /* private mode: the chat just won't come back after a reload */
  }
}

/**
 * The chat's client state. The conversation lives on the server: this sends
 * one question and the thread it belongs to, and keeps the thread's id for
 * the tab, so a reload (or a page change that remounts the bot) brings the
 * chat back. One request at a time, cancellable: Stop aborts the fetch, the
 * server sees the disconnect and stops the model, and what already arrived
 * stays — on screen and in the thread — as a partial answer. Streamed pieces
 * are painted once per animation frame, not once per piece.
 */
export function useChatbot({
  promptType = "saasMarketing",
  subdomain,
  locale = "en",
  errorText = "Sorry, something went wrong. Please try again in a moment.",
}: UseChatbotOptions = {}) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [status, setStatus] = useState<ChatStatus>("idle")
  const [threadId, setThreadIdState] = useState<string | null>(null)
  const messagesRef = useRef<ChatMessage[]>([])
  const threadRef = useRef<string | null>(null)
  const controller = useRef<AbortController | null>(null)
  const restored = useRef(false)
  const key = storageKey(promptType)

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  const setThread = useCallback(
    (id: string | null) => {
      threadRef.current = id
      setThreadIdState(id)
      writeStored(key, id)
    },
    [key]
  )

  // Leaving the page (or the layout that mounts the bot) ends the request.
  useEffect(() => () => controller.current?.abort(), [])

  /** Show a saved conversation. False when it is gone (deleted, purged). */
  const openThread = useCallback(
    async (id: string): Promise<boolean> => {
      controller.current?.abort()
      const thread = await loadChat({
        mode: promptType,
        threadId: id,
        locale,
      }).catch(() => null)
      if (!thread) return false
      messagesRef.current = thread.messages
      setMessages(thread.messages)
      setThread(thread.id)
      setStatus("idle")
      return true
    },
    [promptType, locale, setThread]
  )

  // The first open in this tab brings back the chat it was in.
  useEffect(() => {
    if (!isOpen || restored.current) return
    restored.current = true
    const stored = readStored(key)
    if (stored && !messagesRef.current.length)
      void openThread(stored).then((ok) => {
        if (!ok) writeStored(key, null)
      })
  }, [isOpen, key, openThread])

  const toggleChat = useCallback(() => setIsOpen((prev) => !prev), [])
  const openChat = useCallback(() => setIsOpen(true), [])
  const closeChat = useCallback(() => setIsOpen(false), [])

  /**
   * Ask `question` in the open thread. With `retryOf`, the server replaces
   * that saved answer instead of saving the question twice.
   */
  const run = useCallback(
    async (question: string, retryOf?: string, again = false) => {
      controller.current?.abort()
      const abort = new AbortController()
      controller.current = abort

      const id = newId()
      let serverId: string | undefined
      let content = ""
      let resources: ChatResource[] | undefined
      let partial = false
      let notice: string | undefined
      let frame = 0
      const paint = () => {
        frame = 0
        const next: ChatMessage = {
          id,
          serverId,
          role: "assistant",
          content,
          resources,
          partial: partial || undefined,
          notice,
          timestamp: new Date(),
        }
        setMessages((prev) =>
          prev.some((m) => m.id === id)
            ? prev.map((m) => (m.id === id ? next : m))
            : [...prev, next]
        )
      }
      const schedule = () => {
        if (!frame) frame = requestAnimationFrame(paint)
      }

      setStatus("waiting")
      paint() // the empty answer bubble — the typing dots live in it
      try {
        const res = await fetch("/api/chatbot", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            message: question,
            threadId: threadRef.current ?? undefined,
            retryOf,
            promptType,
            subdomain,
            locale,
          }),
          signal: abort.signal,
        })
        if (!res.ok || !res.body) {
          // The route's own errors (rate limit, sign-in) are written for
          // people in their language — show them as they are.
          const body = (await res.json().catch(() => ({}))) as {
            error?: string
          }
          throw new ChatError(body.error || errorText, res.status)
        }

        for await (const event of readEvents(res.body)) {
          if (event.event === "meta") {
            if (event.data.threadId) setThread(event.data.threadId)
            serverId = event.data.assistantMessageId
            const userId = event.data.userMessageId
            if (userId)
              setMessages((prev) => {
                // The question just asked is the last one without a saved id.
                const at = prev.findLastIndex(
                  (m) => m.role === "user" && !m.serverId
                )
                return at === -1
                  ? prev
                  : prev.map((m, i) =>
                      i === at ? { ...m, serverId: userId } : m
                    )
              })
          } else if (event.event === "resources") {
            resources = event.data.resources
            schedule()
          } else if (event.event === "delta") {
            content += event.data.t
            setStatus("streaming")
            schedule()
          } else if (event.event === "error") {
            partial = true
            notice = event.data.message
          } else if (event.event === "done") {
            partial ||= event.data.partial
          }
        }
        if (frame) cancelAnimationFrame(frame)
        paint()
        setStatus("idle")
      } catch (err) {
        if (frame) cancelAnimationFrame(frame)
        if (abort.signal.aborted) {
          // Stop, a new chat, or leaving: keep what arrived, quietly — but
          // never put back a bubble a new chat already cleared.
          if (content) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === id
                  ? { ...m, serverId, content, resources, partial: true }
                  : m
              )
            )
          } else {
            setMessages((prev) => prev.filter((m) => m.id !== id))
          }
          if (controller.current === abort) setStatus("idle")
          return
        }
        if (err instanceof ChatError && err.status === 404 && !again) {
          // The saved chat is gone (deleted elsewhere, purged): this
          // question starts a new one.
          setMessages((prev) => prev.filter((m) => m.id !== id))
          setThread(null)
          if (controller.current === abort) controller.current = null
          return run(question, undefined, true)
        }
        if (!(err instanceof ChatError)) console.error("Chat error:", err)
        if (content) {
          // The connection broke mid-answer: keep it, say so, offer retry.
          partial = true
          notice ??= errorText
          paint()
        } else {
          // The bubble speaks the visitor's language; a raw network or
          // runtime error stays in the console.
          const bubble = err instanceof ChatError ? err.message : errorText
          setMessages((prev) =>
            prev.map((m) =>
              m.id === id
                ? { ...m, serverId, kind: "error", content: bubble }
                : m
            )
          )
        }
        setStatus("error")
      } finally {
        if (controller.current === abort) controller.current = null
      }
    },
    [promptType, subdomain, locale, errorText, setThread]
  )

  const sendMessage = useCallback(
    (content: string) => {
      if (controller.current) return // one question at a time
      const user: ChatMessage = {
        id: newId(),
        role: "user",
        content,
        timestamp: new Date(),
      }
      const history = [...messagesRef.current, user]
      messagesRef.current = history
      setMessages(history)
      void run(content)
    },
    [run]
  )

  const stop = useCallback(() => controller.current?.abort(), [])

  /** Ask the latest question again, replacing the answer that failed. */
  const retry = useCallback(() => {
    if (controller.current) return
    const all = messagesRef.current
    const lastUser = all.findLastIndex((m) => m.role === "user")
    if (lastUser === -1) return
    // The saved answer to replace, if the server got as far as saving one.
    const failed = all
      .slice(lastUser + 1)
      .findLast((m) => m.role === "assistant")
    const history = all.slice(0, lastUser + 1)
    messagesRef.current = history
    setMessages(history)
    void run(all[lastUser]!.content, failed?.serverId)
  }, [run])

  const newChat = useCallback(() => {
    controller.current?.abort()
    messagesRef.current = []
    setMessages([])
    setThread(null)
    setStatus("idle")
  }, [setThread])

  return {
    state: { isOpen, messages, status, threadId },
    setOpen: setIsOpen,
    toggleChat,
    openChat,
    closeChat,
    sendMessage,
    stop,
    retry,
    newChat,
    openThread,
  }
}
