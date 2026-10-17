"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useState } from "react"
import type { CoreMessage } from "ai"

import { sendMessage as sendMessageAction } from "./actions"
import type { SystemPromptType } from "./prompts"
import type { ChatbotState, ChatMessage } from "./type"

/** A failure the server already worded for the visitor. */
class ChatError extends Error {}

interface UseChatbotOptions {
  promptType?: SystemPromptType
  subdomain?: string
  locale?: string
  /** The bubble shown when the action fails — localized by the caller. */
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
        // Convert messages to CoreMessage format for the server action
        const coreMessages: CoreMessage[] = [...messages, userMessage].map(
          (msg) => ({
            role: msg.role as "user" | "assistant",
            content: msg.content,
          })
        )

        const result = await sendMessageAction(
          coreMessages,
          promptType,
          subdomain,
          locale
        )

        if (!result.success) {
          // The action's own errors (rate limit, sign-in) are written for
          // people in their language — show them as they are.
          throw new ChatError(result.error || errorText)
        }

        // Add assistant message
        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: result.content || "",
          resources: result.resources,
          id: Date.now().toString() + "_ai",
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, assistantMessage])
      } catch (err) {
        console.error("Chat error:", err)
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error occurred"
        setError(errorMessage)

        // The bubble speaks the visitor's language; a raw network or
        // runtime error stays in the console.
        const bubble = err instanceof ChatError ? err.message : errorText
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
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
