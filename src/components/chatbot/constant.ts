// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { asset } from "@/lib/asset-url"

import type { ChatbotConfig, ChatbotDictionary, ChatbotTheme } from "./type"

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

/**
 * Defaults are only used when the chatbot is mounted without the dictionary
 * prop (legacy / standalone). In production the layout passes
 * `dictionary.chatbot` from i18n and these strings are overridden.
 */
export const DEFAULT_DICTIONARY: ChatbotDictionary = {
  // Core UI
  openChat: "Open chat",
  closeChat: "Close chat",
  placeholder: "Type your message...",
  welcomeMessage: "Hello! How can I help you today?",
  noMessages: "No messages yet. Start a conversation!",
  errorMessage: "Sorry, something went wrong. Please try again.",
  typing: "Typing...",
  send: "Send",
  retry: "Retry",
  chooseQuestion: "A great journey is about to begin.",
  sendMessage: "Send message",
  voiceInput: "Voice input",
  speechNotSupported: "Speech recognition is not supported in your browser.",
  speechError: "Speech recognition error. Please try again.",
  listening: "Listening...",

  // Welcomes
  welcomeSaas: "Welcome to Hogwarts.",
  welcomeSchoolTemplate: "Hi! I'm the {name} assistant",

  // CTA chip labels
  ctaTryFree: "Try free",
  ctaSeePricing: "See pricing",
  ctaViewFeatures: "View features",
  ctaBookDemo: "Book a demo",
  ctaStartApplication: "Start application",
  ctaBookTour: "Book a tour",
  ctaSendInquiry: "Send inquiry",
  ctaContactSchool: "Contact school",
  ctaViewScholarships: "View scholarships",
  ctaOpenDocs: "Read the docs",

  // Pricing nudge
  pricingNudgeTitle: "Comparing plans?",
  pricingNudgeBody: "I can help you pick the right plan in seconds.",

  // Prompt templates (placeholders only; real values come from dictionary)
  saasPromptTemplate: "",
  schoolPromptIntroTemplate: "",
  schoolPromptRules: "",

  // School prompt headers / phrases (no-op defaults — dictionary overrides)
  schoolHeaderAcademic: "Academic Structure",
  schoolHeaderAdmissionOpen: "Admission",
  schoolHeaderAdmissionSoon: "Admission",
  schoolHeaderAdmissionClosed: "Admission",
  schoolHeaderFeesDetailed: "Fees",
  schoolHeaderFeesBasic: "Fees",
  schoolHeaderScholarships: "Scholarships",
  schoolHeaderEvents: "Events",
  schoolHeaderAnnouncements: "Announcements",
  schoolHeaderContact: "Contact",
  schoolHeaderCapacity: "Capacity",
  schoolPhraseAbout: "About",
  schoolPhraseType: "Type",
  schoolPhraseLevel: "Level",
  schoolPhraseCurriculum: "Curriculum",
  schoolPhraseGrades: "Grades",
  schoolPhraseOpenUntil: "open until",
  schoolPhraseSeatsAvailable: "seats available",
  schoolPhraseApplicationFee: "application fee",
  schoolPhraseApplyOnline: "Visitors can apply online.",
  schoolPhraseNextAdmission: "Next admission period",
  schoolPhraseAdmissionOpens: "opens",
  schoolPhraseCheckBack: "Advise visitors to check back.",
  schoolPhraseNoCampaigns: "No admission campaigns are open.",
  schoolPhraseTotal: "total",
  schoolPhraseTuition: "tuition",
  schoolPhraseInstallment: "installment",
  schoolPhraseInstallments: "installments",
  schoolPhraseFullScholarship: "full scholarship",
  schoolPhrasePercentageCoverage: "% coverage",
  schoolPhraseAmountOff: "off",
  schoolPhrasePayment: "Payment",
  schoolPhrasePhone: "Phone",
  schoolPhraseEmail: "Email",
  schoolPhraseWebsite: "Website",
  schoolPhraseAddress: "Address",
  schoolPhraseStudents: "Students",
  schoolPhraseTeachers: "Teachers",
  schoolPhraseAt: "at",

  // Quick-ask labels
  saasFeatures: "Features",
  saasFeaturesQuestion: "What features does Databayt offer?",
  saasPricing: "Pricing",
  saasPricingQuestion: "What are the pricing plans?",
  saasGetStarted: "Get Started",
  saasGetStartedQuestion: "How do I get started with Databayt?",
  saasOpenSource: "Open Source",
  saasOpenSourceQuestion: "Is Databayt open source?",
  schoolAdmission: "Admission",
  schoolAdmissionQuestion: "How do I apply to this school?",
  schoolFees: "Fees",
  schoolFeesQuestion: "What are the school fees?",
  schoolContact: "Contact",
  schoolContactQuestion: "How can I contact the school?",
  schoolPrograms: "Programs",
  schoolProgramsQuestion: "What programs does the school offer?",
  schoolScholarships: "Scholarships",
  schoolScholarshipsQuestion: "What scholarships are available?",
  schoolEvents: "Events",
  schoolEventsQuestion: "What upcoming events does the school have?",
}

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
  dictionary: DEFAULT_DICTIONARY,
  theme: DEFAULT_THEME,
  avatar: asset("/illustrations/robot.png"),
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
