// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import "server-only"

import { createHash } from "node:crypto"
import { cache } from "react"
import { unstable_cache } from "next/cache"
import { after } from "next/server"
import { auth } from "@/auth"
import type { ModelMessage } from "ai"

import { clientIpFrom } from "@/lib/client-ip"
import { db } from "@/lib/db"
import { extractIdentifiers } from "@/lib/funnel/identifiers"
import { checkUserRateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import { mainOriginForHost } from "@/lib/root-domain"
import { tenantForHost, type HostTenant } from "@/lib/tenant-host"
import { isRouteAllowedForRole, type Role } from "@/routes"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { getExchangeRates } from "@/components/saas-marketing/pricing/exchange-rates"

import { captureFromChat } from "./capture"
import { claudeEnabled } from "./claude/client"
import { contextBlock, helpCenter, modeBlock } from "./claude/prompt"
import { profileFor } from "./identity"
import { CHAT_HISTORY_TURNS, CONTACT_EMAIL } from "./constant"
import {
  buildSaasMarketingPrompt,
  buildSchoolSitePrompt,
  buildSchoolSupportPrompt,
  deriveSchoolContext,
  type SchoolChatbotData,
  type SystemPromptType,
} from "./prompts"
import {
  formatSupport,
  isHelpIndexQuestion,
  isSupportQuestion,
  matchTopics,
  SUPPORT_TOPICS,
  supportRoleOf,
  writtenFor,
  type SupportTopic,
} from "./support"
import { ASK_RE } from "./stream"
import { appPath, pageGuide } from "./page-guide"
import { resourcesFor } from "./support-media"
import { startTurn } from "./threads"
import type {
  ChatbotDictionary,
  ChatMeta,
  ChatResource,
  SchoolChatbotDisplay,
  SupportRole,
} from "./type"

/**
 * Groq retired `llama-3.1-8b-instant` and every reply in prod became an
 * English "model does not exist" error (found 2026-09-28; the translation
 * lane hit the same wall on 09-09 and moved to gpt-oss-20b — see
 * `src/components/translation/groq.ts`). A dead default is a dead chatbot:
 * check `GET api.groq.com/openai/v1/models` before trusting it.
 */
export const CHAT_MODEL = process.env.GROQ_CHAT_MODEL ?? "openai/gpt-oss-20b"

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

/**
 * Every school-site page render and every visitor message read the same
 * six-relation school row. Cached per subdomain for five minutes — a new
 * campaign or event reaches the bot within that window — and deduped
 * within one request. Dates come back from the cache as ISO strings; the
 * prompt builders wrap every one in `new Date()`.
 */
const fetchSchoolData = cache(
  (subdomain: string): Promise<SchoolChatbotData | null> =>
    unstable_cache(() => readSchool(subdomain), ["chatbot-school", subdomain], {
      revalidate: 300,
      tags: [`chatbot-school:${subdomain}`],
    })()
)

async function readSchool(
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
      // No announcements: a pinned or urgent one is still addressed to the
      // school's own people (scope school/grade/section, scheduled, expiring),
      // and this bot answers the public.
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
      // The fee plans a parent can be quoted: active, set by the school (not
      // the placeholder rows provisioning writes), newest year first.
      feeStructures: {
        where: { isActive: true, isAutoGenerated: false },
        orderBy: [{ academicYear: "desc" }, { createdAt: "desc" }],
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

/** The signed-in school member the dashboard support desk is talking to. */
interface SupportMember {
  id: string
  role: SupportRole
  /** Dictionary key naming their exact role in the prompt (`roleTeacher`). */
  roleKey: string
  schoolName: string | null
}

const ROLE_KEYS: Record<string, string> = {
  ADMIN: "roleAdmin",
  DEVELOPER: "roleAdmin",
  TEACHER: "roleTeacher",
  GUARDIAN: "roleParent",
  STUDENT: "roleStudent",
  ACCOUNTANT: "roleAccountant",
}

/**
 * Role and school come from the session, never from the client: the
 * support desk tailors answers to them, so a forged role would only get
 * someone else's how-to — but it still has to be the truth.
 *
 * Membership mirrors the dashboard layout's own guard: a member of the
 * school the Host names, or a DEVELOPER. A signed-in user of another school,
 * or of none, gets `forbidden` — the desk is that school's, not the world's.
 */
type SessionUser = { id?: string; role?: string; schoolId?: string | null }

async function supportMember(
  locale: string,
  tenant: HostTenant,
  user: SessionUser | undefined
): Promise<SupportMember | "signed-out" | "forbidden"> {
  if (!user?.id) return "signed-out"
  if (tenant.kind !== "school") return "forbidden"
  if (user.role !== "DEVELOPER" && user.schoolId !== tenant.schoolId)
    return "forbidden"
  const school = await db.school.findUnique({
    where: { id: tenant.schoolId },
    select: { name: true, nameEn: true },
  })
  return {
    id: user.id,
    role: supportRoleOf(user.role),
    roleKey: ROLE_KEYS[user.role ?? ""] ?? "roleStaff",
    schoolName: school
      ? locale === "en"
        ? (school.nameEn ?? school.name)
        : school.name
      : null,
  }
}

/**
 * Server-side resolution of the system prompt for every mode. The
 * dictionary is loaded here (not by the client) so the prompt text never
 * crosses the network — only the assistant's response.
 */
async function resolveSystemPrompt(
  systemPromptType: SystemPromptType,
  chatbot: ChatbotDictionary,
  options: {
    subdomain?: string
    locale: string
    matched: SupportTopic[]
    attached: string[]
    member: SupportMember | null
  }
): Promise<string> {
  const { subdomain, locale, matched, attached, member } = options

  if (systemPromptType === "schoolSupport" && member) {
    return buildSchoolSupportPrompt(locale, chatbot, {
      schoolName: member.schoolName ?? chatbot.replyYourSchool,
      roleLabel: chatbot[member.roleKey] ?? chatbot.roleStaff,
      support: formatSupport(locale, matched, { role: member.role, attached }),
    })
  }

  if (systemPromptType === "schoolSite" && subdomain) {
    const schoolData = await fetchSchoolData(subdomain)
    if (schoolData) return buildSchoolSitePrompt(schoolData, locale, chatbot)
  }

  return buildSaasMarketingPrompt(
    locale,
    chatbot,
    (await getExchangeRates()).rates,
    matched,
    attached
  )
}

/**
 * Block 2 of the Claude prompt: the mode's rules and data, without the
 * per-question guide matches (block 1 holds every guide). The sales prompt
 * with today's pricing; a school's fenced public data; the desk has its own
 * rules in `claude/prompt-text.ts`.
 */
async function claudeModeText(
  mode: SystemPromptType,
  chatbot: ChatbotDictionary,
  locale: string,
  subdomain?: string
): Promise<string> {
  if (mode === "schoolSupport") return ""
  if (mode === "schoolSite" && subdomain) {
    const school = await fetchSchoolData(subdomain)
    if (school) return buildSchoolSitePrompt(school, locale, chatbot)
  }
  return buildSaasMarketingPrompt(locale, chatbot, (await getExchangeRates()).rates)
}

/**
 * What the route does with one visitor message:
 * - `error` — refused before the model (sign-in, rate limit), worded for people
 * - `reply` — answered in code (the help index, or a failure's fallback)
 * - `model` — stream the model's answer with these settings
 */
/**
 * The saved conversation this answer belongs to. Null only when the
 * database failed before the turn was written — the visitor still gets an
 * answer, it just isn't kept.
 */
export interface PlanTurn {
  schoolId: string
  profileId: string
  threadId: string
  userMessageId: string
  assistantMessageId: string
}

export type ChatPlan =
  | { kind: "error"; status: number; error: string }
  | {
      kind: "reply"
      meta: ChatMeta
      text: string
      turn: PlanTurn | null
      topicSlugs: string[]
    }
  | {
      kind: "model"
      meta: ChatMeta
      system: string
      messages: ModelMessage[]
      /** Cut lines that repeat the contact ask (see `dropsAsk`). */
      dropAsk: boolean
      turn: PlanTurn | null
      topicSlugs: string[]
      /** Set when the Claude lane is on: its cached blocks and who asks. */
      claude: { system: [string, string, string]; userKey: string } | null
      /** The cards for the guide a model's tag names. */
      cardsFor: (slug: string) => ChatResource[]
    }

export interface ChatRequest {
  /** The new question. The history is the thread's, read from the database. */
  message: string
  threadId?: string
  /** Ask the thread's latest question again, replacing this answer. */
  retryOf?: string
  /** The page they are on (`/ar/attendance`). */
  pathname?: string
  promptType: SystemPromptType
  subdomain?: string
  locale: string
  headers: Headers
}

export async function prepareChat(req: ChatRequest): Promise<ChatPlan> {
  const { promptType, headers: h } = req
  const locale = req.locale === "ar" ? "ar" : "en"
  const dictionary = await getDictionary(locale as Locale)
  const chatbot = dictionary.chatbot as unknown as ChatbotDictionary

  // Hoisted so the catch below can still answer a support question with its
  // guide cards instead of the sales fallback, and keep the answer it gives.
  let support = promptType === "schoolSupport"
  let resources: ChatResource[] = []
  let turn: PlanTurn | null = null
  try {
    // The tenant is the Host's, never the body's: the sales bot answers on
    // the main domain only, a school's bots on that school's host only.
    const tenant = await tenantForHost(h.get("host"))
    const onSchool = promptType !== "saasMarketing"
    if (
      onSchool
        ? tenant.kind !== "school" ||
          (req.subdomain !== undefined && req.subdomain !== tenant.subdomain)
        : tenant.kind !== "platform"
    ) {
      return { kind: "error", status: 400, error: chatbot.replyNoAccess }
    }

    // The dashboard desk answers signed-in members of this school only.
    const desk = promptType === "schoolSupport"
    const session = await auth()
    const seat = desk ? await supportMember(locale, tenant, session?.user) : null
    if (seat === "signed-out") {
      return { kind: "error", status: 401, error: chatbot.replySignIn }
    }
    if (seat === "forbidden") {
      return { kind: "error", status: 403, error: chatbot.replyNoAccess }
    }
    const member = seat

    // Public endpoint → throttle before anything costs money. Key: the user
    // when signed in (a whole school shares one IP), else IP + truncated UA
    // (shared school networks stay fair). The IP is Cloudflare's
    // `cf-connecting-ip`: the head of X-Forwarded-For is whatever the caller
    // wrote, so keying on it handed out a fresh bucket per request. Two
    // windows (burst and sustained), plus one ceiling per public school site
    // that no rotation of visitor keys gets past.
    const ua = (h.get("user-agent") ?? "").slice(0, 50)
    const userId = session?.user?.id
    const rlKey = userId ? `user:${userId}` : `${clientIpFrom(h)}:${ua}`
    const [burst, sustained, site] = await Promise.all([
      checkUserRateLimit(rlKey, RATE_LIMITS.CHATBOT, "chatbot"),
      checkUserRateLimit(rlKey, RATE_LIMITS.CHATBOT_HOURLY, "chatbot-h"),
      promptType === "schoolSite" && tenant.kind === "school"
        ? checkUserRateLimit(
            tenant.schoolId,
            RATE_LIMITS.CHATBOT_TENANT,
            "chatbot-t"
          )
        : { allowed: true },
    ])
    if (!burst.allowed || !sustained.allowed || !site.allowed) {
      return { kind: "error", status: 429, error: chatbot.replyRateLimit }
    }

    // Who is asking, and the conversation this question joins. The question
    // and an empty answer are saved before the model runs; the history the
    // model sees is the thread's, never the client's. Saving never stands
    // between a question and its answer: if the conversation can't be saved
    // (the database is down, the tables aren't migrated yet), the visitor
    // still gets an answer — to this question alone.
    let history: ModelMessage[] = [{ role: "user", content: req.message }]
    try {
      const profile = await profileFor({ tenant, userId, write: true })
      const started = profile
        ? await startTurn({
            profile,
            mode: promptType,
            lang: locale,
            threadId: req.threadId,
            message: req.message,
            retryOf: req.retryOf,
          })
        : null
      if (started === "not_found") {
        return { kind: "error", status: 404, error: chatbot.replyChatNotFound }
      }
      if (profile && started) {
        turn = {
          schoolId: profile.schoolId,
          profileId: profile.id,
          threadId: started.threadId,
          userMessageId: started.userMessageId,
          assistantMessageId: started.assistantMessageId,
        }
        history = started.history
      }
    } catch (error) {
      console.error("[chatbot] could not save the conversation", error)
    }
    // The model's window: a free-tier model reads the latest few messages.
    const messages = history.slice(-CHAT_HISTORY_TURNS)

    // Capture never sits on the reply path: it runs once the response is
    // done, whether the model answered or failed, and reads only the newest
    // message. A lead it finds is linked to the conversation. SaaS mode only
    // — schoolSite visitors are the school's parents, not our pipeline.
    if (promptType === "saasMarketing") {
      const saved = turn
      after(async () => {
        const prospectId = await captureFromChat({ messages, locale })
        if (prospectId && saved)
          await db.chatbotThread
            .updateMany({
              where: { id: saved.threadId, schoolId: saved.schoolId },
              data: { prospectId },
            })
            .catch((error) =>
              console.error("[chatbot] lead link failed", error)
            )
      })
    }

    if (!process.env.GROQ_API_KEY && !claudeEnabled()) {
      console.error("Chatbot: neither GROQ_API_KEY nor the Claude lane is set")
      return { kind: "error", status: 503, error: chatbot.replyNotConfigured }
    }

    // Support topics are matched in code (ar + en) so the prompt carries
    // only the guides this question needs, and the guide/video/screenshot
    // cards are attached from the registry — never model output.
    const isSaas = promptType === "saasMarketing"
    const helps = isSaas || desk
    const texts = helps ? lastUserTexts(messages) : []
    const helpIndex =
      helps && isHelpIndexQuestion(texts[0] ?? "", [chatbot.saasSupportQuestion])
    // The desk carries a third guide: a signed-in user's question is almost
    // always a how-to, and a near miss costs more than the extra tokens. A
    // member never needs the sales guides (pricing, getting started).
    // The guide about the page they asked from: on the desk, a question that
    // names no guide of its own ("how do I do this here?") is about this page.
    const onPage = desk
      ? pageGuide(SUPPORT_TOPICS, req.pathname, member?.role)
      : undefined
    const keyworded = helpIndex
      ? []
      : matchTopics(texts, desk ? 3 : 2, member?.role, { excludeSales: desk })
    const matched = !helpIndex && !keyworded.length && onPage ? [onPage] : keyworded
    support = desk || helpIndex || isSupportQuestion(matched)

    // The help center lives on the main domain; a school subdomain (the
    // dashboard desk) has no /docs route, so its links carry the origin.
    const origin = desk ? mainOriginForHost(h.get("host")) : ""
    // A desk answer about a page offers to open it — the member's own role
    // must be allowed there, and they mustn't be on it already.
    const userRole = session?.user?.role as Role | undefined
    const here = req.pathname ? appPath(req.pathname) : ""
    const pageCard = (topic: SupportTopic): ChatResource[] => {
      if (!desk || !userRole) return []
      const route = topic.routes?.find(
        (r) => here !== r && isRouteAllowedForRole(r, userRole)
      )
      if (!route || topic.routes?.some((r) => here === r || here.startsWith(`${r}/`)))
        return []
      return [
        {
          kind: "page",
          title: chatbot.openPage.replace("{title}", topic.title[locale]),
          href: `/${locale}${route}`,
        },
      ]
    }
    const cardsOf = (topic: SupportTopic): ChatResource[] => [
      ...resourcesFor(
        topic,
        locale,
        { video: chatbot.resourceVideo, guide: chatbot.resourceGuide },
        undefined,
        origin
      ),
      ...pageCard(topic),
    ]
    resources = helpIndex
      ? [
          {
            kind: "guide",
            title: chatbot.ctaHelpCenter,
            href: `${origin}/${locale}/docs/support`,
          },
        ]
      : matched.slice(0, 1).flatMap(cardsOf)
    // When the model can't answer (an outage, the free tier's daily token
    // cap), a matched guide still can: its own steps ARE the answer the model
    // would have given. Only with no guide does the visitor get the apology.
    const guide = support ? matched[0] : undefined
    const meta: ChatMeta = {
      resources,
      fallback: guide
        ? `${chatbot.replyFromGuide.replace("{guide}", guide.title[locale])}\n\n${guide.answer[locale]}`
        : fallbackReply(chatbot, promptType, support),
      cutOff: chatbot.answerCutOff,
    }
    const topicSlugs = matched.slice(0, 1).map((t) => t.slug)

    // "What can you help with?" has one right answer — the guide list. A
    // 20B model asked for it still invents steps, so it is answered here.
    if (helpIndex) {
      return {
        kind: "reply",
        meta,
        text: helpIndexReply(chatbot, locale, member?.role),
        turn,
        topicSlugs: [],
      }
    }

    // The bot is told which cards sit under its answer (by title, never by
    // URL) so it can point at "the screenshots below" when they exist.
    const attached = resources
      .filter((r) => r.kind !== "guide")
      .map((r) =>
        r.kind === "video" ? `${chatbot.resourceVideo}: ${r.title}` : r.title
      )
    const subdomain = tenant.kind === "school" ? tenant.subdomain : undefined
    const systemPrompt = await resolveSystemPrompt(promptType, chatbot, {
      subdomain,
      locale,
      matched,
      attached,
      member,
    })

    const cardsFor = (slug: string) => {
      const topic = SUPPORT_TOPICS.find((t) => t.slug === slug)
      return topic ? cardsOf(topic) : []
    }
    const claude = claudeEnabled()
      ? {
          system: [
            helpCenter(locale),
            modeBlock(
              promptType,
              locale,
              await claudeModeText(promptType, chatbot, locale, subdomain)
            ),
            contextBlock({
              now: new Date(),
              lang: locale,
              role: member ? (chatbot[member.roleKey] ?? chatbot.roleStaff) : undefined,
              school: member?.schoolName ?? undefined,
              guess: keyworded[0]?.slug,
              page: onPage?.slug,
              extra: helps && !desk ? askState(messages, locale, support) : "",
            }),
          ] as [string, string, string],
          // Opaque and stable per person: the profile id, hashed.
          userKey: createHash("sha256")
            .update(`chatbot:${turn?.profileId ?? clientIpFrom(h)}`)
            .digest("hex")
            .slice(0, 32),
        }
      : null

    return {
      kind: "model",
      meta,
      messages,
      system: helps
        ? systemPrompt + askState(messages, locale, support)
        : systemPrompt,
      // The desk never asks for contact details, so it never cuts a line: a
      // guide step about WhatsApp notifications is an answer, not an ask.
      dropAsk: helps && !desk && dropsAsk(messages, support),
      turn,
      topicSlugs,
      claude,
      cardsFor,
    }
  } catch (error) {
    // A failed read must not leave the visitor with a raw error: the
    // capture above already ran, so the fallback turns it into the ask.
    console.error("Chatbot prepare failed:", error)
    const fallback = fallbackReply(chatbot, promptType, support)
    return {
      kind: "reply",
      meta: { resources, fallback, cutOff: chatbot.answerCutOff },
      text: fallback,
      turn,
      topicSlugs: [],
    }
  }
}

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
 * model still re-asked on 1 turn in 3). Once the ask is on record — or the
 * visitor is a customer asking how to use the product, not a lead — a line
 * that makes it again is cut (see `replyStream`).
 */
function dropsAsk(
  messages: Array<{ role: string; content: unknown }>,
  support: boolean
): boolean {
  const { gave, asked } = contactState(messages)
  return gave || asked || support
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
  chatbot: ChatbotDictionary,
  type: SystemPromptType,
  support = false
): string {
  const text =
    type === "schoolSupport"
      ? chatbot.replyFallbackDesk
      : support
        ? chatbot.replyFallbackSupport
        : type === "saasMarketing"
          ? chatbot.replyFallbackSaas
          : chatbot.replyFallbackSchool
  return text.replaceAll("{contactEmail}", CONTACT_EMAIL)
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

function helpIndexReply(
  chatbot: ChatbotDictionary,
  locale: string,
  role?: SupportRole
): string {
  // The same audience rule as the prompt's guide index (`formatSupport`):
  // a student is also shown the parent guides.
  const titles = SUPPORT_TOPICS.filter(
    (t) => !role || !t.roles?.length || writtenFor(t, role)
  ).map((t) => `- ${t.title[locale === "ar" ? "ar" : "en"]}`)
  return [
    chatbot.replyHelpIndexIntro,
    ...titles,
    chatbot.replyHelpIndexOutro,
  ].join("\n")
}
