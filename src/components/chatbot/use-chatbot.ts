"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useEffect, useRef, useState } from "react"

import { CHAT_HISTORY_TURNS } from "./constant"
import type { SystemPromptType } from "./prompts"
import { readEvents } from "./sse"
import type { ChatMessage, ChatResource, ChatStatus } from "./type"

/** A failure the server already worded for the visitor. */
class ChatError extends Error {}

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

/**
 * The chat's client state. One request at a time, cancellable: Stop aborts
 * the fetch, the server sees the disconnect and stops the model, and what
 * already arrived stays as a partial answer. Streamed pieces are painted
 * once per animation frame, not once per piece.
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
  const messagesRef = useRef<ChatMessage[]>([])
  const controller = useRef<AbortController | null>(null)

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  // Leaving the page (or the layout that mounts the bot) ends the request.
  useEffect(() => () => controller.current?.abort(), [])

  const toggleChat = useCallback(() => setIsOpen((prev) => !prev), [])
  const openChat = useCallback(() => setIsOpen(true), [])
  const closeChat = useCallback(() => setIsOpen(false), [])

  /** Ask the server about `history` (which ends with the user's message). */
  const run = useCallback(
    async (history: ChatMessage[]) => {
      controller.current?.abort()
      const abort = new AbortController()
      controller.current = abort

      const id = newId()
      let content = ""
      let resources: ChatResource[] | undefined
      let partial = false
      let notice: string | undefined
      let frame = 0
      const paint = () => {
        frame = 0
        const next: ChatMessage = {
          id,
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
        // Only the window the server reads; older turns stay on screen. A
        // failure bubble is ours, not the assistant's — it never goes back.
        const sent = history
          .filter(
            (m) =>
              (m.role === "user" || m.role === "assistant") &&
              m.kind !== "error" &&
              m.content.trim()
          )
          .slice(-CHAT_HISTORY_TURNS)
          .map((m) => ({ role: m.role, content: m.content }))

        const res = await fetch("/api/chatbot", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            messages: sent,
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
          throw new ChatError(body.error || errorText)
        }

        for await (const event of readEvents(res.body)) {
          if (event.event === "resources") {
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
                m.id === id ? { ...m, content, resources, partial: true } : m
              )
            )
          } else {
            setMessages((prev) => prev.filter((m) => m.id !== id))
          }
          if (controller.current === abort) setStatus("idle")
          return
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
              m.id === id ? { ...m, kind: "error", content: bubble } : m
            )
          )
        }
        setStatus("error")
      } finally {
        if (controller.current === abort) controller.current = null
      }
    },
    [promptType, subdomain, locale, errorText]
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
      void run(history)
    },
    [run]
  )

  const stop = useCallback(() => controller.current?.abort(), [])

  /** Ask the latest question again, replacing the answer that failed. */
  const retry = useCallback(() => {
    if (controller.current) return
    const all = messagesRef.current
    let lastUser = -1
    for (let i = all.length - 1; i >= 0; i--)
      if (all[i]!.role === "user") {
        lastUser = i
        break
      }
    if (lastUser === -1) return
    const history = all.slice(0, lastUser + 1)
    messagesRef.current = history
    setMessages(history)
    void run(history)
  }, [run])

  const newChat = useCallback(() => {
    controller.current?.abort()
    messagesRef.current = []
    setMessages([])
    setStatus("idle")
  }, [])

  return {
    state: { isOpen, messages, status },
    setOpen: setIsOpen,
    toggleChat,
    openChat,
    closeChat,
    sendMessage,
    stop,
    retry,
    newChat,
  }
}
