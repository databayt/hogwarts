"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import type { UserRole } from "@prisma/client"

import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import * as evolution from "@/lib/whatsapp/evolution-client"
import { checkAndConsumeRateLimit } from "@/lib/whatsapp/rate-limiter"

import { canPerformWhatsAppAction } from "./authorization"
import {
  getGuardianPhonesForClass,
  getGuardianPhonesForSection,
} from "./queries"
import {
  addParticipantsSchema,
  autoGroupSchema,
  connectWhatsAppSchema,
  createGroupSchema,
  removeParticipantsSchema,
  saveTemplateSchema,
  sendBroadcastSchema,
  sendMessageSchema,
} from "./validation"

// =============================================================================
// Helper
// =============================================================================

async function getAuthorizedContext(
  action: Parameters<typeof canPerformWhatsAppAction>[1]
) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "NOT_AUTHENTICATED" as const }
  }

  const { schoolId } = await getTenantContext()
  if (!schoolId) {
    return { error: "MISSING_SCHOOL_CONTEXT" as const }
  }

  const role = session.user.role as UserRole
  if (!canPerformWhatsAppAction(role, action)) {
    return { error: "UNAUTHORIZED" as const }
  }

  return { userId: session.user.id, schoolId, role }
}

function revalidateWhatsApp(schoolId: string) {
  revalidatePath(`/[lang]/s/[subdomain]/(school-dashboard)/whatsapp`, "page")
}

// =============================================================================
// Connection Management
// =============================================================================

export async function connectWhatsApp(): Promise<
  ActionResponse<{ qrCode: string | null }>
> {
  const ctx = await getAuthorizedContext("connect")
  if ("error" in ctx) return { success: false, code: ctx.error }
  const { schoolId } = ctx

  try {
    const instanceName = `school_${schoolId.replace(/[^a-zA-Z0-9]/g, "_")}`
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/whatsapp`

    // Check if session already exists
    let dbSession = await db.whatsAppSession.findUnique({
      where: { schoolId },
    })

    if (!dbSession) {
      // Create Evolution API instance
      await evolution.createInstance(instanceName, webhookUrl)

      dbSession = await db.whatsAppSession.create({
        data: {
          schoolId,
          instanceName,
          status: "qr_pending",
          webhookUrl,
        },
      })
    }

    // Get QR code
    const qrResponse = await evolution.getQRCode(instanceName)

    // Update session with QR
    await db.whatsAppSession.update({
      where: { schoolId },
      data: {
        qrCode: qrResponse.base64,
        status: "qr_pending",
      },
    })

    revalidateWhatsApp(schoolId)

    return {
      success: true,
      data: { qrCode: qrResponse.base64 },
    }
  } catch (error) {
    console.error("[connectWhatsApp]", error)
    return {
      success: false,
      code: "CONNECTION_FAILED",
      error: error instanceof Error ? error.message : "Connection failed",
    }
  }
}

export async function disconnectWhatsApp(): Promise<ActionResponse> {
  const ctx = await getAuthorizedContext("connect")
  if ("error" in ctx) return { success: false, code: ctx.error }
  const { schoolId } = ctx

  try {
    const session = await db.whatsAppSession.findUnique({
      where: { schoolId },
    })

    if (session) {
      await evolution.logoutInstance(session.instanceName).catch(() => {})
      await evolution.deleteInstance(session.instanceName).catch(() => {})

      await db.whatsAppSession.update({
        where: { schoolId },
        data: {
          status: "disconnected",
          qrCode: null,
          phoneNumber: null,
          connectedAt: null,
        },
      })
    }

    revalidateWhatsApp(schoolId)
    return { success: true }
  } catch (error) {
    console.error("[disconnectWhatsApp]", error)
    return { success: false, code: "DISCONNECT_FAILED" }
  }
}

export async function refreshConnectionStatus(): Promise<
  ActionResponse<{ status: string }>
> {
  const ctx = await getAuthorizedContext("view")
  if ("error" in ctx) return { success: false, code: ctx.error }
  const { schoolId } = ctx

  try {
    const session = await db.whatsAppSession.findUnique({
      where: { schoolId },
    })

    if (!session) {
      return { success: true, data: { status: "disconnected" } }
    }

    const status = await evolution.getInstanceStatus(session.instanceName)
    const newStatus = status.state === "open" ? "connected" : "disconnected"

    if (newStatus !== session.status) {
      await db.whatsAppSession.update({
        where: { schoolId },
        data: {
          status: newStatus,
          ...(newStatus === "connected" && !session.connectedAt
            ? { connectedAt: new Date() }
            : {}),
        },
      })
    }

    revalidateWhatsApp(schoolId)
    return { success: true, data: { status: newStatus } }
  } catch (error) {
    console.error("[refreshConnectionStatus]", error)
    return { success: false, code: "STATUS_CHECK_FAILED" }
  }
}

// =============================================================================
// Messaging
// =============================================================================

export async function sendWhatsAppMessage(
  formData: unknown
): Promise<ActionResponse<{ messageId: string }>> {
  const ctx = await getAuthorizedContext("send_message")
  if ("error" in ctx) return { success: false, code: ctx.error }
  const { schoolId } = ctx

  const parsed = sendMessageSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, code: "VALIDATION_ERROR" }
  }

  const { recipientPhone, groupId, content, contentType, mediaUrl } =
    parsed.data

  if (!recipientPhone && !groupId) {
    return { success: false, code: "NO_RECIPIENT" }
  }

  try {
    const session = await db.whatsAppSession.findUnique({
      where: { schoolId },
    })

    if (!session || session.status !== "connected") {
      return { success: false, code: "NOT_CONNECTED" }
    }

    // Rate limit check
    const rateCheck = checkAndConsumeRateLimit(schoolId, {
      groupId: groupId ?? undefined,
      connectedSince: session.connectedAt ?? undefined,
    })

    if (!rateCheck.allowed) {
      return { success: false, code: "RATE_LIMITED" }
    }

    // Resolve recipient
    let to = recipientPhone ?? ""
    if (groupId) {
      const group = await db.whatsAppGroup.findFirst({
        where: { id: groupId, schoolId },
        select: { groupJid: true },
      })
      if (!group) return { success: false, code: "GROUP_NOT_FOUND" }
      to = group.groupJid
    }

    // Send via Evolution API
    let result: evolution.SendMessageResponse
    if (contentType === "text" || !mediaUrl) {
      result = await evolution.sendText(session.instanceName, to, content)
    } else {
      result = await evolution.sendMedia(session.instanceName, to, mediaUrl, {
        caption: content,
        mediatype: contentType as "image" | "document" | "audio" | "video",
      })
    }

    // Log message
    const message = await db.whatsAppMessage.create({
      data: {
        schoolId,
        sessionId: session.id,
        groupId: groupId ?? null,
        recipientPhone: recipientPhone ?? null,
        waMessageId: result.key.id,
        content,
        contentType,
        direction: "outgoing",
        status: "sent",
        sentAt: new Date(),
      },
    })

    revalidateWhatsApp(schoolId)
    return { success: true, data: { messageId: message.id } }
  } catch (error) {
    console.error("[sendWhatsAppMessage]", error)
    return { success: false, code: "SEND_FAILED" }
  }
}

export async function sendBroadcast(
  formData: unknown
): Promise<ActionResponse<{ sent: number; failed: number }>> {
  const ctx = await getAuthorizedContext("broadcast")
  if ("error" in ctx) return { success: false, code: ctx.error }
  const { schoolId } = ctx

  const parsed = sendBroadcastSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, code: "VALIDATION_ERROR" }
  }

  const { groupIds, content } = parsed.data

  try {
    const session = await db.whatsAppSession.findUnique({
      where: { schoolId },
    })

    if (!session || session.status !== "connected") {
      return { success: false, code: "NOT_CONNECTED" }
    }

    const groups = await db.whatsAppGroup.findMany({
      where: { id: { in: groupIds }, schoolId, isActive: true },
      select: { id: true, groupJid: true },
    })

    let sent = 0
    let failed = 0

    for (const group of groups) {
      const rateCheck = checkAndConsumeRateLimit(schoolId, {
        groupId: group.id,
        connectedSince: session.connectedAt ?? undefined,
      })

      if (!rateCheck.allowed) {
        failed++
        continue
      }

      try {
        const result = await evolution.sendText(
          session.instanceName,
          group.groupJid,
          content
        )

        await db.whatsAppMessage.create({
          data: {
            schoolId,
            sessionId: session.id,
            groupId: group.id,
            waMessageId: result.key.id,
            content,
            contentType: "text",
            direction: "outgoing",
            status: "sent",
            sentAt: new Date(),
            triggerType: "broadcast",
          },
        })

        sent++
      } catch {
        failed++
      }

      // Stagger sends (1 second between each)
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    revalidateWhatsApp(schoolId)
    return { success: true, data: { sent, failed } }
  } catch (error) {
    console.error("[sendBroadcast]", error)
    return { success: false, code: "BROADCAST_FAILED" }
  }
}

// =============================================================================
// Group Management
// =============================================================================

export async function createWhatsAppGroup(
  formData: unknown
): Promise<ActionResponse<{ groupId: string }>> {
  const ctx = await getAuthorizedContext("manage_groups")
  if ("error" in ctx) return { success: false, code: ctx.error }
  const { schoolId } = ctx

  const parsed = createGroupSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, code: "VALIDATION_ERROR" }
  }

  const { name, description, type, sectionId, classId, participants } =
    parsed.data

  try {
    const session = await db.whatsAppSession.findUnique({
      where: { schoolId },
    })

    if (!session || session.status !== "connected") {
      return { success: false, code: "NOT_CONNECTED" }
    }

    // Create group on WhatsApp
    const waGroup = await evolution.createGroup(
      session.instanceName,
      name,
      participants.map(evolution.formatPhoneForWhatsApp)
    )

    if (description) {
      await evolution.updateGroupDescription(
        session.instanceName,
        waGroup.id,
        description
      )
    }

    // Save to database
    const group = await db.whatsAppGroup.create({
      data: {
        schoolId,
        sessionId: session.id,
        groupJid: waGroup.id,
        name,
        description,
        type,
        sectionId: sectionId ?? null,
        classId: classId ?? null,
        memberCount: participants.length,
      },
    })

    // Save members
    await db.whatsAppGroupMember.createMany({
      data: participants.map((phone) => ({
        schoolId,
        groupId: group.id,
        phone,
      })),
    })

    revalidateWhatsApp(schoolId)
    return { success: true, data: { groupId: group.id } }
  } catch (error) {
    console.error("[createWhatsAppGroup]", error)
    return { success: false, code: "GROUP_CREATE_FAILED" }
  }
}

export async function addGroupParticipants(
  formData: unknown
): Promise<ActionResponse> {
  const ctx = await getAuthorizedContext("manage_groups")
  if ("error" in ctx) return { success: false, code: ctx.error }
  const { schoolId } = ctx

  const parsed = addParticipantsSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, code: "VALIDATION_ERROR" }
  }

  const { groupId, participants } = parsed.data

  try {
    const group = await db.whatsAppGroup.findFirst({
      where: { id: groupId, schoolId },
      include: { session: { select: { instanceName: true, status: true } } },
    })

    if (!group || group.session.status !== "connected") {
      return { success: false, code: "NOT_CONNECTED" }
    }

    await evolution.addGroupParticipants(
      group.session.instanceName,
      group.groupJid,
      participants.map(evolution.formatPhoneForWhatsApp)
    )

    // Save new members
    const existingMembers = await db.whatsAppGroupMember.findMany({
      where: { groupId, phone: { in: participants } },
      select: { phone: true },
    })
    const existingPhones = new Set(existingMembers.map((m) => m.phone))
    const newParticipants = participants.filter((p) => !existingPhones.has(p))

    if (newParticipants.length > 0) {
      await db.whatsAppGroupMember.createMany({
        data: newParticipants.map((phone) => ({
          schoolId,
          groupId,
          phone,
        })),
      })

      await db.whatsAppGroup.update({
        where: { id: groupId },
        data: { memberCount: { increment: newParticipants.length } },
      })
    }

    revalidateWhatsApp(schoolId)
    return { success: true }
  } catch (error) {
    console.error("[addGroupParticipants]", error)
    return { success: false, code: "ADD_PARTICIPANTS_FAILED" }
  }
}

export async function removeGroupParticipants(
  formData: unknown
): Promise<ActionResponse> {
  const ctx = await getAuthorizedContext("manage_groups")
  if ("error" in ctx) return { success: false, code: ctx.error }
  const { schoolId } = ctx

  const parsed = removeParticipantsSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, code: "VALIDATION_ERROR" }
  }

  const { groupId, participants } = parsed.data

  try {
    const group = await db.whatsAppGroup.findFirst({
      where: { id: groupId, schoolId },
      include: { session: { select: { instanceName: true, status: true } } },
    })

    if (!group || group.session.status !== "connected") {
      return { success: false, code: "NOT_CONNECTED" }
    }

    await evolution.removeGroupParticipants(
      group.session.instanceName,
      group.groupJid,
      participants.map(evolution.formatPhoneForWhatsApp)
    )

    const deleted = await db.whatsAppGroupMember.deleteMany({
      where: { groupId, phone: { in: participants } },
    })

    await db.whatsAppGroup.update({
      where: { id: groupId },
      data: { memberCount: { decrement: deleted.count } },
    })

    revalidateWhatsApp(schoolId)
    return { success: true }
  } catch (error) {
    console.error("[removeGroupParticipants]", error)
    return { success: false, code: "REMOVE_PARTICIPANTS_FAILED" }
  }
}

export async function deleteWhatsAppGroup(
  groupId: string
): Promise<ActionResponse> {
  const ctx = await getAuthorizedContext("manage_groups")
  if ("error" in ctx) return { success: false, code: ctx.error }
  const { schoolId } = ctx

  try {
    const group = await db.whatsAppGroup.findFirst({
      where: { id: groupId, schoolId },
      include: { session: { select: { instanceName: true, status: true } } },
    })

    if (!group) return { success: false, code: "GROUP_NOT_FOUND" }

    // Leave the WhatsApp group if connected
    if (group.session.status === "connected") {
      await evolution
        .leaveGroup(group.session.instanceName, group.groupJid)
        .catch(() => {})
    }

    // Soft delete — mark inactive
    await db.whatsAppGroup.update({
      where: { id: groupId },
      data: { isActive: false },
    })

    revalidateWhatsApp(schoolId)
    return { success: true }
  } catch (error) {
    console.error("[deleteWhatsAppGroup]", error)
    return { success: false, code: "DELETE_GROUP_FAILED" }
  }
}

// =============================================================================
// Auto Group Creation (from enrollment data)
// =============================================================================

export async function createAutoGroup(
  formData: unknown
): Promise<ActionResponse<{ groupId: string }>> {
  const ctx = await getAuthorizedContext("manage_groups")
  if ("error" in ctx) return { success: false, code: ctx.error }
  const { schoolId } = ctx

  const parsed = autoGroupSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, code: "VALIDATION_ERROR" }
  }

  const { sectionId, classId, type } = parsed.data

  try {
    const session = await db.whatsAppSession.findUnique({
      where: { schoolId },
    })

    if (!session || session.status !== "connected") {
      return { success: false, code: "NOT_CONNECTED" }
    }

    // Get guardian phone numbers based on type
    let guardianPhones: Array<{
      phone: string
      guardianId: string
      userId: string | null
    }> = []
    let groupName = ""

    if (type === "section_parents" && sectionId) {
      const section = await db.section.findFirst({
        where: { id: sectionId, schoolId },
        select: { name: true },
      })
      if (!section) return { success: false, code: "SECTION_NOT_FOUND" }

      groupName = `${section.name} - Parents`
      guardianPhones = await getGuardianPhonesForSection(schoolId, sectionId)
    } else if (type === "class_parents" && classId) {
      const cls = await db.class.findFirst({
        where: { id: classId, schoolId },
        select: { name: true },
      })
      if (!cls) return { success: false, code: "CLASS_NOT_FOUND" }

      groupName = `${cls.name} - Parents`
      guardianPhones = await getGuardianPhonesForClass(schoolId, classId)
    } else {
      return { success: false, code: "INVALID_AUTO_GROUP_CONFIG" }
    }

    if (guardianPhones.length === 0) {
      return { success: false, code: "NO_GUARDIAN_PHONES" }
    }

    // Deduplicate phones
    const uniquePhones = [...new Set(guardianPhones.map((gp) => gp.phone))]

    // Check if group already exists for this section/class
    const existingGroup = await db.whatsAppGroup.findFirst({
      where: {
        schoolId,
        ...(sectionId ? { sectionId } : {}),
        ...(classId ? { classId } : {}),
        type,
        isActive: true,
      },
    })

    if (existingGroup) {
      return { success: false, code: "GROUP_ALREADY_EXISTS" }
    }

    // Create group via Evolution API
    const waGroup = await evolution.createGroup(
      session.instanceName,
      groupName,
      uniquePhones.map(evolution.formatPhoneForWhatsApp)
    )

    // Save to database
    const group = await db.whatsAppGroup.create({
      data: {
        schoolId,
        sessionId: session.id,
        groupJid: waGroup.id,
        name: groupName,
        type,
        sectionId: sectionId ?? null,
        classId: classId ?? null,
        memberCount: uniquePhones.length,
      },
    })

    // Save members with user links
    await db.whatsAppGroupMember.createMany({
      data: uniquePhones.map((phone) => {
        const gp = guardianPhones.find((g) => g.phone === phone)
        return {
          schoolId,
          groupId: group.id,
          phone,
          userId: gp?.userId ?? null,
        }
      }),
    })

    revalidateWhatsApp(schoolId)
    return { success: true, data: { groupId: group.id } }
  } catch (error) {
    console.error("[createAutoGroup]", error)
    return { success: false, code: "AUTO_GROUP_FAILED" }
  }
}

// =============================================================================
// Template Management
// =============================================================================

export async function saveWhatsAppTemplate(
  formData: unknown
): Promise<ActionResponse<{ templateId: string }>> {
  const ctx = await getAuthorizedContext("manage_templates")
  if ("error" in ctx) return { success: false, code: ctx.error }
  const { schoolId } = ctx

  const parsed = saveTemplateSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, code: "VALIDATION_ERROR" }
  }

  const { id, name, content, type, lang, isActive } = parsed.data

  try {
    let template
    if (id) {
      template = await db.whatsAppMessageTemplate.update({
        where: { id },
        data: { name, content, type, lang, isActive },
      })
    } else {
      template = await db.whatsAppMessageTemplate.create({
        data: { schoolId, name, content, type, lang, isActive },
      })
    }

    revalidateWhatsApp(schoolId)
    return { success: true, data: { templateId: template.id } }
  } catch (error) {
    console.error("[saveWhatsAppTemplate]", error)
    return { success: false, code: "TEMPLATE_SAVE_FAILED" }
  }
}

export async function deleteWhatsAppTemplate(
  templateId: string
): Promise<ActionResponse> {
  const ctx = await getAuthorizedContext("manage_templates")
  if ("error" in ctx) return { success: false, code: ctx.error }
  const { schoolId } = ctx

  try {
    await db.whatsAppMessageTemplate.delete({
      where: { id: templateId, schoolId },
    })

    revalidateWhatsApp(schoolId)
    return { success: true }
  } catch (error) {
    console.error("[deleteWhatsAppTemplate]", error)
    return { success: false, code: "TEMPLATE_DELETE_FAILED" }
  }
}
