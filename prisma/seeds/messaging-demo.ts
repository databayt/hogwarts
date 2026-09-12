// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Demo Inboxes Seed
 *
 * The generic messaging seed (./messages.ts) pairs random teachers and
 * students, so the accounts a demo is actually driven from open Messages to a
 * near-empty list — student@ had exactly one thread. This pass gives each
 * demo-driving account a populated, believable inbox:
 *
 * - counterparts are resolved from the real graph (the student's own section
 *   teachers, their homeroom teacher, their classmates, the school admin), so
 *   every thread also exists in the contacts panel
 * - conversations are authored multi-turn dialogues, not one-line fragments
 * - threads land across today / yesterday / this week / last week so the list
 *   shows a spread of dates instead of one timestamp
 * - a few threads stay unread and one is pinned, so the Unread and Favourites
 *   filters have content
 *
 * Unread is derived (`message.createdAt > participant.lastReadAt`) — see
 * getUnreadCountsPerConversation in the messaging block — so read state is
 * expressed by moving `lastReadAt`, never by `Message.status` alone.
 *
 * Idempotent: direct threads are guarded by participant pair, groups by title.
 * An existing conversation is left exactly as it is.
 */

import type { PrismaClient } from "@prisma/client"

import { logSuccess } from "./utils"

// ============================================================================
// TYPES
// ============================================================================

/** One line of an authored dialogue. `self` = the demo account's own message. */
type Turn = {
  from: "self" | "other"
  text: string
  /** Minutes after the previous turn. Defaults to a short reply gap. */
  gap?: number
}

type Person = {
  userId: string
  /** Given name, used inside the authored copy. */
  name: string
  /** A subject this person teaches the reader, when relevant. */
  subject?: string
}

type DirectThread = {
  other: Person
  /** Days back from today the conversation's LAST message lands. */
  daysAgo: number
  /** Hour of day (24h) the first turn lands. */
  hour: number
  /** How many trailing incoming messages stay unread for the demo account. */
  unreadTail?: number
  pinned?: boolean
  turns: Turn[]
}

type GroupThread = {
  title: string
  description: string
  /** userId of the group owner. */
  ownerId: string
  /** Every member, owner included. */
  memberIds: string[]
  daysAgo: number
  hour: number
  unreadTail?: number
  pinned?: boolean
  /** Sender userId per line — `null` means the demo account itself. */
  lines: { senderId: string | null; text: string; gap?: number }[]
}

// ============================================================================
// AUTHORED DIALOGUES
// ============================================================================

/**
 * Teacher ↔ student scripts. `{subject}`, `{student}` and `{teacher}` are
 * filled from the real row, so a thread reads about the subject that teacher
 * actually teaches this section.
 */
const TEACHER_SCRIPTS: Turn[][] = [
  [
    {
      from: "other",
      text: "{student}، راجعت ورقتك في {subject}. الحل الأخير ممتاز، لكن راجع خطوة التبسيط في السؤال الثالث.",
    },
    {
      from: "self",
      text: "شكراً أستاذ/ة {teacher}. هل أعيد حل السؤال وأرسله؟",
      gap: 25,
    },
    {
      from: "other",
      text: "نعم، أرسله قبل حصة الأحد وسأضيف لك درجة المشاركة.",
      gap: 14,
    },
    { from: "self", text: "تمام، سأنهيه الليلة إن شاء الله.", gap: 9 },
  ],
  [
    {
      from: "other",
      text: "تذكير: اختبار {subject} القصير يوم الثلاثاء ويغطي الوحدتين الأولى والثانية.",
    },
    {
      from: "self",
      text: "هل يدخل معنا تمارين نهاية الوحدة الثانية؟",
      gap: 31,
    },
    {
      from: "other",
      text: "نعم، والتمارين المحلولة في الصف هي الأقرب لنمط الأسئلة.",
      gap: 18,
    },
    { from: "self", text: "شكراً جزيلاً، سأراجعها.", gap: 6 },
  ],
  [
    {
      from: "self",
      text: "السلام عليكم أستاذ/ة {teacher}، لم أفهم جزئية المثال الأخير في {subject}.",
    },
    {
      from: "other",
      text: "وعليكم السلام. ابدأ من تعريف الوحدة ثم طبّق القاعدة خطوة خطوة.",
      gap: 22,
    },
    {
      from: "other",
      text: "سأشرحها مرة أخرى في بداية الحصة القادمة، ذكّرني.",
      gap: 3,
    },
    { from: "self", text: "جزاكم الله خيراً.", gap: 11 },
  ],
  [
    {
      from: "other",
      text: "غبت عن حصة {subject} أمس. هل هناك عذر؟ أحتاج تدوينه قبل نهاية الأسبوع.",
    },
    { from: "self", text: "كنت عند الطبيب، ومعي تقرير سأحضره غداً.", gap: 40 },
    { from: "other", text: "جيد، سلّمه للإدارة وسأسجّل الغياب بعذر.", gap: 17 },
  ],
  [
    {
      from: "other",
      text: "مشروع {subject} هذا الفصل جماعي، ثلاثة طلاب لكل مجموعة. اختر مجموعتك قبل الخميس.",
    },
    {
      from: "self",
      text: "اتفقت مع زميلين من الفصل، هل أرسل الأسماء هنا؟",
      gap: 27,
    },
    { from: "other", text: "أرسلها مع عنوان المشروع المقترح.", gap: 12 },
    {
      from: "self",
      text: "العنوان: أثر الطاقة المتجددة في الاستهلاك المنزلي.",
      gap: 8,
    },
    {
      from: "other",
      text: "عنوان ممتاز، معتمد. ابدأوا بجمع المصادر.",
      gap: 21,
    },
  ],
  [
    {
      from: "other",
      text: "درجات {subject} للفصل الأول نُشرت في صفحة الدرجات. نتيجتك من الأفضل في الفصل.",
    },
    {
      from: "self",
      text: "الحمد لله، شكراً على متابعتكم طوال الفصل.",
      gap: 19,
    },
    {
      from: "other",
      text: "واصل على هذا المستوى، وسأرشّحك لمسابقة المادة.",
      gap: 10,
    },
  ],
  [
    {
      from: "other",
      text: "حصة معمل {subject} غداً. أحضر المعطف والدفتر، ولا تتأخر عن الطابور.",
    },
    {
      from: "self",
      text: "تمام أستاذ/ة، هل نحتاج تحضير التجربة مسبقاً؟",
      gap: 16,
    },
    {
      from: "other",
      text: "اقرأ خطوات التجربة فقط، الأدوات جاهزة في المعمل.",
      gap: 13,
    },
  ],
  [
    {
      from: "other",
      text: "لاحظت تحسّن مستواك في {subject} خلال الأسابيع الماضية، أحسنت.",
    },
    { from: "self", text: "أراجع يومياً نصف ساعة كما نصحتمونا.", gap: 24 },
    {
      from: "other",
      text: "استمر، وسأعطيك أسئلة إثرائية لرفع مستواك أكثر.",
      gap: 15,
    },
  ],
]

/** Classmate ↔ classmate scripts. `{peer}` is the classmate's given name. */
const CLASSMATE_SCRIPTS: Turn[][] = [
  [
    { from: "other", text: "يا {student}، وين وصلت في واجب الرياضيات؟" },
    { from: "self", text: "حليت أربعة أسئلة، السؤال الخامس صعب شوية.", gap: 7 },
    {
      from: "other",
      text: "نفس الشيء. نتقابل في المكتبة بعد الحصة الأخيرة؟",
      gap: 4,
    },
    { from: "self", text: "اتفقنا، أجيب دفتر الملاحظات معاي.", gap: 5 },
  ],
  [
    {
      from: "self",
      text: "{peer}، عندك ملخص درس اليوم؟ كنت غايب في الحصة الثانية.",
    },
    { from: "other", text: "أيوه، صورته وبرسلو ليك الليلة.", gap: 12 },
    {
      from: "other",
      text: "وكمان الأستاذ قال الاختبار الأسبوع الجاي.",
      gap: 2,
    },
    { from: "self", text: "تسلم، ما قصرت.", gap: 6 },
  ],
  [
    { from: "other", text: "جدول الامتحانات نزل في لوحة الإعلانات، شفتو؟" },
    { from: "self", text: "لسه، في أي يوم أول امتحان؟", gap: 3 },
    { from: "other", text: "الأحد، والمادة الأولى اللغة العربية.", gap: 2 },
    { from: "self", text: "طيب نبدأ مراجعة من بكرة.", gap: 8 },
  ],
  [
    {
      from: "other",
      text: "مباراة الفصول بعد الظهر، حنلعب ضد الصف الثاني عشر - أ.",
    },
    {
      from: "self",
      text: "إن شاء الله بجي، بس عندي مراجعة قبلها بساعة.",
      gap: 9,
    },
    { from: "other", text: "تمام، الملعب الساعة أربعة.", gap: 4 },
  ],
  [
    { from: "self", text: "{peer}، عرض المشروع نقسمو كيف؟" },
    {
      from: "other",
      text: "أنا آخذ المقدمة والنتائج، وإنت الجزء العملي.",
      gap: 11,
    },
    { from: "self", text: "ماشي، وبجهز الشرائح الليلة.", gap: 5 },
    { from: "other", text: "ممتاز، نراجعها سوا بكرة الصباح.", gap: 7 },
  ],
]

/** Teacher-account scripts, written from the teacher's side. */
const TEACHER_ACCOUNT_SCRIPTS: Turn[][] = [
  [
    {
      from: "other",
      text: "السلام عليكم أستاذة، هل تسلمتم واجب ابني؟ يقول إنه أرسله أمس.",
    },
    {
      from: "self",
      text: "وعليكم السلام، نعم وصلني وسجّلت درجته. أداؤه جيد هذا الأسبوع.",
      gap: 26,
    },
    { from: "other", text: "الحمد لله، شكراً على متابعتكم.", gap: 14 },
  ],
  [
    {
      from: "self",
      text: "أرسلت لكم خطة الدرس المحدثة للوحدة الثالثة، أرجو مراجعتها قبل اجتماع القسم.",
    },
    {
      from: "other",
      text: "اطلعت عليها، الملاحظة الوحيدة على توزيع الحصص العملية.",
      gap: 38,
    },
    { from: "self", text: "سأعدّلها وأعيد إرسالها اليوم.", gap: 12 },
  ],
  [
    {
      from: "other",
      text: "أستاذة، هل يمكن تأجيل الاختبار القصير ليوم الأربعاء؟ عندنا نشاط المدرسة الثلاثاء.",
    },
    {
      from: "self",
      text: "لا مانع، سأعلن التأجيل في المجموعة اليوم.",
      gap: 21,
    },
    { from: "other", text: "شكراً جزيلاً.", gap: 9 },
  ],
  [
    {
      from: "self",
      text: "تذكير: كشوفات الدرجات تُسلّم للإدارة نهاية الأسبوع.",
    },
    { from: "other", text: "كشفي جاهز، سأرفعه اليوم.", gap: 33 },
  ],
  [
    {
      from: "other",
      text: "أستاذة، ابنتي تعاني في الحفظ. هل من طريقة تساعدها في المنزل؟",
    },
    {
      from: "self",
      text: "قسّموا المقرر إلى أجزاء صغيرة يومياً، والمراجعة قبل النوم تثبّت المعلومة.",
      gap: 29,
    },
    {
      from: "self",
      text: "وسأتابع مستواها في الحصة وأوافيكم أسبوعياً.",
      gap: 3,
    },
    { from: "other", text: "بارك الله فيكم.", gap: 16 },
  ],
  [
    { from: "other", text: "هل تحتاجين مساعدة في مراقبة امتحان الصف العاشر؟" },
    {
      from: "self",
      text: "نعم، الفترة الثانية يوم الاثنين إن تيسّر لك.",
      gap: 18,
    },
    { from: "other", text: "مسجّل عندي.", gap: 7 },
  ],
]

/** Guardian-account scripts, written from the guardian's side. */
const GUARDIAN_SCRIPTS: Turn[][] = [
  [
    { from: "self", text: "السلام عليكم، كيف مستوى ابني في المادة هذا الفصل؟" },
    {
      from: "other",
      text: "وعليكم السلام، مستواه جيد ومشاركته في الصف ممتازة.",
      gap: 34,
    },
    {
      from: "other",
      text: "يحتاج فقط انتظاماً أكثر في تسليم الواجبات.",
      gap: 2,
    },
    { from: "self", text: "سأتابعه في البيت، شكراً لكم.", gap: 15 },
  ],
  [
    {
      from: "other",
      text: "اجتماع أولياء الأمور يوم الخميس الساعة العاشرة صباحاً في قاعة المدرسة.",
    },
    { from: "self", text: "إن شاء الله سأحضر. هل أحتاج إحضار شيء؟", gap: 22 },
    {
      from: "other",
      text: "فقط بطاقة ولي الأمر، وسنسلّمكم تقرير الفصل.",
      gap: 11,
    },
  ],
  [
    {
      from: "self",
      text: "ابني كان مريضاً أمس ولم يحضر، وسأرسل التقرير الطبي مع السائق.",
    },
    {
      from: "other",
      text: "سلامته، سنسجّل الغياب بعذر عند وصول التقرير.",
      gap: 19,
    },
  ],
  [
    {
      from: "other",
      text: "رسوم الفصل الثاني مستحقة نهاية الشهر، والإيصال يصدر من بوابة الأسرة.",
    },
    { from: "self", text: "هل يمكن السداد على دفعتين؟", gap: 27 },
    { from: "other", text: "نعم، تواصل مع المحاسب لجدولة الدفعتين.", gap: 13 },
    { from: "self", text: "شكراً، سأمر غداً على الإدارة.", gap: 10 },
  ],
  [
    {
      from: "self",
      text: "هل تم رصد درجات الاختبار الشهري؟ لا أراها في صفحة الدرجات.",
    },
    {
      from: "other",
      text: "تُرصد نهاية الأسبوع، وستظهر لكم مباشرة بعد الاعتماد.",
      gap: 24,
    },
  ],
]

// ============================================================================
// HELPERS
// ============================================================================

const DEFAULT_GAP = 8

function fill(
  text: string,
  vars: { student?: string; teacher?: string; subject?: string; peer?: string }
): string {
  return text
    .replace(/\{student\}/g, vars.student ?? "")
    .replace(/\{teacher\}/g, vars.teacher ?? "")
    .replace(/\{subject\}/g, vars.subject ?? "")
    .replace(/\{peer\}/g, vars.peer ?? "")
}

/**
 * A dialogue can only end unread when its last line is incoming — a script
 * that closes with the reader's own reply is, by definition, read.
 */
function endsIncoming(script: Turn[]): boolean {
  return script[script.length - 1].from === "other"
}

/** Strip the "- الصف …" suffix so copy reads "مادة الفيزياء", not the class name. */
function subjectOf(className: string | null | undefined): string {
  if (!className) return "المادة"
  return className.split(" - ")[0].trim()
}

/**
 * Timestamps for one thread: the whole dialogue lands `daysAgo` days back,
 * starting at `hour`, each turn `gap` minutes after the previous one.
 */
function timeline(daysAgo: number, hour: number, gaps: number[]): Date[] {
  const start = new Date()
  start.setDate(start.getDate() - daysAgo)
  start.setHours(hour, 5, 0, 0)

  const out: Date[] = []
  let cursor = start.getTime()
  for (let i = 0; i < gaps.length; i++) {
    if (i > 0) cursor += gaps[i] * 60_000
    out.push(new Date(cursor))
  }

  // A "today" thread whose hour has not arrived yet would be stamped in the
  // future — the list would show a message sent hours from now. Slide the
  // whole dialogue back behind the current moment, keeping the authored hour
  // as a spread so same-day threads still land at distinct times.
  const spread = (24 - hour) * 11 * 60_000
  const overshoot =
    out[out.length - 1].getTime() - (Date.now() - 20 * 60_000 - spread)
  if (overshoot > 0) {
    return out.map((d) => new Date(d.getTime() - overshoot))
  }
  return out
}

/**
 * Create a direct conversation between two users unless one already exists.
 * Returns null when the pair is already talking — the caller then skips the
 * whole thread, which is what keeps re-runs a no-op.
 */
async function ensureDirect(
  prisma: PrismaClient,
  schoolId: string,
  selfId: string,
  otherId: string,
  createdAt: Date
): Promise<string | null> {
  const existing = await prisma.conversation.findFirst({
    where: {
      schoolId,
      type: "direct",
      OR: [
        { directParticipant1Id: selfId, directParticipant2Id: otherId },
        { directParticipant1Id: otherId, directParticipant2Id: selfId },
      ],
    },
    select: { id: true },
  })
  if (existing) return null

  const conversation = await prisma.conversation.create({
    data: {
      schoolId,
      type: "direct",
      directParticipant1Id: selfId,
      directParticipant2Id: otherId,
      createdById: otherId,
      createdAt,
      updatedAt: createdAt,
      lastMessageAt: createdAt,
    },
    select: { id: true },
  })

  await prisma.conversationParticipant.createMany({
    data: [
      { conversationId: conversation.id, userId: selfId, role: "member" },
      { conversationId: conversation.id, userId: otherId, role: "owner" },
    ],
    skipDuplicates: true,
  })

  return conversation.id
}

async function ensureGroup(
  prisma: PrismaClient,
  schoolId: string,
  group: GroupThread,
  createdAt: Date
): Promise<string | null> {
  const existing = await prisma.conversation.findFirst({
    where: { schoolId, type: "group", title: group.title },
    select: { id: true },
  })
  if (existing) return null

  const conversation = await prisma.conversation.create({
    data: {
      schoolId,
      type: "group",
      title: group.title,
      description: group.description,
      createdById: group.ownerId,
      createdAt,
      updatedAt: createdAt,
      lastMessageAt: createdAt,
    },
    select: { id: true },
  })

  await prisma.conversationParticipant.createMany({
    data: group.memberIds.map((userId) => ({
      conversationId: conversation.id,
      userId,
      role: userId === group.ownerId ? ("owner" as const) : ("member" as const),
    })),
    skipDuplicates: true,
  })

  return conversation.id
}

/**
 * Write one dialogue into a conversation and set every participant's read
 * state. `unreadTail` incoming messages stay unread for `selfId`; everyone
 * else is caught up.
 */
async function writeDialogue(
  prisma: PrismaClient,
  conversationId: string,
  selfId: string,
  lines: { senderId: string; text: string }[],
  stamps: Date[],
  opts: { unreadTail?: number; pinned?: boolean }
): Promise<number> {
  // `unreadTail` counts INCOMING messages, so walk back over the dialogue
  // skipping the reader's own lines. A dialogue whose last line is the
  // reader's own reply can't have anything unread behind it — marking one
  // would draw a badge on a thread the reader visibly just answered.
  const lastIsMine = lines[lines.length - 1].senderId === selfId
  const wanted = lastIsMine ? 0 : (opts.unreadTail ?? 0)
  let firstUnreadIndex = -1
  let seen = 0
  for (let i = lines.length - 1; i >= 0 && seen < wanted; i--) {
    if (lines[i].senderId === selfId) continue
    seen++
    firstUnreadIndex = i
  }

  await prisma.message.createMany({
    data: lines.map((line, i) => ({
      conversationId,
      senderId: line.senderId,
      content: line.text,
      contentType: "text",
      status:
        firstUnreadIndex >= 0 && i >= firstUnreadIndex
          ? ("delivered" as const)
          : ("read" as const),
      createdAt: stamps[i],
      updatedAt: stamps[i],
    })),
  })

  const last = stamps[stamps.length - 1]
  const caughtUp = new Date(last.getTime() + 60_000)
  // A minute before the first unread line — the derived unread count is
  // `createdAt > lastReadAt`, so this leaves exactly the tail unread.
  const selfReadAt =
    firstUnreadIndex >= 0
      ? new Date(stamps[firstUnreadIndex].getTime() - 60_000)
      : caughtUp

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: last, updatedAt: last },
  })

  await prisma.conversationParticipant.updateMany({
    where: { conversationId, userId: { not: selfId } },
    data: { lastReadAt: caughtUp, unreadCount: 0 },
  })

  await prisma.conversationParticipant.updateMany({
    where: { conversationId, userId: selfId },
    data: {
      lastReadAt: selfReadAt,
      unreadCount: seen,
      isPinned: opts.pinned ?? false,
    },
  })

  return lines.length
}

async function runDirectThreads(
  prisma: PrismaClient,
  schoolId: string,
  selfId: string,
  threads: DirectThread[]
): Promise<{ conversations: number; messages: number }> {
  let conversations = 0
  let messages = 0

  for (const thread of threads) {
    const gaps = thread.turns.map((t) => t.gap ?? DEFAULT_GAP)
    const stamps = timeline(thread.daysAgo, thread.hour, gaps)
    const conversationId = await ensureDirect(
      prisma,
      schoolId,
      selfId,
      thread.other.userId,
      stamps[0]
    )
    if (!conversationId) continue

    messages += await writeDialogue(
      prisma,
      conversationId,
      selfId,
      thread.turns.map((turn) => ({
        senderId: turn.from === "self" ? selfId : thread.other.userId,
        text: turn.text,
      })),
      stamps,
      { unreadTail: thread.unreadTail, pinned: thread.pinned }
    )
    conversations++
  }

  return { conversations, messages }
}

async function runGroupThreads(
  prisma: PrismaClient,
  schoolId: string,
  selfId: string,
  groups: GroupThread[]
): Promise<{ conversations: number; messages: number }> {
  let conversations = 0
  let messages = 0

  for (const group of groups) {
    const gaps = group.lines.map((l) => l.gap ?? DEFAULT_GAP)
    const stamps = timeline(group.daysAgo, group.hour, gaps)
    const conversationId = await ensureGroup(prisma, schoolId, group, stamps[0])
    if (!conversationId) continue

    messages += await writeDialogue(
      prisma,
      conversationId,
      selfId,
      group.lines.map((line) => ({
        senderId: line.senderId ?? selfId,
        text: line.text,
      })),
      stamps,
      { unreadTail: group.unreadTail, pinned: group.pinned }
    )
    conversations++
  }

  return { conversations, messages }
}

// ============================================================================
// COUNTERPART RESOLUTION
// ============================================================================

async function findDemoUser(
  prisma: PrismaClient,
  schoolId: string,
  role: "STUDENT" | "TEACHER" | "GUARDIAN" | "ADMIN"
): Promise<{ id: string; email: string } | null> {
  // The demo accounts are the well-known ones seeded by ./auth.ts. Match on
  // the local part so a school seeded on another mail domain still resolves.
  const local = {
    STUDENT: "student@",
    TEACHER: "teacher@",
    GUARDIAN: "parent@",
    ADMIN: "admin@",
  }[role]

  const user = await prisma.user.findFirst({
    where: { schoolId, role, email: { startsWith: local } },
    select: { id: true, email: true },
  })
  return user as { id: string; email: string } | null
}

/** The student's own section teachers, each tagged with a subject they teach. */
async function teachersOfSection(
  prisma: PrismaClient,
  schoolId: string,
  sectionId: string,
  limit: number
): Promise<Person[]> {
  const slots = await prisma.timetable.findMany({
    where: { schoolId, sectionId, teacherId: { not: null } },
    select: {
      teacherId: true,
      // Section-based slots carry `subjectId`; the legacy subject-class link
      // is the fallback for schools still scheduled the old way.
      subject: { select: { name: true } },
      class: { select: { name: true } },
      teacher: {
        select: { id: true, firstName: true, lastName: true, userId: true },
      },
    },
  })

  const byUser = new Map<string, Person>()
  for (const slot of slots) {
    const teacher = slot.teacher
    if (!teacher?.userId) continue
    if (byUser.has(teacher.userId)) continue
    byUser.set(teacher.userId, {
      userId: teacher.userId,
      name: `${teacher.firstName} ${teacher.lastName}`.trim(),
      subject: slot.subject?.name ?? subjectOf(slot.class?.name),
    })
  }

  return [...byUser.values()].slice(0, limit)
}

async function classmatesOfSection(
  prisma: PrismaClient,
  schoolId: string,
  sectionId: string,
  excludeStudentId: string,
  limit: number
): Promise<Person[]> {
  const peers = await prisma.student.findMany({
    where: {
      schoolId,
      sectionId,
      id: { not: excludeStudentId },
      userId: { not: null },
    },
    select: { firstName: true, lastName: true, userId: true },
    orderBy: { firstName: "asc" },
    take: limit,
  })

  return peers.map((p) => ({
    userId: p.userId!,
    name: `${p.firstName} ${p.lastName}`.trim(),
  }))
}

// ============================================================================
// STUDENT INBOX
// ============================================================================

async function seedStudentInbox(
  prisma: PrismaClient,
  schoolId: string
): Promise<{ conversations: number; messages: number }> {
  const empty = { conversations: 0, messages: 0 }

  const account = await findDemoUser(prisma, schoolId, "STUDENT")
  if (!account) return empty

  const student = await prisma.student.findFirst({
    where: { schoolId, userId: account.id },
    select: { id: true, firstName: true, sectionId: true },
  })
  if (!student?.sectionId) return empty

  const [teachers, classmates, homeroom, teacherAccount] = await Promise.all([
    teachersOfSection(prisma, schoolId, student.sectionId, 8),
    classmatesOfSection(prisma, schoolId, student.sectionId, student.id, 5),
    prisma.section.findFirst({
      where: { schoolId, id: student.sectionId },
      select: {
        name: true,
        homeroomTeacher: {
          select: { firstName: true, lastName: true, userId: true },
        },
      },
    }),
    findDemoUser(prisma, schoolId, "TEACHER"),
  ])

  const me = student.firstName
  const threads: DirectThread[] = []

  // Subject teachers — one authored script each, spread over three weeks.
  const dayPlan = [0, 0, 1, 2, 4, 6, 9, 13]
  const hourPlan = [16, 9, 11, 14, 10, 13, 8, 12]
  teachers.forEach((teacher, i) => {
    const script = TEACHER_SCRIPTS[i % TEACHER_SCRIPTS.length]
    threads.push({
      other: teacher,
      daysAgo: dayPlan[i % dayPlan.length],
      hour: hourPlan[i % hourPlan.length],
      // Recent threads that end on the teacher's line arrive unread.
      unreadTail: endsIncoming(script) && i < 5 ? (i % 2 === 0 ? 1 : 2) : 0,
      pinned: i === 1,
      turns: script.map((turn) => ({
        ...turn,
        text: fill(turn.text, {
          student: me,
          teacher: teacher.name,
          subject: teacher.subject,
        }),
      })),
    })
  })

  // Homeroom teacher — the thread a student actually uses most.
  const hr = homeroom?.homeroomTeacher
  if (hr?.userId) {
    threads.push({
      other: {
        userId: hr.userId,
        name: `${hr.firstName} ${hr.lastName}`.trim(),
        subject: "الفصل",
      },
      daysAgo: 1,
      hour: 7,
      unreadTail: 1,
      turns: [
        {
          from: "other",
          text: `صباح الخير ${me}. طابور الصباح غداً مبكر بعشر دقائق بسبب الإذاعة المدرسية.`,
        },
        {
          from: "self",
          text: "تمام أستاذ/ة، سأحضر في السابعة تماماً.",
          gap: 20,
        },
        {
          from: "other",
          text: "ولا تنسَ إحضار استمارة الرحلة موقّعة من ولي الأمر.",
          gap: 35,
        },
      ],
    })
  }

  // Classmates.
  const peerDays = [0, 1, 3, 5, 8]
  const peerHours = [17, 15, 18, 16, 14]
  classmates.forEach((peer, i) => {
    const script = CLASSMATE_SCRIPTS[i % CLASSMATE_SCRIPTS.length]
    threads.push({
      other: peer,
      daysAgo: peerDays[i % peerDays.length],
      hour: peerHours[i % peerHours.length],
      unreadTail: endsIncoming(script) && i < 3 ? 1 : 0,
      turns: script.map((turn) => ({
        ...turn,
        text: fill(turn.text, { student: me, peer: peer.name.split(" ")[0] }),
      })),
    })
  })

  // The demo teacher account, so signing in as teacher@ shows the same thread.
  if (teacherAccount) {
    const mcg = await prisma.teacher.findFirst({
      where: { schoolId, userId: teacherAccount.id },
      select: { firstName: true, lastName: true },
    })
    threads.push({
      other: {
        userId: teacherAccount.id,
        name: mcg ? `${mcg.firstName} ${mcg.lastName}`.trim() : "المعلّمة",
      },
      daysAgo: 2,
      hour: 13,
      turns: [
        {
          from: "other",
          text: `${me}، ترشيحك لمسابقة البحث العلمي على مستوى المدرسة تم اعتماده.`,
        },
        { from: "self", text: "خبر سعيد! متى موعد تسليم الملخص؟", gap: 17 },
        {
          from: "other",
          text: "نهاية الشهر، وسأراجع معك المسودة قبل التسليم.",
          gap: 23,
        },
        { from: "self", text: "شكراً جزيلاً على دعمكم.", gap: 9 },
      ],
    })
  }

  const direct = await runDirectThreads(prisma, schoolId, account.id, threads)

  // Groups — a section room and a project room, both with the real members.
  const sectionName = homeroom?.name ?? "الفصل"
  const peerIds = classmates.map((c) => c.userId)
  const groups: GroupThread[] = []

  if (hr?.userId && peerIds.length >= 2) {
    groups.push({
      title: `مجموعة ${sectionName}`,
      description: `إعلانات ومتابعة يومية لطلاب ${sectionName}`,
      ownerId: hr.userId,
      memberIds: [hr.userId, account.id, ...peerIds],
      daysAgo: 0,
      hour: 8,
      unreadTail: 2,
      lines: [
        {
          senderId: hr.userId,
          text: "صباح الخير جميعاً. حصة النشاط اليوم في القاعة الكبرى بدلاً من الفصل.",
        },
        { senderId: peerIds[0], text: "تمام أستاذ/ة، وصلت الرسالة.", gap: 11 },
        { senderId: null, text: "هل نحضر الكتب أم الدفاتر فقط؟", gap: 6 },
        { senderId: hr.userId, text: "الدفاتر فقط.", gap: 4 },
        {
          senderId: peerIds[1],
          text: "وهل يتأجل تسليم البحث لبعد النشاط؟",
          gap: 9,
        },
        {
          senderId: hr.userId,
          text: "نعم، التسليم غداً قبل الحصة الأولى.",
          gap: 13,
        },
      ],
    })
  }

  const physics = teachers.find((t) => t.subject?.includes("الفيزياء"))
  const projectOwner = physics ?? teachers[0]
  if (projectOwner && peerIds.length >= 2) {
    groups.push({
      title: "مشروع الطاقة المتجددة",
      description: "مجموعة عمل مشروع الفصل الدراسي",
      ownerId: projectOwner.userId,
      memberIds: [projectOwner.userId, account.id, peerIds[0], peerIds[1]],
      daysAgo: 3,
      hour: 19,
      lines: [
        {
          senderId: projectOwner.userId,
          text: "المجموعة مكتملة. ابدأوا بجمع المصادر وأرسلوا خطة العمل خلال أسبوع.",
        },
        { senderId: null, text: "سأتولى الجزء العملي والقياسات.", gap: 21 },
        {
          senderId: peerIds[0],
          text: "وأنا المقدمة والإطار النظري.",
          gap: 14,
        },
        { senderId: peerIds[1], text: "وأنا التصميم وعرض الشرائح.", gap: 7 },
        {
          senderId: projectOwner.userId,
          text: "توزيع ممتاز. نلتقي الخميس لمراجعة أول مسودة.",
          gap: 26,
        },
      ],
    })
  }

  const group = await runGroupThreads(prisma, schoolId, account.id, groups)

  return {
    conversations: direct.conversations + group.conversations,
    messages: direct.messages + group.messages,
  }
}

// ============================================================================
// TEACHER INBOX
// ============================================================================

async function seedTeacherInbox(
  prisma: PrismaClient,
  schoolId: string
): Promise<{ conversations: number; messages: number }> {
  const empty = { conversations: 0, messages: 0 }

  const account = await findDemoUser(prisma, schoolId, "TEACHER")
  if (!account) return empty

  const teacher = await prisma.teacher.findFirst({
    where: { schoolId, userId: account.id },
    select: { id: true },
  })
  if (!teacher) return empty

  // Counterparts: the sections this teacher actually teaches give us students;
  // colleagues and guardians round the inbox out.
  const slots = await prisma.timetable.findMany({
    where: { schoolId, teacherId: teacher.id },
    select: { sectionId: true },
    distinct: ["sectionId"],
    take: 5,
  })
  const sectionIds = slots.map((s) => s.sectionId).filter(Boolean) as string[]

  const [students, colleagues, guardians] = await Promise.all([
    sectionIds.length
      ? prisma.student.findMany({
          where: {
            schoolId,
            sectionId: { in: sectionIds },
            userId: { not: null },
          },
          select: { firstName: true, lastName: true, userId: true },
          orderBy: { firstName: "asc" },
          take: 3,
        })
      : Promise.resolve([]),
    prisma.teacher.findMany({
      where: { schoolId, userId: { not: null }, id: { not: teacher.id } },
      select: { firstName: true, lastName: true, userId: true },
      orderBy: { firstName: "asc" },
      take: 3,
    }),
    prisma.guardian.findMany({
      where: { schoolId, userId: { not: null } },
      select: { firstName: true, lastName: true, userId: true },
      orderBy: { firstName: "asc" },
      take: 3,
    }),
  ])

  const people: Person[] = [...guardians, ...colleagues, ...students].map(
    (p) => ({
      userId: p.userId!,
      name: `${p.firstName} ${p.lastName}`.trim(),
    })
  )

  const dayPlan = [0, 0, 1, 2, 4, 7, 10, 12]
  const hourPlan = [15, 9, 12, 8, 14, 11, 16, 10]
  const threads: DirectThread[] = people.map((other, i) => ({
    other,
    daysAgo: dayPlan[i % dayPlan.length],
    hour: hourPlan[i % hourPlan.length],
    unreadTail:
      endsIncoming(TEACHER_ACCOUNT_SCRIPTS[i % TEACHER_ACCOUNT_SCRIPTS.length]) &&
      i < 4
        ? 1
        : 0,
    pinned: i === 1,
    turns: TEACHER_ACCOUNT_SCRIPTS[i % TEACHER_ACCOUNT_SCRIPTS.length],
  }))

  const direct = await runDirectThreads(prisma, schoolId, account.id, threads)

  const colleagueIds = colleagues
    .map((c) => c.userId)
    .filter(Boolean) as string[]
  const groups: GroupThread[] =
    colleagueIds.length >= 2
      ? [
          {
            title: "هيئة التدريس — تنسيق أسبوعي",
            description: "تنسيق الحصص والاختبارات بين المعلمين",
            ownerId: account.id,
            memberIds: [account.id, ...colleagueIds],
            daysAgo: 1,
            hour: 13,
            unreadTail: 1,
            lines: [
              {
                senderId: null,
                text: "السلام عليكم، اجتماع تنسيق الاختبارات غداً بعد الحصة الخامسة.",
              },
              {
                senderId: colleagueIds[0],
                text: "حاضر، سأجهّز جدول المواد.",
                gap: 18,
              },
              {
                senderId: colleagueIds[1],
                text: "أرجو مراعاة ألا تتجاور مادتان ثقيلتان في يوم واحد.",
                gap: 12,
              },
              {
                senderId: colleagueIds[0],
                text: "سنراجع التوزيع في الاجتماع.",
                gap: 9,
              },
            ],
          },
        ]
      : []

  const group = await runGroupThreads(prisma, schoolId, account.id, groups)

  return {
    conversations: direct.conversations + group.conversations,
    messages: direct.messages + group.messages,
  }
}

// ============================================================================
// GUARDIAN INBOX
// ============================================================================

async function seedGuardianInbox(
  prisma: PrismaClient,
  schoolId: string
): Promise<{ conversations: number; messages: number }> {
  const empty = { conversations: 0, messages: 0 }

  const account = await findDemoUser(prisma, schoolId, "GUARDIAN")
  if (!account) return empty

  const guardian = await prisma.guardian.findFirst({
    where: { schoolId, userId: account.id },
    select: { id: true },
  })
  if (!guardian) return empty

  // The child's own teachers when the child is placed in a section; otherwise
  // any teaching staff, so the inbox is never empty in a thin tenant.
  const links = await prisma.studentGuardian.findMany({
    where: { guardianId: guardian.id },
    select: { student: { select: { sectionId: true } } },
  })
  const sectionIds = links
    .map((l) => l.student?.sectionId)
    .filter(Boolean) as string[]

  const teachers = sectionIds.length
    ? await teachersOfSection(prisma, schoolId, sectionIds[0], 4)
    : (
        await prisma.teacher.findMany({
          where: { schoolId, userId: { not: null } },
          select: { firstName: true, lastName: true, userId: true },
          orderBy: { firstName: "asc" },
          take: 4,
        })
      ).map((t) => ({
        userId: t.userId!,
        name: `${t.firstName} ${t.lastName}`.trim(),
      }))

  const admin = await findDemoUser(prisma, schoolId, "ADMIN")
  const people: Person[] = [...teachers]
  if (admin) people.push({ userId: admin.id, name: "إدارة المدرسة" })

  const dayPlan = [0, 1, 3, 6, 9]
  const hourPlan = [16, 10, 13, 9, 17]
  const threads: DirectThread[] = people.map((other, i) => ({
    other,
    daysAgo: dayPlan[i % dayPlan.length],
    hour: hourPlan[i % hourPlan.length],
    unreadTail: endsIncoming(GUARDIAN_SCRIPTS[i % GUARDIAN_SCRIPTS.length])
      ? 1
      : 0,
    pinned: i === 0,
    turns: GUARDIAN_SCRIPTS[i % GUARDIAN_SCRIPTS.length],
  }))

  const direct = await runDirectThreads(prisma, schoolId, account.id, threads)
  return direct
}

// ============================================================================
// MAIN
// ============================================================================

/**
 * Give the demo-driving accounts (student@, teacher@, parent@) a populated
 * inbox. Safe to re-run: existing conversations are never rewritten.
 */
export async function seedDemoInboxes(
  prisma: PrismaClient,
  schoolId: string
): Promise<number> {
  const [student, teacher, guardian] = [
    await seedStudentInbox(prisma, schoolId),
    await seedTeacherInbox(prisma, schoolId),
    await seedGuardianInbox(prisma, schoolId),
  ]

  const conversations =
    student.conversations + teacher.conversations + guardian.conversations
  const messages = student.messages + teacher.messages + guardian.messages

  logSuccess(
    "Demo inboxes",
    conversations,
    `student ${student.conversations} / teacher ${teacher.conversations} / guardian ${guardian.conversations} conversations, ${messages} messages`
  )

  return messages
}
