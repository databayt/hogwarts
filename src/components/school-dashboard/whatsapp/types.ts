import type {
  WhatsAppGroupType,
  WhatsAppMessageDirection,
  WhatsAppMessageStatus,
  WhatsAppMessageType,
  WhatsAppSessionStatus,
} from "@prisma/client"

// =============================================================================
// Session DTOs
// =============================================================================

export type WhatsAppSessionDTO = {
  id: string
  schoolId: string
  instanceName: string
  phoneNumber: string | null
  status: WhatsAppSessionStatus
  qrCode: string | null
  connectedAt: string | null
  createdAt: string
}

// =============================================================================
// Group DTOs
// =============================================================================

export type WhatsAppGroupDTO = {
  id: string
  schoolId: string
  groupJid: string
  name: string
  description: string | null
  type: WhatsAppGroupType
  sectionId: string | null
  classId: string | null
  isActive: boolean
  memberCount: number
  sectionName: string | null
  className: string | null
  createdAt: string
}

export type WhatsAppGroupMemberDTO = {
  id: string
  phone: string
  name: string | null
  userId: string | null
  isAdmin: boolean
  userName: string | null
}

// =============================================================================
// Message DTOs
// =============================================================================

export type WhatsAppMessageDTO = {
  id: string
  groupId: string | null
  recipientPhone: string | null
  content: string
  contentType: WhatsAppMessageType
  direction: WhatsAppMessageDirection
  status: WhatsAppMessageStatus
  triggerType: string | null
  sentAt: string | null
  createdAt: string
  groupName: string | null
}

// =============================================================================
// Template DTOs
// =============================================================================

export type WhatsAppTemplateDTO = {
  id: string
  name: string
  content: string
  type: string
  lang: string
  isActive: boolean
  createdAt: string
}

// =============================================================================
// Dashboard Stats
// =============================================================================

export type WhatsAppStats = {
  isConnected: boolean
  phoneNumber: string | null
  totalGroups: number
  totalMessagesSent: number
  todayMessagesSent: number
  dailyLimit: number
}
