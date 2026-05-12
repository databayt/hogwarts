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
  const [dictionary, schoolContext] = await Promise.all([
    getDictionary(lang),
    subdomain ? getSchoolChatbotDisplay(subdomain) : Promise.resolve(null),
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
