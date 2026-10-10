"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { headers } from "next/headers"
import { createGroq } from "@ai-sdk/groq"
import { CoreMessage, generateText } from "ai"

import { db } from "@/lib/db"
import { extractIdentifiers } from "@/lib/funnel/identifiers"
import { checkUserRateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { getExchangeRates } from "@/components/saas-marketing/pricing/exchange-rates"

import { captureFromChat } from "./capture"
import {
  buildSaasMarketingPrompt,
  buildSchoolSitePrompt,
  deriveSchoolContext,
  type SchoolChatbotData,
  type SystemPromptType,
} from "./prompts"
import {
  isHelpIndexQuestion,
  isSupportQuestion,
  matchTopics,
  SUPPORT_TOPICS,
  type SupportTopic,
} from "./support"
import { resourcesFor } from "./support-media"
import type {
  ChatbotDictionary,
  ChatResource,
  SchoolChatbotDisplay,
} from "./type"

/**
 * Groq retired `llama-3.1-8b-instant` and every reply in prod became an
 * English "model does not exist" error (found 2026-09-28; the translation
 * lane hit the same wall on 09-09 and moved to gpt-oss-20b — see
 * `src/components/translation/groq.ts`). A dead default is a dead chatbot:
 * check `GET api.groq.com/openai/v1/models` before trusting it.
 */
const CHAT_MODEL = process.env.GROQ_CHAT_MODEL ?? "openai/gpt-oss-20b"

/**
 * Returns the display + visibility context the chatbot client needs:
 * personalised welcome (school name), branded avatar (logo), and the
 * boolean flags that decide which CTA chips to surface.
 *
 * Returns `null` when the subdomain doesn't resolve to a school —
 * the client falls back to the SaaS welcome.
 */
export async function getSchoolChatbotDisplay(
  subdomain: string
): Promise<SchoolChatbotDisplay | null> {
  const school = await fetchSchoolData(subdomain)
  if (!school) return null
  const flags = deriveSchoolContext(school)
  return {
    ...flags,
    schoolName: school.nameEn ?? school.name,
    schoolNameAr: school.name,
    logoUrl: school.logoUrl ?? null,
  }
}

async function fetchSchoolData(
  subdomain: string
): Promise<SchoolChatbotData | null> {
  const now = new Date()

  const school = await db.school.findUnique({
    where: { domain: subdomain },
    select: {
      name: true,
      nameEn: true,
      domain: true,
      logoUrl: true,
      description: true,
      schoolType: true,
      schoolLevel: true,
      timetableStructure: true,
      tuitionFee: true,
      registrationFee: true,
      applicationFee: true,
      currency: true,
      paymentSchedule: true,
      address: true,
      city: true,
      country: true,
      phoneNumber: true,
      email: true,
      website: true,
      maxStudents: true,
      maxTeachers: true,
      preferredLanguage: true,
      admissionCampaigns: {
        where: {
          OR: [
            { status: "OPEN", endDate: { gte: now } },
            { status: "DRAFT", startDate: { gte: now } },
          ],
        },
        select: {
          name: true,
          academicYear: true,
          startDate: true,
          endDate: true,
          status: true,
          description: true,
          totalSeats: true,
          applicationFee: true,
        },
        orderBy: { startDate: "asc" },
        take: 3,
      },
      events: {
        where: { isPublic: true, eventDate: { gte: now }, status: "PLANNED" },
        select: {
          title: true,
          description: true,
          eventType: true,
          eventDate: true,
          startTime: true,
          endTime: true,
          location: true,
          isPublic: true,
        },
        orderBy: { eventDate: "asc" },
        take: 5,
      },
      announcements: {
        where: {
          published: true,
          OR: [{ pinned: true }, { priority: { in: ["high", "urgent"] } }],
        },
        select: {
          title: true,
          body: true,
          priority: true,
          pinned: true,
        },
        take: 3,
      },
      academicLevels: {
        select: {
          name: true,
          level: true,
          startGrade: true,
          endGrade: true,
          grades: {
            select: { name: true, gradeNumber: true },
            orderBy: { gradeNumber: "asc" },
          },
        },
        orderBy: { levelOrder: "asc" },
      },
      scholarships: {
        where: { isActive: true },
        select: {
          name: true,
          description: true,
          coverageType: true,
          coverageAmount: true,
          isActive: true,
        },
        take: 5,
      },
      feeStructures: {
        select: {
          name: true,
          academicYear: true,
          totalAmount: true,
          tuitionFee: true,
          installments: true,
        },
        take: 5,
      },
    },
  })

  if (!school) return null

  return {
    ...school,
    tuitionFee: school.tuitionFee ? Number(school.tuitionFee) : null,
    registrationFee: school.registrationFee
      ? Number(school.registrationFee)
      : null,
    applicationFee: school.applicationFee
      ? Number(school.applicationFee)
      : null,
    admissionCampaigns: school.admissionCampaigns.map((c) => ({
      ...c,
      applicationFee: c.applicationFee ? Number(c.applicationFee) : null,
    })),
    scholarships: school.scholarships.map((s) => ({
      ...s,
      coverageAmount: Number(s.coverageAmount),
    })),
    feeStructures: school.feeStructures.map((f) => ({
      ...f,
      totalAmount: Number(f.totalAmount),
      tuitionFee: Number(f.tuitionFee),
    })),
  }
}

/**
 * Server-side resolution of the system prompt for either mode. The dictionary
 * is loaded here (not on the client) so we never ship the entire prompt text
 * over the network — only the assistant's response.
 */
async function resolveSystemPrompt(
  systemPromptType: SystemPromptType,
  subdomain: string | undefined,
  locale: string,
  matched: SupportTopic[] = []
): Promise<{ prompt: string; chatbot: ChatbotDictionary }> {
  const dictionary = await getDictionary(locale as Locale)
  const chatbot = dictionary.chatbot as unknown as ChatbotDictionary

  if (systemPromptType === "schoolSite" && subdomain) {
    const schoolData = await fetchSchoolData(subdomain)
    if (schoolData) {
      return {
        prompt: buildSchoolSitePrompt(schoolData, locale, chatbot),
        chatbot,
      }
    }
  }

  return {
    prompt: buildSaasMarketingPrompt(
      locale,
      chatbot,
      (await getExchangeRates()).rates,
      matched
    ),
    chatbot,
  }
}

export async function sendMessage(
  messages: CoreMessage[],
  systemPromptType: SystemPromptType = "saasMarketing",
  subdomain?: string,
  locale: string = "en"
) {
  // Hoisted so the catch below can still answer a support question with its
  // guide cards instead of the sales fallback.
  let support = false
  let resources: ChatResource[] = []
  try {
    // Public, unauthenticated action → throttle before anything costs money.
    // Key: IP + truncated UA (shared school networks stay fair; spoofing only
    // buys friction). Two windows: burst and sustained.
    const h = await headers()
    const ip =
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      h.get("x-real-ip") ||
      "unknown"
    const ua = (h.get("user-agent") ?? "").slice(0, 50)
    const rlKey = `${ip}:${ua}`
    const burst = await checkUserRateLimit(
      rlKey,
      RATE_LIMITS.CHATBOT,
      "chatbot"
    )
    const sustained = await checkUserRateLimit(
      rlKey,
      RATE_LIMITS.CHATBOT_HOURLY,
      "chatbot-h"
    )
    if (!burst.allowed || !sustained.allowed) {
      return {
        success: false,
        error:
          locale === "ar"
            ? "رسائل كثيرة خلال وقت قصير — انتظر قليلاً ثم حاول مجدداً."
            : "Too many messages — please wait a moment and try again.",
      }
    }

    // Capture runs BEFORE the model and never blocks it: if the visitor typed
    // an email or phone, it persists even when the LLM call fails. SaaS mode
    // only — schoolSite visitors are the school's parents, not our pipeline.
    if (systemPromptType === "saasMarketing") {
      await captureFromChat({ messages, locale })
    }

    const apiKey = process.env.GROQ_API_KEY

    if (!apiKey) {
      return {
        success: false,
        error:
          "Groq API key not configured. Please add GROQ_API_KEY to your .env file.",
      }
    }

    // Support topics are matched in code (keywords, ar + en) so the prompt
    // carries only the guides this question needs, and the guide/video/
    // screenshot cards are attached from the registry — never model output.
    const isSaas = systemPromptType === "saasMarketing"
    const texts = isSaas ? lastUserTexts(messages) : []
    const helpIndex = isSaas && isHelpIndexQuestion(texts[0] ?? "")
    const matched = helpIndex ? [] : matchTopics(texts)
    support = helpIndex || isSupportQuestion(matched)

    const { prompt: systemPrompt, chatbot } = await resolveSystemPrompt(
      systemPromptType,
      subdomain,
      locale,
      matched
    )
    resources = helpIndex
      ? [
          {
            kind: "guide",
            title: chatbot.ctaHelpCenter,
            href: `/${locale}/docs/support`,
          },
        ]
      : matched.slice(0, 1).flatMap((topic) =>
          resourcesFor(topic, locale, {
            video: chatbot.resourceVideo,
            guide: chatbot.resourceGuide,
          })
        )

    // "What can you help with?" has one right answer — the guide list. A
    // 20B model asked for it still invents steps, so it is answered here.
    if (helpIndex) {
      return { success: true, content: helpIndexReply(locale), resources }
    }

    const groq = createGroq({ apiKey })

    // Keep only the most recent turns. The system prompt already carries the
    // full knowledge base (live pricing, features, or school data), so older
    // small-talk adds little — trimming keeps the model on-task and bounds
    // latency/cost.
    const recentMessages = messages.slice(-10)

    const result = await generateText({
      model: groq(CHAT_MODEL),
      messages: recentMessages,
      system: isSaas
        ? systemPrompt + askState(messages, locale, support)
        : systemPrompt,
      // Low temperature → factual, on-script answers (never invent prices).
      temperature: 0.3,
      // Caps replies at a short answer or a ≤6-step how-to list. gpt-oss is a
      // reasoning model and its reasoning tokens count against this cap, so
      // effort stays "low" (~60 reasoning tokens measured); 600 leaves a
      // numbered list room to finish.
      maxOutputTokens: 600,
      providerOptions: { groq: { reasoningEffort: "low" } },
    })

    // A reasoning model can spend its whole cap thinking and return "" — an
    // empty bubble reads as a dead product. Fall back to the capture ask.
    if (!result.text.trim()) {
      return {
        success: true,
        content: fallbackReply(systemPromptType, locale, support),
        resources,
      }
    }

    return {
      success: true,
      content: plainText(
        isSaas ? dropRepeatAsk(result.text, messages, support) : result.text
      ),
      resources,
    }
  } catch (error) {
    // Groq's free tier caps tokens per minute; during an outreach wave the
    // visitor would otherwise read a raw English provider error. The capture
    // above already ran, so the fallback turns a failure into the ask.
    console.error("Server Action Error:", error)
    return {
      success: true,
      content: fallbackReply(systemPromptType, locale, support),
      resources,
    }
  }
}

const ASK_RE = /واتساب|whatsapp/i
const textOf = (m: { content: unknown }) =>
  typeof m.content === "string" ? m.content : ""

function contactState(messages: Array<{ role: string; content: unknown }>) {
  const gave = messages.some((m) => {
    if (m.role !== "user") return false
    const f = extractIdentifiers(textOf(m))
    return Boolean(f.email || f.phone)
  })
  const asked = messages.some(
    (m) => m.role === "assistant" && ASK_RE.test(textOf(m))
  )
  return { gave, asked }
}

/**
 * The note in `askState` lowers the repeat rate; it does not end it (the
 * model still re-asked on 1 turn in 3). Once the ask is on record, a line
 * that makes it again is cut — unless it is the whole reply.
 */
function dropRepeatAsk(
  reply: string,
  messages: Array<{ role: string; content: unknown }>,
  support = false
): string {
  const { gave, asked } = contactState(messages)
  // A customer asking how to use the product is not a lead — no sales ask.
  if (!gave && !asked && !support) return reply
  const kept = reply.split("\n").filter((l) => !ASK_RE.test(l))
  const out = kept.join("\n").trim()
  return out || reply
}

/**
 * Whether the contact ask may still be made — decided in code, not by the
 * model. A 20B model told "ask once" asks every turn (measured 2026-09-28);
 * a funnel that nags reads as spam. So the transcript is scanned here and the
 * model is told the state as a fact.
 */
function askState(
  messages: Array<{ role: string; content: unknown }>,
  locale: string,
  support = false
): string {
  const { gave, asked } = contactState(messages)
  const ar = locale === "ar"
  if (support)
    return ar
      ? "\n\n## حالة المحادثة\nهذا سؤال دعم: الزائر يسأل كيف يستخدم «بالقلم». أجب بالخطوات من الدليل المطابق، ولا تطلب رقم واتساب أو بريدًا."
      : "\n\n## Conversation state\nThis is a support question: the visitor is asking how to use Balqalam. Answer with the steps from the matching guide, and do NOT ask for a WhatsApp number or email."
  if (gave)
    return ar
      ? "\n\n## حالة المحادثة\nأعطى الزائر رقمه أو بريده بالفعل. لا تطلبه مجددًا أبدًا."
      : "\n\n## Conversation state\nThe visitor has ALREADY given a number or email. Never ask for one again."
  if (asked)
    return ar
      ? "\n\n## حالة المحادثة\nطلبتَ رقم واتساب أو بريدًا في رد سابق. لا تطلبه مجددًا في هذه المحادثة — أجب عن السؤال فقط."
      : "\n\n## Conversation state\nYou ALREADY asked for a WhatsApp number or email in an earlier reply. Do not ask again in this conversation — just answer the question."
  return ""
}

function fallbackReply(
  type: SystemPromptType,
  locale: string,
  support = false
): string {
  const ar = locale === "ar"
  if (support)
    return ar
      ? "عذرًا، لم أتمكن من الإجابة الآن. الدليل وفيديو الشرح مرفقان أدناه، أو راسلنا على contact@databayt.org."
      : "Sorry, I couldn't answer just now. The guide and tutorial video are attached below, or email us at contact@databayt.org."
  if (type === "saasMarketing")
    return ar
      ? "عذرًا، لم أتمكن من الإجابة الآن. اترك رقم واتساب أو بريدًا إلكترونيًا وسيتواصل معك فريق «بالقلم» ويجهّز لمدرستك نسخة تجريبية مجانية لثلاثة أشهر."
      : "Sorry, I couldn't answer just now. Leave a WhatsApp number or an email and the Balqalam team will reach you and prepare a free three-month trial copy for your school."
  return ar
    ? "عذرًا، لم أتمكن من الإجابة الآن. حاول مجددًا بعد قليل، أو تواصل مع المدرسة مباشرة."
    : "Sorry, I couldn't answer just now. Please try again shortly, or contact the school directly."
}

/**
 * The visitor's latest message, plus the one before it as context — so a
 * follow-up like "and after that?" still lands on the guide being discussed.
 * The latest message is listed first: `matchTopics` weights it higher.
 */
function lastUserTexts(
  messages: Array<{ role: string; content: unknown }>
): string[] {
  return messages
    .filter((m) => m.role === "user")
    .slice(-2)
    .reverse()
    .map(textOf)
}

function helpIndexReply(locale: string): string {
  const ar = locale === "ar"
  const titles = SUPPORT_TOPICS.map((t) => `- ${t.title[ar ? "ar" : "en"]}`)
  return [
    ar
      ? "أستطيع مساعدتك في استخدام «بالقلم» خطوة بخطوة. اسألني عن أيٍّ من هذه:"
      : "I can walk you through Balqalam step by step. Ask me about any of these:",
    ...titles,
    ar
      ? "مثال: «كيف أضيف طالبًا؟». وكل الأدلة مع فيديوهات الشرح في مركز المساعدة أدناه."
      : 'For example: "How do I add a student?". Every guide, with its tutorial video, is in the help center below.',
  ].join("\n")
}

/**
 * The bubble renders text as-is, so markdown shows up as stray symbols.
 * The prompt forbids it; a 20B model still slips — strip what it slips.
 */
function plainText(reply: string): string {
  return reply
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[ \t]+$/gm, "")
}
