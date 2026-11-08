"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from "react"
import dynamic from "next/dynamic"

import { useLocale } from "@/components/internationalization/use-locale"

import { ChatButton } from "./chat-button"
import { DEFAULT_CONFIG } from "./constant"
import type {
  ChatbotDictionary,
  ChatbotProps,
  PromptType,
  SchoolChatbotDisplay,
} from "./type"
import { useChatbot } from "./use-chatbot"

// The chat window (messages, composer, markdown, resource cards) is most of
// the assistant's code and nobody needs it to read the page. Only the button
// ships with the page; the window's chunk is fetched when the browser is idle
// and mounted on the first open.
const loadPanel = () => import("./panel").then((m) => m.Panel)
const Panel = dynamic(loadPanel, { ssr: false })

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

    // Mount the window on its first open and keep it mounted after, so the
    // close animation still plays.
    const [panelMounted, setPanelMounted] = useState(false)
    if (state.isOpen && !panelMounted) setPanelMounted(true)

    // Warm the window's chunk once the page is idle, so the first tap opens
    // it at once instead of waiting on the network.
    useEffect(() => {
      const warm = () => void loadPanel()
      if ("requestIdleCallback" in window) {
        const id = window.requestIdleCallback(warm, { timeout: 4000 })
        return () => window.cancelIdleCallback(id)
      }
      const id = setTimeout(warm, 2500)
      return () => clearTimeout(id)
    }, [])

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

        {panelMounted && (
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
        )}
      </>
    )
  }
)

ChatbotContent.displayName = "ChatbotContent"
