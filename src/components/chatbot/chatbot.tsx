// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"

import { getSchoolChatbotDisplay } from "./actions"
import { ChatbotContent } from "./content"
import type { ChatbotProps, PromptType } from "./type"

interface ChatbotWrapperProps extends ChatbotProps {
  lang: Locale
  promptType?: PromptType
  subdomain?: string
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
      dictionary={dictionary.chatbot}
      promptType={promptType}
      subdomain={subdomain}
      schoolContext={schoolContext}
    />
  )
}
