// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { asset } from "@/lib/asset-url"

import type { ChatbotConfig, ChatbotTheme } from "./type"

export const CHATBOT_POSITIONS = {
  "bottom-right": "fixed bottom-1 end-1 sm:bottom-2 sm:end-2",
  "bottom-left": "fixed bottom-1 start-1 sm:bottom-2 sm:start-2",
  "top-right": "fixed top-1 end-1 sm:top-2 sm:end-2",
  "top-left": "fixed top-1 start-1 sm:top-2 sm:start-2",
} as const

export const CHAT_WINDOW_POSITIONS = {
  "bottom-right":
    "fixed inset-x-4 top-1/2 -translate-y-1/2 sm:inset-x-auto sm:translate-y-0 sm:bottom-4 sm:end-2 sm:top-auto",
  "bottom-left":
    "fixed inset-x-4 top-1/2 -translate-y-1/2 sm:inset-x-auto sm:translate-y-0 sm:bottom-4 sm:start-2 sm:top-auto",
  "top-right":
    "fixed inset-x-4 top-1/2 -translate-y-1/2 sm:inset-x-auto sm:translate-y-0 sm:top-20 sm:end-2",
  "top-left":
    "fixed inset-x-4 top-1/2 -translate-y-1/2 sm:inset-x-auto sm:translate-y-0 sm:top-20 sm:start-2",
} as const

export const CHAT_WINDOW_SIZE = {
  width: "w-auto sm:w-80",
  height: "h-[400px] sm:h-[450px]",
  maxHeight: "max-h-[80vh] sm:max-h-[80vh]",
} as const

export const DEFAULT_THEME: ChatbotTheme = {
  primaryColor: "hsl(var(--primary))",
  backgroundColor: "hsl(var(--background))",
  textColor: "hsl(var(--foreground))",
  borderRadius: "0.5rem",
  fontFamily: "inherit",
  buttonSize: "lg",
  windowWidth: "w-full sm:w-96",
  windowHeight: "h-[400px] sm:h-[450px]",
  shadowLevel: "xl",
}

export const DEFAULT_CONFIG: Required<
  Omit<ChatbotConfig, "api"> & { api: ChatbotConfig["api"] }
> = {
  position: "bottom-right",
  welcomeMessage: "Hello! How can I help you today?",
  placeholder: "Type your message...",
  title: "Chat Support",
  subtitle: "We're here to help",
  locale: "en",
  dictionary: {},
  theme: DEFAULT_THEME,
  avatar: asset("/illustrations/robot-fill.png"),
  // The chatbot does not consume `api` — `actions.ts:sendMessage` calls Groq
  // directly via the AI SDK. This field is preserved as `undefined` to keep
  // the public `ChatbotConfig` type backwards-compatible.
  api: undefined,
  enableTypingIndicator: true,
  enableTimestamps: false,
  enableSounds: false,
  enablePersistence: false,
  autoOpen: false,
  autoOpenDelay: 3000,
  maxMessages: 100,
  storageKey: "chatbot-messages",
}

export const BUTTON_SIZES = {
  sm: "h-12 w-12 p-2",
  md: "h-14 w-14 p-3",
  lg: "h-16 w-16 p-3",
} as const

export const ICON_SIZES = {
  sm: "h-6 w-6",
  md: "h-7 w-7",
  lg: "h-8 w-8",
} as const

export const SHADOW_LEVELS = {
  none: "shadow-none",
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
  xl: "shadow-2xl",
} as const

export const ANIMATION_DURATION = 200
export const MAX_MESSAGE_LENGTH = 1000
export const TYPING_INDICATOR_DELAY = 1000

/**
 * localStorage key for the /pricing proactive nudge. Stored value is either
 * `dismissed` (user closed quickly — never re-trigger) or `shown:<isoDate>`
 * (last shown timestamp; respect a 30-day cooldown).
 */
export const PRICING_NUDGE_STORAGE_KEY = "hogwarts.chatbot.pricingNudge"
export const PRICING_NUDGE_DELAY_MS = 30_000
export const PRICING_NUDGE_COOLDOWN_DAYS = 30

/** Where support and sales questions the bot can't answer go. */
export const CONTACT_EMAIL = "contact@databayt.org"

/** Turns sent per request — the server keeps the same window. */
export const CHAT_HISTORY_TURNS = 10
