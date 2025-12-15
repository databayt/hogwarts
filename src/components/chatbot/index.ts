// Main Components
export { Chatbot } from "./chatbot"
export { ChatbotContent } from "./content"
export { ChatButton } from "./chat-button"
export { ChatWindow } from "./chat-window"

// Hook
export { useChatbot } from "./use-chatbot"
export { getClientDictionary } from "./dictionary-client"

// Types
export type {
  ChatMessage,
  ChatbotState,
  ChatbotTheme,
  ChatbotAPIConfig,
  ChatbotDictionary,
  ChatbotConfig,
  ChatbotProps,
  ChatButtonProps,
  ChatWindowProps,
  ChatbotHookConfig,
} from "./type"

// Constants
export { DEFAULT_CONFIG, DEFAULT_THEME, DEFAULT_DICTIONARY } from "./constant"

// Utilities
export { mergeConfig } from "./utils"
