// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Messages Seed
 * Creates Conversations and Messages
 *
 * Phase 14: Communications
 *
 * Features:
 * - 50 conversations (direct, group, class, department types)
 * - 300+ messages with realistic content
 * - Mix of read/unread status
 * - Participant distribution across user types
 */

import type { PrismaClient } from "@prisma/client"

import type { StudentRef, TeacherRef, UserRef } from "./types"
import {
  logPhase,
  logSuccess,
  processBatch,
  randomElement,
  randomNumber,
} from "./utils"

// ============================================================================
// MESSAGE CONTENT TEMPLATES
// ============================================================================

const DIRECT_MESSAGE_TEMPLATES = [
  // Parent-Teacher conversations
  "شكراً لتفانيكم في تعليم ابني.",
  "هل يمكننا تحديد موعد لمناقشة التقدم الدراسي؟",
  "لاحظت تحسناً في الواجب المنزلي الأخير.",
  "هل يوجد دعم إضافي متاح؟",
  "كان اجتماع أولياء الأمور مع المعلمين مفيداً جداً.",
  "يرجى إعلامي في حال وجود أي ملاحظات.",
  "ذكر لي ابني أنه يستمتع بحصتكم.",
  "هل توجد مصادر موصى بها للمذاكرة في المنزل؟",

  // Teacher-Teacher conversations
  "هل يمكنك مشاركة المواد المنهجية؟",
  "لنتنسق بخصوص المشروع القادم.",
  "كان اجتماع الهيئة التدريسية مثمراً.",
  "هل لديك وقت لمناقشة التقييم؟",
  "سأرسل خطة الدرس المحدثة.",
  "شكراً لتغطيتك حصتي بالأمس.",

  // Admin communications
  "يرجى مراجعة المستند المرفق.",
  "تم تمديد الموعد النهائي.",
  "شكراً على سرعة الرد.",
  "سأتابع هذا الأمر.",
]

const GROUP_MESSAGE_TEMPLATES = [
  // Class group messages
  "تذكير: موعد تسليم الواجب غداً",
  "عمل رائع في عرض المشروع!",
  "ستبدأ حصة الغد متأخرة 10 دقائق.",
  "تم رفع مواد المذاكرة.",
  "يرجى إكمال الاستبيان قبل يوم الجمعة.",
  "تهانينا للجميع على نتائج الامتحان!",
  "موعد تسليم استمارات إذن الرحلة الميدانية.",
  "تتوفر أسئلة تدريبية إضافية.",

  // Department messages
  "اجتماع القسم مقرر يوم الخميس.",
  "إرشادات المنهج الجديدة مرفقة.",
  "يرجى تسليم تقاريركم الفصلية.",
  "جلسة تطوير مهني الأسبوع القادم.",
  "مشاركة أفضل الممارسات من ورشة العمل.",
  "تمت الموافقة على تخصيص الميزانية.",
]

const ANNOUNCEMENT_TEMPLATES = [
  "ستكون المدرسة مغلقة يوم الاثنين بمناسبة العطلة.",
  "التسجيل للفصل الدراسي القادم مفتوح الآن.",
  "مهم: تحديث بروتوكولات السلامة.",
  "تهانينا للفائزين بالجوائز!",
  "اليوم الرياضي السنوي مقرر الشهر القادم.",
  "تبدأ اجتماعات أولياء الأمور مع المعلمين الأسبوع القادم.",
  "تم نشر جدول الامتحانات النهائية.",
  "تم تمديد ساعات عمل المكتبة خلال فترة الامتحانات.",
]

const CONVERSATION_TITLES = {
  group: [
    "مجموعة رياضيات الصف العاشر",
    "نقاش نادي العلوم",
    "مجلس الطلاب",
    "لجنة أولياء الأمور والمعلمين",
    "محادثة الفريق الرياضي",
    "أعضاء نادي الفنون",
    "فريق المناظرات",
    "الفرقة الموسيقية",
    "نادي الشطرنج",
    "مجموعة المسرح",
  ],
  department: [
    "قسم اللغات",
    "قسم العلوم",
    "فريق العلوم الإنسانية",
    "مجموعة الإدارة",
    "فريق تقنية المعلومات",
    "هيئة الفنون والتربية البدنية",
  ],
  announcement: [
    "إعلانات المدرسة",
    "إشعارات عاجلة",
    "التحديثات الأسبوعية",
    "التقويم الدراسي",
    "إعلانات الفعاليات",
  ],
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate a random message based on conversation type
 */
function generateMessageContent(conversationType: string): string {
  switch (conversationType) {
    case "direct":
      return randomElement(DIRECT_MESSAGE_TEMPLATES)
    case "group":
    case "class":
      return randomElement(GROUP_MESSAGE_TEMPLATES)
    case "department":
      return randomElement([
        ...GROUP_MESSAGE_TEMPLATES,
        ...DIRECT_MESSAGE_TEMPLATES,
      ])
    case "announcement":
      return randomElement(ANNOUNCEMENT_TEMPLATES)
    default:
      return randomElement(DIRECT_MESSAGE_TEMPLATES)
  }
}

/**
 * Generate a date within the last 30 days
 */
function generateRecentDate(daysAgo: number = 30): Date {
  const date = new Date()
  date.setDate(date.getDate() - randomNumber(0, daysAgo))
  date.setHours(randomNumber(8, 18), randomNumber(0, 59), 0, 0)
  return date
}

// ============================================================================
// CONVERSATION SEEDING
// ============================================================================

/**
 * Seed conversations
 * Target: 50 conversations
 * - 20 direct (1-on-1)
 * - 15 group
 * - 10 class
 * - 5 department
 */
export async function seedConversations(
  prisma: PrismaClient,
  schoolId: string,
  teachers: TeacherRef[],
  students: StudentRef[],
  adminUsers: UserRef[]
): Promise<{ conversationIds: string[]; userIdMap: Map<string, string[]> }> {
  logPhase(14, "COMMUNICATIONS", "الرسائل والإشعارات")

  const conversationIds: string[] = []
  const userIdMap = new Map<string, string[]>() // conversationId -> participant userIds

  // Get user IDs
  const teacherUserIds = teachers
    .filter((t) => t.userId)
    .map((t) => t.userId!)
    .slice(0, 30)
  const studentUserIds = students
    .filter((s) => s.userId)
    .map((s) => s.userId!)
    .slice(0, 50)
  const adminUserIds = adminUsers.map((u) => u.id).slice(0, 4)

  const allUserIds = [...teacherUserIds, ...studentUserIds, ...adminUserIds]

  if (allUserIds.length < 10) {
    logSuccess("Conversations", 0, "not enough users")
    return { conversationIds, userIdMap }
  }

  // 1. Create Direct Conversations (20)
  for (let i = 0; i < 20; i++) {
    const user1 = randomElement(teacherUserIds) || allUserIds[0]
    const user2Candidates = [...studentUserIds, ...teacherUserIds].filter(
      (id) => id !== user1
    )
    const user2 = randomElement(user2Candidates) || allUserIds[1]

    try {
      // Check if direct conversation already exists
      const existing = await prisma.conversation.findFirst({
        where: {
          schoolId,
          type: "direct",
          OR: [
            { directParticipant1Id: user1, directParticipant2Id: user2 },
            { directParticipant1Id: user2, directParticipant2Id: user1 },
          ],
        },
      })

      if (!existing) {
        const conversation = await prisma.conversation.create({
          data: {
            schoolId,
            type: "direct",
            directParticipant1Id: user1,
            directParticipant2Id: user2,
            createdById: user1,
            lastMessageAt: generateRecentDate(10),
          },
        })

        // Create participants
        await prisma.conversationParticipant.createMany({
          data: [
            {
              conversationId: conversation.id,
              userId: user1,
              role: "owner",
            },
            {
              conversationId: conversation.id,
              userId: user2,
              role: "member",
            },
          ],
          skipDuplicates: true,
        })

        conversationIds.push(conversation.id)
        userIdMap.set(conversation.id, [user1, user2])
      }
    } catch {
      // Skip if conversation creation fails
    }
  }

  // 2. Create Group Conversations (15)
  const groupTitles = CONVERSATION_TITLES.group
  for (let i = 0; i < 15; i++) {
    const title = groupTitles[i % groupTitles.length]
    const creator = randomElement(teacherUserIds) || adminUserIds[0]

    try {
      const existing = await prisma.conversation.findFirst({
        where: { schoolId, type: "group", title },
      })

      if (!existing) {
        const conversation = await prisma.conversation.create({
          data: {
            schoolId,
            type: "group",
            title,
            description: `مجموعة نقاش لـ ${title}`,
            createdById: creator,
            lastMessageAt: generateRecentDate(15),
          },
        })

        // Add 3-8 participants
        const participantCount = randomNumber(3, 8)
        const participants = [creator]
        while (participants.length < participantCount) {
          const candidate = randomElement(allUserIds)
          if (!participants.includes(candidate)) {
            participants.push(candidate)
          }
        }

        await prisma.conversationParticipant.createMany({
          data: participants.map((userId, idx) => ({
            conversationId: conversation.id,
            userId,
            role: idx === 0 ? "owner" : "member",
          })),
          skipDuplicates: true,
        })

        conversationIds.push(conversation.id)
        userIdMap.set(conversation.id, participants)
      }
    } catch {
      // Skip if conversation creation fails
    }
  }

  // 3. Create Class Conversations (10)
  for (let i = 0; i < 10; i++) {
    const title = `نقاش الفصل ${i + 1}`
    const creator = randomElement(teacherUserIds) || adminUserIds[0]

    try {
      const existing = await prisma.conversation.findFirst({
        where: { schoolId, type: "class", title },
      })

      if (!existing) {
        const conversation = await prisma.conversation.create({
          data: {
            schoolId,
            type: "class",
            title,
            description: "نقاش الفصل والإعلانات",
            createdById: creator,
            lastMessageAt: generateRecentDate(20),
          },
        })

        // Add teacher + students (5-10)
        const studentCount = randomNumber(5, 10)
        const participants = [creator]
        for (let j = 0; j < studentCount; j++) {
          const student = studentUserIds[(i * 5 + j) % studentUserIds.length]
          if (!participants.includes(student)) {
            participants.push(student)
          }
        }

        await prisma.conversationParticipant.createMany({
          data: participants.map((userId, idx) => ({
            conversationId: conversation.id,
            userId,
            role: idx === 0 ? "owner" : "member",
          })),
          skipDuplicates: true,
        })

        conversationIds.push(conversation.id)
        userIdMap.set(conversation.id, participants)
      }
    } catch {
      // Skip if conversation creation fails
    }
  }

  // 4. Create Department Conversations (5)
  const deptTitles = CONVERSATION_TITLES.department
  for (let i = 0; i < 5; i++) {
    const title = deptTitles[i % deptTitles.length]
    const creator = randomElement(adminUserIds) || teacherUserIds[0]

    try {
      const existing = await prisma.conversation.findFirst({
        where: { schoolId, type: "department", title },
      })

      if (!existing) {
        const conversation = await prisma.conversation.create({
          data: {
            schoolId,
            type: "department",
            title,
            description: `قناة تواصل ${title}`,
            createdById: creator,
            lastMessageAt: generateRecentDate(25),
          },
        })

        // Add teachers from "department" (5-10)
        const participants = [creator]
        const teacherCount = randomNumber(5, 10)
        for (let j = 0; j < teacherCount; j++) {
          const teacher = teacherUserIds[(i * 5 + j) % teacherUserIds.length]
          if (!participants.includes(teacher)) {
            participants.push(teacher)
          }
        }

        await prisma.conversationParticipant.createMany({
          data: participants.map((userId, idx) => ({
            conversationId: conversation.id,
            userId,
            role: idx === 0 ? "owner" : idx === 1 ? "admin" : "member",
          })),
          skipDuplicates: true,
        })

        conversationIds.push(conversation.id)
        userIdMap.set(conversation.id, participants)
      }
    } catch {
      // Skip if conversation creation fails
    }
  }

  logSuccess(
    "Conversations",
    conversationIds.length,
    "direct + group + class + department"
  )

  return { conversationIds, userIdMap }
}

// ============================================================================
// MESSAGE SEEDING
// ============================================================================

/**
 * Seed messages for conversations
 * Target: 300+ messages
 */
export async function seedMessages(
  prisma: PrismaClient,
  conversationIds: string[],
  userIdMap: Map<string, string[]>
): Promise<number> {
  let messageCount = 0

  // Get conversation details
  const conversations = await prisma.conversation.findMany({
    where: { id: { in: conversationIds } },
    select: { id: true, type: true },
  })

  for (const conversation of conversations) {
    const participants = userIdMap.get(conversation.id) || []
    if (participants.length === 0) continue

    // Determine message count based on conversation type
    let msgCount: number
    switch (conversation.type) {
      case "direct":
        msgCount = randomNumber(4, 10)
        break
      case "group":
        msgCount = randomNumber(8, 15)
        break
      case "class":
        msgCount = randomNumber(6, 12)
        break
      case "department":
        msgCount = randomNumber(5, 10)
        break
      default:
        msgCount = randomNumber(3, 8)
    }

    // Generate messages spread over time
    const baseDate = new Date()
    baseDate.setDate(baseDate.getDate() - 30)

    for (let i = 0; i < msgCount; i++) {
      const sender = randomElement(participants)
      const content = generateMessageContent(conversation.type)

      // Spread messages over time
      const messageDate = new Date(baseDate)
      messageDate.setDate(
        messageDate.getDate() + Math.floor((i / msgCount) * 30)
      )
      messageDate.setHours(randomNumber(8, 20), randomNumber(0, 59), 0, 0)

      // 70% read, 30% delivered
      const status = Math.random() < 0.7 ? "read" : "delivered"

      try {
        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            senderId: sender,
            content,
            contentType: "text",
            status,
            createdAt: messageDate,
            updatedAt: messageDate,
          },
        })
        messageCount++
      } catch {
        // Skip if message creation fails
      }
    }

    // Update conversation lastMessageAt
    try {
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date() },
      })
    } catch {
      // Skip if update fails
    }
  }

  logSuccess("Messages", messageCount, "across all conversations")

  return messageCount
}

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

/**
 * Seed all messaging data
 * - 50 conversations
 * - 300+ messages
 */
export async function seedMessaging(
  prisma: PrismaClient,
  schoolId: string,
  teachers: TeacherRef[],
  students: StudentRef[],
  adminUsers: UserRef[]
): Promise<number> {
  // 1. Create conversations
  const { conversationIds, userIdMap } = await seedConversations(
    prisma,
    schoolId,
    teachers,
    students,
    adminUsers
  )

  // 2. Seed messages
  const messageCount = await seedMessages(prisma, conversationIds, userIdMap)

  return messageCount
}
