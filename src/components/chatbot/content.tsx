"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { forwardRef, useEffect, useImperativeHandle } from "react"

import { useLocale } from "@/components/internationalization/use-locale"

import { ChatButton } from "./chat-button"
import { ChatWindow } from "./chat-window"
import { DEFAULT_CONFIG, DEFAULT_DICTIONARY } from "./constant"
import type {
  ChatbotDictionary,
  ChatbotProps,
  PromptType,
  SchoolChatbotDisplay,
} from "./type"
import { useChatbot } from "./use-chatbot"

interface ChatbotContentProps extends ChatbotProps {
  dictionary?: Partial<ChatbotDictionary>
  promptType?: PromptType
  subdomain?: string
  schoolContext?: SchoolChatbotDisplay | null
}

export const ChatbotContent = forwardRef<
  { openChat: () => void },
  ChatbotContentProps
>(
  (
    {
      config = DEFAULT_CONFIG,
      onMessageSend,
      onChatOpen,
      onChatClose,
      dictionary = {},
      promptType = "saasMarketing",
      subdomain,
      schoolContext,
    },
    ref
  ) => {
    const { locale } = useLocale()
    const chatbotConfig = {
      ...DEFAULT_CONFIG,
      ...config,
      locale: locale as "en" | "ar",
    }
    const fullDictionary = {
      ...DEFAULT_DICTIONARY,
      ...dictionary,
    } as ChatbotDictionary

    const { state, toggleChat, openChat, closeChat, sendMessage } = useChatbot({
      promptType,
      subdomain,
      locale,
    })

    useImperativeHandle(
      ref,
      () => ({
        openChat,
      }),
      [openChat]
    )

    useEffect(() => {
      if (state.isOpen && onChatOpen) {
        onChatOpen()
      } else if (!state.isOpen && onChatClose) {
        onChatClose()
      }
    }, [state.isOpen, onChatOpen, onChatClose])

    useEffect(() => {
      const handleOpenChatbot = () => openChat()
      window.addEventListener("open-chatbot", handleOpenChatbot)
      return () => window.removeEventListener("open-chatbot", handleOpenChatbot)
    }, [openChat])

    const handleSendMessage = async (message: string) => {
      await sendMessage(message)
      if (onMessageSend) {
        onMessageSend(message)
      }
    }

    // For school mode, pick the locale-appropriate name for the avatar alt
    const schoolDisplayName =
      schoolContext &&
      (locale === "ar" ? schoolContext.schoolNameAr : schoolContext.schoolName)

    return (
      <>
        <ChatButton
          onClick={toggleChat}
          isOpen={state.isOpen}
          position={chatbotConfig.position}
          locale={chatbotConfig.locale}
          dictionary={fullDictionary}
          // The chatbot FAB is intentionally uniform across every tenant — the
          // generic robot, never the school logo. Per-school branding lives in
          // the site header, not the assistant.
          schoolLogoUrl={null}
          schoolName={schoolDisplayName ?? undefined}
        />

        <ChatWindow
          isOpen={state.isOpen}
          onClose={closeChat}
          messages={state.messages}
          onSendMessage={handleSendMessage}
          isLoading={state.isLoading}
          error={state.error}
          placeholder={chatbotConfig.placeholder}
          locale={chatbotConfig.locale}
          dictionary={fullDictionary}
          promptType={promptType}
          schoolContext={schoolContext}
        />
      </>
    )
  }
)

ChatbotContent.displayName = "ChatbotContent"
