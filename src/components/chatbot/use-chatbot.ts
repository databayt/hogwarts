"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useState } from "react"

import { CHAT_HISTORY_TURNS } from "./constant"
import type { SystemPromptType } from "./prompts"
import type { ChatbotState, ChatMessage, ChatMeta } from "./type"

/** A failure the server already worded for the visitor. */
class ChatError extends Error {}

interface UseChatbotOptions {
  promptType?: SystemPromptType
  subdomain?: string
  locale?: string
  /** The bubble shown when the request fails — localized by the caller. */
  errorText?: string
}

export function useChatbot({
  promptType = "saasMarketing",
  subdomain,
  locale = "en",
  errorText = "Sorry, something went wrong. Please try again in a moment.",
}: UseChatbotOptions = {}) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | undefined>()

  const toggleChat = useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])

  const openChat = useCallback(() => {
    setIsOpen(true)
  }, [])

  const closeChat = useCallback(() => {
    setIsOpen(false)
  }, [])

  const sendMessage = useCallback(
    async (content: string) => {
      // Clear any previous errors
      setError(undefined)
      setIsLoading(true)

      // Add user message immediately
      const userMessage: ChatMessage = {
        role: "user",
        content,
        id: Date.now().toString(),
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, userMessage])

      try {
        // Only the window the server reads; older turns stay on screen. A
        // failure bubble is ours, not the assistant's — it never goes back.
        const history = [...messages, userMessage]
          .filter(
            (msg) =>
              (msg.role === "user" || msg.role === "assistant") &&
              msg.kind !== "error"
          )
          .slice(-CHAT_HISTORY_TURNS)
          .map((msg) => ({ role: msg.role, content: msg.content }))

        const res = await fetch("/api/chatbot", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            messages: history,
            promptType,
            subdomain,
            locale,
          }),
        })

        if (!res.ok || !res.body) {
          // The route's own errors (rate limit, sign-in) are written for
          // people in their language — show them as they are.
          const body = (await res.json().catch(() => ({}))) as {
            error?: string
          }
          throw new ChatError(body.error || errorText)
        }

        // Body: one JSON line of ChatMeta, then the reply as it streams.
        const id = Date.now().toString() + "_ai"
        const reader = res.body.pipeThrough(new TextDecoderStream()).getReader()
        let meta: ChatMeta | null = null
        let head = ""
        let content = ""
        const show = () => {
          const next: ChatMessage = {
            role: "assistant",
            content: content.trim(),
            resources: meta?.resources,
            id,
            timestamp: new Date(),
          }
          setMessages((prev) =>
            prev.some((m) => m.id === id)
              ? prev.map((m) => (m.id === id ? next : m))
              : [...prev, next]
          )
        }

        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          if (!meta) {
            head += value
            const nl = head.indexOf("\n")
            if (nl === -1) continue
            meta = JSON.parse(head.slice(0, nl)) as ChatMeta
            content = head.slice(nl + 1)
          } else {
            content += value
          }
          if (content.trim()) show()
        }

        if (!content.trim()) {
          content = meta?.fallback || errorText
          show()
        }
      } catch (err) {
        console.error("Chat error:", err)
        // The bubble and the error line speak the visitor's language; a raw
        // network or runtime error stays in the console.
        const bubble = err instanceof ChatError ? err.message : errorText
        setError(bubble)
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            kind: "error",
            content: bubble,
            id: Date.now().toString() + "_error",
            timestamp: new Date(),
          },
        ])
      } finally {
        setIsLoading(false)
      }
    },
    [messages, promptType, subdomain, locale, errorText]
  )

  const clearMessages = useCallback(() => {
    setMessages([])
    setError(undefined)
  }, [])

  const state: ChatbotState = {
    isOpen,
    messages,
    isLoading,
    error,
  }

  return {
    state,
    toggleChat,
    openChat,
    closeChat,
    sendMessage,
    clearMessages,
  }
}
