// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { ImageMedia, VideoMedia } from "@/components/docs/media"

import type { SchoolChatbotContext } from "./prompts"

export interface ChatMessage {
  id: string
  /** The saved row's id, once the server has it (what Retry names). */
  serverId?: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp?: Date
  /** Guide, tutorial video and screenshots attached to a support answer. */
  resources?: ChatResource[]
  /** A failure shown as a bubble — never sent back to the model as history. */
  kind?: "error"
  /** The answer stopped early (Stop, a dropped connection, a provider fault). */
  partial?: boolean
  /** What to say under a partial answer — localized, from the server. */
  notice?: string
  /** Their verdict on this answer: 1 helpful, -1 not. */
  feedback?: 1 | -1
}

/**
 * A help resource the server attaches to a support answer — resolved from
 * the support registry + media-manifest.json, never from LLM output.
 */
export interface ChatResource {
  /** `page`: the dashboard page the guide is about, opened in place. */
  kind: "guide" | "video" | "image" | "page"
  title: string
  /** Guide path (`/${locale}/docs/support/...`) or the full CDN image. */
  href: string
  /** Poster (video) or small still (image); absent for a guide. */
  thumb?: string
  /** Seconds — videos only. */
  duration?: number
  /** The manifest entry itself, so the card plays the video in the chat. */
  video?: VideoMedia
  /** The manifest entry itself, so the card opens the still in the chat. */
  image?: ImageMedia
}

/**
 * The first line of a `/api/chatbot` response: what is known before the
 * model starts — the cards under the answer, and the bubble to show if the
 * reply comes back empty.
 */
export interface ChatMeta {
  resources: ChatResource[]
  fallback: string
  /** Localized "the answer was cut off", for a stream that breaks. */
  cutOff: string
}

/**
 * `waiting` — sent, no word back yet (the typing dots); `streaming` — the
 * answer is arriving; `error` — the last request failed before any answer.
 */
export type ChatStatus = "idle" | "waiting" | "streaming" | "error"

export interface ChatbotState {
  isOpen: boolean
  messages: ChatMessage[]
  status: ChatStatus
  /** The saved conversation on screen; null for a new one. */
  threadId: string | null
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
  listening: string

  errorBubble: string

  // Welcomes (mode-specific)
  welcomeSaas: string
  welcomeSupport: string
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
  ctaHelpCenter: string
  ctaEmailSupport: string

  // Support resources attached under an answer
  resourceVideo: string
  resourceClose: string
  resourceFullSize: string
  resourceGuide: string

  // Pricing-page proactive nudge
  pricingNudgeTitle: string
  pricingNudgeBody: string

  // System prompts (templates with placeholders)
  saasPromptTemplate: string // {pricing}, {features}, {support}, {contactEmail}
  schoolPromptIntroTemplate: string // {schoolName}
  schoolPromptRules: string
  supportPromptTemplate: string // {schoolName}, {role}, {support}, {contactEmail}

  // How the support prompt names the signed-in user's role
  roleAdmin: string
  roleTeacher: string
  roleParent: string
  roleStudent: string
  roleAccountant: string
  roleStaff: string

  // School prompt section headers
  schoolHeaderAcademic: string
  schoolHeaderAdmissionOpen: string
  schoolHeaderAdmissionSoon: string
  schoolHeaderAdmissionClosed: string
  schoolHeaderFeesDetailed: string
  schoolHeaderFeesBasic: string
  schoolHeaderScholarships: string
  schoolHeaderEvents: string
  schoolHeaderContact: string

  // School prompt body phrases
  schoolPhraseAbout: string
  schoolPhraseType: string
  schoolPhraseLevel: string
  schoolPhraseCurriculum: string
  schoolPhraseGrades: string
  schoolPhraseOpenUntil: string
  schoolPhraseSeatsAvailable: string
  schoolPhraseApplicationFee: string
  schoolPhraseRegistrationFee: string
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
  schoolPhraseAt: string

  // Quick-ask labels (existing)
  saasFeatures: string
  saasFeaturesQuestion: string
  saasPricing: string
  saasPricingQuestion: string
  saasGetStarted: string
  saasGetStartedQuestion: string
  saasSupport: string
  saasSupportQuestion: string
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

/**
 * `schoolSupport` is the dashboard's tech-support desk: a signed-in school
 * member asking how to use the product. The server reads their role and
 * school from the session — the client only uses `supportRole` for the
 * quick-ask buttons.
 */
export type PromptType = "saasMarketing" | "schoolSite" | "schoolSupport"

/** The help-center audience a signed-in user belongs to. */
export type SupportRole = "admin" | "teacher" | "parent" | "student"

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
/** One row of the chats sheet. */
export interface ChatSummary {
  id: string
  title: string
  status: "OPEN" | "RESOLVED" | "ESCALATED"
  /** ISO time of the newest message. */
  lastMessageAt: string
}

export interface CtaChip {
  label: string
  href: string
  /** Leaves this site (the main-domain help center, mail): a new tab. */
  external?: boolean
}

export interface ChatbotProps {
  config?: ChatbotConfig
  className?: string
  promptType?: PromptType
  subdomain?: string
  /** Dashboard support mode: the viewer's audience, for the quick asks. */
  supportRole?: SupportRole
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

export interface PanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  messages: ChatMessage[]
  status: ChatStatus
  onSend: (message: string) => void
  onStop: () => void
  onRetry: () => void
  onNewChat: () => void
  /** The saved conversation on screen, and how to switch to another. */
  threadId: string | null
  onOpenThread: (threadId: string) => Promise<boolean>
  /** Helpful / not helpful on a saved answer. */
  onRate: (messageId: string, value: 1 | -1) => void
  /** They took a next step out of the chat. */
  onEscalate: () => void
  locale: "en" | "ar"
  dictionary: ChatbotDictionary
  promptType: PromptType
  schoolContext?: SchoolChatbotDisplay | null
  supportRole?: SupportRole
}

export interface ChatbotHookConfig {
  apiEndpoint?: string
  onError?: (error: string) => void
  enablePersistence?: boolean
  storageKey?: string
  maxMessages?: number
}
