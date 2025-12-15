import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"

import { ChatbotContent } from "./content"
import type { ChatbotProps, PromptType } from "./type"

interface ChatbotWrapperProps extends ChatbotProps {
  lang: Locale
  promptType?: PromptType
}

export async function Chatbot({
  lang,
  promptType = "saasMarketing",
  ...props
}: ChatbotWrapperProps) {
  const dictionary = await getDictionary(lang)

  return (
    <ChatbotContent
      {...props}
      dictionary={dictionary.chatbot}
      promptType={promptType}
    />
  )
}
