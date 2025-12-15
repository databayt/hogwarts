"use client"

import { useCallback, useState } from "react"
import type { CoreMessage } from "ai"

import { sendMessage as sendMessageAction } from "./actions"
import type { SystemPromptType } from "./prompts"
import type { ChatbotState, ChatMessage } from "./type"

interface UseChatbotOptions {
  promptType?: SystemPromptType
}

export function useChatbot({
  promptType = "saasMarketing",
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

        // Call the server action with the prompt type
        const result = await sendMessageAction(coreMessages, promptType)

        if (!result.success) {
          throw new Error(result.error || "Failed to send message")
        }

        // Add assistant message
        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: result.content || "",
          id: Date.now().toString() + "_ai",
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, assistantMessage])
      } catch (err) {
        console.error("Chat error:", err)
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error occurred"
        setError(errorMessage)

        // Add error message
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Sorry, there was an error: ${errorMessage}`,
            id: Date.now().toString() + "_error",
            timestamp: new Date(),
          },
        ])
      } finally {
        setIsLoading(false)
      }
    },
    [messages, promptType]
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
