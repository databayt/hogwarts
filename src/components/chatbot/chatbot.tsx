// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"

import { getSchoolChatbotDisplay } from "./server"
import { ChatbotContent } from "./content"
import type { ChatbotDictionary, ChatbotProps, PromptType } from "./type"

interface ChatbotWrapperProps extends ChatbotProps {
  lang: Locale
  promptType?: PromptType
  subdomain?: string
}

/**
 * Keys only the server reads to build a system prompt. They stay out of the
 * client props — the browser gets the UI strings, never the prompt text.
 */
const SERVER_ONLY_KEY = /Prompt|^schoolHeader|^schoolPhrase|^role[A-Z]|^reply[A-Z]/

function clientDictionary(chatbot: Record<string, string>): ChatbotDictionary {
  return Object.fromEntries(
    Object.entries(chatbot).filter(([key]) => !SERVER_ONLY_KEY.test(key))
  ) as ChatbotDictionary
}

export async function Chatbot({
  lang,
  promptType = "saasMarketing",
  subdomain,
  ...props
}: ChatbotWrapperProps) {
  // The dashboard desk needs no school marketing data — the server action
  // reads the member's school and role from the session on every message.
  const [dictionary, schoolContext] = await Promise.all([
    getDictionary(lang),
    subdomain && promptType === "schoolSite"
      ? getSchoolChatbotDisplay(subdomain)
      : Promise.resolve(null),
  ])

  return (
    <ChatbotContent
      {...props}
      dictionary={clientDictionary(dictionary.chatbot)}
      promptType={promptType}
      subdomain={subdomain}
      schoolContext={schoolContext}
    />
  )
}
