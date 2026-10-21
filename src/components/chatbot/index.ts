// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Main Components
export { Chatbot } from "./chatbot"
export { ChatbotContent } from "./content"
export { ChatButton } from "./chat-button"
export { Panel } from "./panel"

// Hook
export { useChatbot } from "./use-chatbot"

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
  ChatStatus,
  PanelProps,
  ChatbotHookConfig,
} from "./type"

// Constants
export { DEFAULT_CONFIG, DEFAULT_THEME } from "./constant"

// Utilities
export { mergeConfig } from "./utils"
