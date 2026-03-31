import { db } from "@/lib/db"
import { getRateLimitStatus } from "@/lib/whatsapp/rate-limiter"

import type {
  WhatsAppGroupDTO,
  WhatsAppGroupMemberDTO,
  WhatsAppMessageDTO,
  WhatsAppSessionDTO,
  WhatsAppStats,
  WhatsAppTemplateDTO,
} from "./types"

// =============================================================================
// Session Queries
// =============================================================================

export async function getWhatsAppSession(
  schoolId: string
): Promise<WhatsAppSessionDTO | null> {
  const session = await db.whatsAppSession.findUnique({
    where: { schoolId },
  })

  if (!session) return null

  return {
    id: session.id,
    schoolId: session.schoolId,
    instanceName: session.instanceName,
    phoneNumber: session.phoneNumber,
    status: session.status,
    qrCode: session.qrCode,
    connectedAt: session.connectedAt?.toISOString() ?? null,
    createdAt: session.createdAt.toISOString(),
  }
}

// =============================================================================
// Group Queries
// =============================================================================

export async function getWhatsAppGroups(
  schoolId: string
): Promise<WhatsAppGroupDTO[]> {
  const groups = await db.whatsAppGroup.findMany({
    where: { schoolId },
    include: {
      section: { select: { name: true } },
      class: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return groups.map((g) => ({
    id: g.id,
    schoolId: g.schoolId,
    groupJid: g.groupJid,
    name: g.name,
    description: g.description,
    type: g.type,
    sectionId: g.sectionId,
    classId: g.classId,
    isActive: g.isActive,
    memberCount: g.memberCount,
    sectionName: g.section?.name ?? null,
    className: g.class?.name ?? null,
    createdAt: g.createdAt.toISOString(),
  }))
}

export async function getWhatsAppGroupMembers(
  schoolId: string,
  groupId: string
): Promise<WhatsAppGroupMemberDTO[]> {
  const members = await db.whatsAppGroupMember.findMany({
    where: { schoolId, groupId },
    include: {
      user: { select: { username: true } },
    },
    orderBy: { createdAt: "asc" },
  })

  return members.map((m) => ({
    id: m.id,
    phone: m.phone,
    name: m.name,
    userId: m.userId,
    isAdmin: m.isAdmin,
    userName: m.user?.username ?? null,
  }))
}

// =============================================================================
// Message Queries
// =============================================================================

export async function getWhatsAppMessages(
  schoolId: string,
  options?: { groupId?: string; limit?: number; offset?: number }
): Promise<WhatsAppMessageDTO[]> {
  const messages = await db.whatsAppMessage.findMany({
    where: {
      schoolId,
      ...(options?.groupId ? { groupId: options.groupId } : {}),
    },
    include: {
      group: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: options?.limit ?? 50,
    skip: options?.offset ?? 0,
  })

  return messages.map((m) => ({
    id: m.id,
    groupId: m.groupId,
    recipientPhone: m.recipientPhone,
    content: m.content,
    contentType: m.contentType,
    direction: m.direction,
    status: m.status,
    triggerType: m.triggerType,
    sentAt: m.sentAt?.toISOString() ?? null,
    createdAt: m.createdAt.toISOString(),
    groupName: m.group?.name ?? null,
  }))
}

// =============================================================================
// Template Queries
// =============================================================================

export async function getWhatsAppTemplates(
  schoolId: string
): Promise<WhatsAppTemplateDTO[]> {
  const templates = await db.whatsAppMessageTemplate.findMany({
    where: {
      OR: [{ schoolId }, { schoolId: null }],
    },
    orderBy: [{ schoolId: "desc" }, { name: "asc" }], // School templates first
  })

  return templates.map((t) => ({
    id: t.id,
    name: t.name,
    content: t.content,
    type: t.type,
    lang: t.lang,
    isActive: t.isActive,
    createdAt: t.createdAt.toISOString(),
  }))
}

// =============================================================================
// Stats
// =============================================================================

export async function getWhatsAppStats(
  schoolId: string
): Promise<WhatsAppStats> {
  const session = await db.whatsAppSession.findUnique({
    where: { schoolId },
    select: { status: true, phoneNumber: true },
  })

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const [totalGroups, totalMessagesSent, todayMessagesSent] = await Promise.all(
    [
      db.whatsAppGroup.count({ where: { schoolId, isActive: true } }),
      db.whatsAppMessage.count({
        where: { schoolId, direction: "outgoing" },
      }),
      db.whatsAppMessage.count({
        where: {
          schoolId,
          direction: "outgoing",
          createdAt: { gte: todayStart },
        },
      }),
    ]
  )

  const rateLimitStatus = getRateLimitStatus(schoolId)

  return {
    isConnected: session?.status === "connected",
    phoneNumber: session?.phoneNumber ?? null,
    totalGroups,
    totalMessagesSent,
    todayMessagesSent,
    dailyLimit: rateLimitStatus.dailyLimit,
  }
}

// =============================================================================
// Guardian Phone Lookup (for auto-group creation)
// =============================================================================

export async function getGuardianPhonesForSection(
  schoolId: string,
  sectionId: string
): Promise<
  Array<{ phone: string; guardianId: string; userId: string | null }>
> {
  const guardianPhones = await db.guardianPhoneNumber.findMany({
    where: {
      schoolId,
      guardian: {
        studentGuardians: {
          some: {
            student: { sectionId },
          },
        },
      },
    },
    include: {
      guardian: {
        select: {
          id: true,
          userId: true,
        },
      },
    },
  })

  return guardianPhones.map((gp) => ({
    phone: gp.phoneNumber,
    guardianId: gp.guardian.id,
    userId: gp.guardian.userId,
  }))
}

export async function getGuardianPhonesForClass(
  schoolId: string,
  classId: string
): Promise<
  Array<{ phone: string; guardianId: string; userId: string | null }>
> {
  const guardianPhones = await db.guardianPhoneNumber.findMany({
    where: {
      schoolId,
      guardian: {
        studentGuardians: {
          some: {
            student: {
              studentClasses: {
                some: { classId },
              },
            },
          },
        },
      },
    },
    include: {
      guardian: {
        select: {
          id: true,
          userId: true,
        },
      },
    },
  })

  return guardianPhones.map((gp) => ({
    phone: gp.phoneNumber,
    guardianId: gp.guardian.id,
    userId: gp.guardian.userId,
  }))
}
