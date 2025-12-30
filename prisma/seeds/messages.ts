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
  "Thank you for your dedication to my child's education.",
  "Could we schedule a meeting to discuss progress?",
  "I noticed improvement in the last homework assignment.",
  "Is there any additional support available?",
  "The parent-teacher conference was very helpful.",
  "Please let me know if there are any concerns.",
  "My child mentioned enjoying your class.",
  "Are there any recommended resources for home study?",

  // Teacher-Teacher conversations
  "Can you share the curriculum materials?",
  "Let's coordinate on the upcoming project.",
  "The staff meeting was productive.",
  "Do you have time to discuss the assessment?",
  "I'll send the updated lesson plan.",
  "Thanks for covering my class yesterday.",

  // Admin communications
  "Please review the attached document.",
  "The deadline has been extended.",
  "Thank you for the quick response.",
  "I'll follow up on this matter.",
]

const GROUP_MESSAGE_TEMPLATES = [
  // Class group messages
  "Reminder: Assignment due tomorrow",
  "Great work on the project presentation!",
  "Tomorrow's class will start 10 minutes late.",
  "Study materials have been uploaded.",
  "Please complete the survey by Friday.",
  "Congratulations to everyone on the exam results!",
  "The field trip permission forms are due.",
  "Extra practice questions are available.",

  // Department messages
  "Department meeting scheduled for Thursday.",
  "New curriculum guidelines are attached.",
  "Please submit your quarterly reports.",
  "Professional development session next week.",
  "Sharing best practices from the workshop.",
  "Budget allocation has been approved.",
]

const ANNOUNCEMENT_TEMPLATES = [
  "School will be closed on Monday for the holiday.",
  "Registration for next semester is now open.",
  "Important: Updated safety protocols.",
  "Congratulations to our award winners!",
  "Annual sports day is scheduled for next month.",
  "Parent-teacher conferences begin next week.",
  "Final exam schedule has been posted.",
  "Library hours extended during exam period.",
]

const CONVERSATION_TITLES = {
  group: [
    "Grade 10 Mathematics Group",
    "Science Club Discussion",
    "Student Council",
    "PTA Committee",
    "Sports Team Chat",
    "Art Club Members",
    "Debate Team",
    "Music Ensemble",
    "Chess Club",
    "Drama Group",
  ],
  department: [
    "Languages Department",
    "Sciences Department",
    "Humanities Team",
    "Administration Group",
    "ICT Team",
    "Arts & PE Faculty",
  ],
  announcement: [
    "School Announcements",
    "Urgent Notices",
    "Weekly Updates",
    "Academic Calendar",
    "Event Announcements",
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
            description: `Discussion group for ${title}`,
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
    const title = `Class ${i + 1} Discussion`
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
            description: "Class discussion and announcements",
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
            description: `${title} communication channel`,
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
