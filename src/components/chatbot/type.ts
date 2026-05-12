// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { SchoolChatbotContext } from "./prompts"

export interface ChatMessage {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp?: Date
}

export interface ChatbotState {
  isOpen: boolean
  messages: ChatMessage[]
  isLoading: boolean
  error?: string
}

export interface ChatbotTheme {
  primaryColor?: string
  backgroundColor?: string
  textColor?: string
  borderRadius?: string
  fontFamily?: string
  buttonSize?: "sm" | "md" | "lg"
  windowWidth?: string
  windowHeight?: string
  shadowLevel?: "none" | "sm" | "md" | "lg" | "xl"
}

export interface ChatbotAPIConfig {
  endpoint?: string
  model?: string
  systemPrompt?: string
  maxTokens?: number
  temperature?: number
  headers?: Record<string, string>
}

/**
 * Strongly-typed dictionary keys consumed by the chatbot UI.
 * The index signature `[key: string]: string` keeps it tolerant of
 * extra keys (e.g. unrelated dictionary entries that sneak in via
 * `dictionary.chatbot`), so all values are flat strings.
 */
export interface ChatbotDictionary {
  // Core UI
  openChat: string
  closeChat: string
  placeholder: string
  welcomeMessage: string
  noMessages: string
  errorMessage: string
  typing: string
  send: string
  retry: string
  chooseQuestion: string
  sendMessage: string
  voiceInput: string
  speechNotSupported: string
  speechError: string
  ttsEnabled: string
  ttsDisabled: string
  listening: string

  // Welcomes (mode-specific)
  welcomeSaas: string
  welcomeSchoolTemplate: string // contains {name} placeholder

  // CTA chip labels
  ctaTryFree: string
  ctaSeePricing: string
  ctaViewFeatures: string
  ctaBookDemo: string
  ctaStartApplication: string
  ctaBookTour: string
  ctaSendInquiry: string
  ctaContactSchool: string
  ctaViewScholarships: string
  ctaOpenDocs: string

  // Pricing-page proactive nudge
  pricingNudgeTitle: string
  pricingNudgeBody: string

  // System prompts (templates with placeholders)
  saasPromptTemplate: string // {pricing}, {features}, {contactEmail}
  schoolPromptIntroTemplate: string // {schoolName}
  schoolPromptRules: string

  // School prompt section headers
  schoolHeaderAcademic: string
  schoolHeaderAdmissionOpen: string
  schoolHeaderAdmissionSoon: string
  schoolHeaderAdmissionClosed: string
  schoolHeaderFeesDetailed: string
  schoolHeaderFeesBasic: string
  schoolHeaderScholarships: string
  schoolHeaderEvents: string
  schoolHeaderAnnouncements: string
  schoolHeaderContact: string
  schoolHeaderCapacity: string

  // School prompt body phrases
  schoolPhraseAbout: string
  schoolPhraseType: string
  schoolPhraseLevel: string
  schoolPhraseCurriculum: string
  schoolPhraseGrades: string
  schoolPhraseOpenUntil: string
  schoolPhraseSeatsAvailable: string
  schoolPhraseApplicationFee: string
  schoolPhraseApplyOnline: string
  schoolPhraseNextAdmission: string
  schoolPhraseAdmissionOpens: string
  schoolPhraseCheckBack: string
  schoolPhraseNoCampaigns: string
  schoolPhraseTotal: string
  schoolPhraseTuition: string
  schoolPhraseInstallment: string
  schoolPhraseInstallments: string
  schoolPhraseFullScholarship: string
  schoolPhrasePercentageCoverage: string
  schoolPhraseAmountOff: string
  schoolPhrasePayment: string
  schoolPhrasePhone: string
  schoolPhraseEmail: string
  schoolPhraseWebsite: string
  schoolPhraseAddress: string
  schoolPhraseStudents: string
  schoolPhraseTeachers: string
  schoolPhraseAt: string

  // Quick-ask labels (existing)
  saasFeatures: string
  saasFeaturesQuestion: string
  saasPricing: string
  saasPricingQuestion: string
  saasGetStarted: string
  saasGetStartedQuestion: string
  saasOpenSource: string
  saasOpenSourceQuestion: string
  schoolAdmission: string
  schoolAdmissionQuestion: string
  schoolFees: string
  schoolFeesQuestion: string
  schoolContact: string
  schoolContactQuestion: string
  schoolPrograms: string
  schoolProgramsQuestion: string
  schoolScholarships: string
  schoolScholarshipsQuestion: string
  schoolEvents: string
  schoolEventsQuestion: string

  [key: string]: string
}

export interface ChatbotConfig {
  // Positioning and Layout
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left"

  // Content and Messaging
  welcomeMessage?: string
  placeholder?: string
  title?: string
  subtitle?: string

  // Localization
  locale?: "en" | "ar"
  dictionary?: Partial<ChatbotDictionary>

  // Appearance
  theme?: ChatbotTheme
  avatar?: string

  // API Configuration
  api?: ChatbotAPIConfig

  // Features
  enableTypingIndicator?: boolean
  enableTimestamps?: boolean
  enableSounds?: boolean
  enablePersistence?: boolean

  // Behavior
  autoOpen?: boolean
  autoOpenDelay?: number
  maxMessages?: number
  storageKey?: string
}

export type PromptType = "saasMarketing" | "schoolSite"

/**
 * Display fields for the school site mode — what the client needs to render
 * personalised welcome + avatar without re-fetching the school.
 *
 * Carried alongside `SchoolChatbotContext` which already holds the booleans
 * driving CTA chip visibility.
 */
export interface SchoolChatbotDisplay extends SchoolChatbotContext {
  schoolName: string
  schoolNameAr: string
  logoUrl: string | null
}

/**
 * One CTA chip rendered below the most recent assistant message.
 * Computed client-side from `promptType` + school context — never from LLM output.
 */
export interface CtaChip {
  label: string
  href: string
}

export interface ChatbotProps {
  config?: ChatbotConfig
  className?: string
  promptType?: PromptType
  subdomain?: string
  onMessageSend?: (message: string) => void
  onChatOpen?: () => void
  onChatClose?: () => void
  onError?: (error: string) => void
  children?: React.ReactNode
}

export interface ChatButtonProps {
  onClick: () => void
  isOpen: boolean
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left"
  locale?: "en" | "ar"
  dictionary: ChatbotDictionary
  theme?: ChatbotTheme
  avatar?: string
  /** School logo for personalised FAB on subdomain marketing pages */
  schoolLogoUrl?: string | null
  /** School name used as alt text for the avatar */
  schoolName?: string
}

export interface ChatWindowProps {
  isOpen: boolean
  onClose: () => void
  messages: ChatMessage[]
  onSendMessage: (message: string) => void
  isLoading: boolean
  error?: string
  placeholder?: string
  locale?: "en" | "ar"
  dictionary: ChatbotDictionary
  theme?: ChatbotTheme
  title?: string
  subtitle?: string
  promptType?: PromptType
  schoolContext?: SchoolChatbotDisplay | null
  enableTypingIndicator?: boolean
  enableTimestamps?: boolean
}

export interface ChatbotHookConfig {
  apiEndpoint?: string
  onError?: (error: string) => void
  enablePersistence?: boolean
  storageKey?: string
  maxMessages?: number
}
