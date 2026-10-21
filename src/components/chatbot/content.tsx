"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
} from "react"

import { useLocale } from "@/components/internationalization/use-locale"

import { ChatButton } from "./chat-button"
import { DEFAULT_CONFIG } from "./constant"
import { Panel } from "./panel"
import type {
  ChatbotDictionary,
  ChatbotProps,
  PromptType,
  SchoolChatbotDisplay,
} from "./type"
import { useChatbot } from "./use-chatbot"

interface ChatbotContentProps extends ChatbotProps {
  /** UI strings only — `chatbot.tsx` strips the server-side prompt keys. */
  dictionary: ChatbotDictionary
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
      dictionary,
      promptType = "saasMarketing",
      subdomain,
      schoolContext,
      supportRole,
    },
    ref
  ) => {
    const { locale } = useLocale()
    const chatbotConfig = {
      ...DEFAULT_CONFIG,
      ...config,
      locale: locale as "en" | "ar",
    }
    const fullDictionary = dictionary

    const {
      state,
      setOpen,
      toggleChat,
      openChat,
      sendMessage,
      stop,
      retry,
      newChat,
      openThread,
      rate,
      escalate,
    } = useChatbot({
      promptType,
      subdomain,
      locale,
      errorText: fullDictionary.errorBubble,
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

    const handleSendMessage = useCallback(
      (message: string) => {
        sendMessage(message)
        onMessageSend?.(message)
      },
      [sendMessage, onMessageSend]
    )

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

        <Panel
          open={state.isOpen}
          onOpenChange={setOpen}
          messages={state.messages}
          status={state.status}
          onSend={handleSendMessage}
          onStop={stop}
          onRetry={retry}
          onNewChat={newChat}
          threadId={state.threadId}
          onOpenThread={openThread}
          onRate={rate}
          onEscalate={escalate}
          locale={chatbotConfig.locale}
          dictionary={fullDictionary}
          promptType={promptType}
          schoolContext={schoolContext}
          supportRole={supportRole}
        />
      </>
    )
  }
)

ChatbotContent.displayName = "ChatbotContent"
