"use client"

import { forwardRef, useEffect, useImperativeHandle } from "react"

import { useLocale } from "@/components/internationalization/use-locale"

import { ChatButton } from "./chat-button"
import { ChatWindow } from "./chat-window"
import { DEFAULT_CONFIG, DEFAULT_DICTIONARY } from "./constant"
import type { ChatbotDictionary, ChatbotProps, PromptType } from "./type"
import { useChatbot } from "./use-chatbot"

interface ChatbotContentProps extends ChatbotProps {
  dictionary?: Partial<ChatbotDictionary>
  promptType?: PromptType
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

    const handleSendMessage = async (message: string) => {
      await sendMessage(message)
      if (onMessageSend) {
        onMessageSend(message)
      }
    }

    return (
      <>
        <ChatButton
          onClick={toggleChat}
          isOpen={state.isOpen}
          position={chatbotConfig.position}
          locale={chatbotConfig.locale}
          dictionary={fullDictionary}
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
        />
      </>
    )
  }
)

ChatbotContent.displayName = "ChatbotContent"
