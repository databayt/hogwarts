import type { ElementType } from "react"
import type {
  ConversationType,
  MessageStatus,
  ParticipantRole,
} from "@prisma/client"
import { Building2, Hash, Megaphone, MessageSquare, Users } from "lucide-react"

// Conversation type configuration
export const CONVERSATION_TYPE_CONFIG: Record<
  ConversationType,
  {
    icon: ElementType
    label: string
    description: string
    color: string // Semantic token
    maxParticipants: number | null
    allowInvites: boolean
    allowFileSharing: boolean
    allowBroadcast: boolean
  }
> = {
  direct: {
    icon: MessageSquare,
    label: "Direct Message",
    description: "One-on-one private conversation",
    color: "text-blue-600",
    maxParticipants: 2,
    allowInvites: false,
    allowFileSharing: true,
    allowBroadcast: false,
  },
  group: {
    icon: Users,
    label: "Group Chat",
    description: "Group conversation with multiple participants",
    color: "text-green-600",
    maxParticipants: 50,
    allowInvites: true,
    allowFileSharing: true,
    allowBroadcast: false,
  },
  class: {
    icon: Hash,
    label: "Class Channel",
    description: "Class-wide messaging channel",
    color: "text-purple-600",
    maxParticipants: null,
    allowInvites: false,
    allowFileSharing: true,
    allowBroadcast: true,
  },
  department: {
    icon: Building2,
    label: "Department Channel",
    description: "Department-wide messaging channel",
    color: "text-orange-600",
    maxParticipants: null,
    allowInvites: false,
    allowFileSharing: true,
    allowBroadcast: true,
  },
  announcement: {
    icon: Megaphone,
    label: "Announcement",
    description: "One-way broadcast channel",
    color: "text-red-600",
    maxParticipants: null,
    allowInvites: false,
    allowFileSharing: true,
    allowBroadcast: true,
  },
}

// Participant role configuration
export const PARTICIPANT_ROLE_CONFIG: Record<
  ParticipantRole,
  {
    label: string
    canSendMessages: boolean
    canAddParticipants: boolean
    canRemoveParticipants: boolean
    canEditConversation: boolean
    canDeleteMessages: boolean
    canPinMessages: boolean
  }
> = {
  owner: {
    label: "Owner",
    canSendMessages: true,
    canAddParticipants: true,
    canRemoveParticipants: true,
    canEditConversation: true,
    canDeleteMessages: true,
    canPinMessages: true,
  },
  admin: {
    label: "Admin",
    canSendMessages: true,
    canAddParticipants: true,
    canRemoveParticipants: true,
    canEditConversation: false,
    canDeleteMessages: true,
    canPinMessages: true,
  },
  member: {
    label: "Member",
    canSendMessages: true,
    canAddParticipants: false,
    canRemoveParticipants: false,
    canEditConversation: false,
    canDeleteMessages: false,
    canPinMessages: false,
  },
  read_only: {
    label: "Read Only",
    canSendMessages: false,
    canAddParticipants: false,
    canRemoveParticipants: false,
    canEditConversation: false,
    canDeleteMessages: false,
    canPinMessages: false,
  },
  guest: {
    label: "Guest",
    canSendMessages: false,
    canAddParticipants: false,
    canRemoveParticipants: false,
    canEditConversation: false,
    canDeleteMessages: false,
    canPinMessages: false,
  },
}

// Message status configuration
export const MESSAGE_STATUS_CONFIG: Record<
  MessageStatus,
  {
    label: string
    color: string
    showIndicator: boolean
  }
> = {
  sending: {
    label: "Sending",
    color: "text-muted-foreground",
    showIndicator: true,
  },
  sent: {
    label: "Sent",
    color: "text-muted-foreground",
    showIndicator: true,
  },
  delivered: {
    label: "Delivered",
    color: "text-muted-foreground",
    showIndicator: true,
  },
  read: {
    label: "Read",
    color: "text-primary",
    showIndicator: true,
  },
  failed: {
    label: "Failed",
    color: "text-destructive",
    showIndicator: true,
  },
}

// Content type configuration
export const CONTENT_TYPE_CONFIG: Record<
  string,
  {
    label: string
    allowEdit: boolean
    maxLength: number | null
  }
> = {
  text: {
    label: "Text",
    allowEdit: true,
    maxLength: 4000,
  },
  image: {
    label: "Image",
    allowEdit: false,
    maxLength: null,
  },
  video: {
    label: "Video",
    allowEdit: false,
    maxLength: null,
  },
  audio: {
    label: "Audio",
    allowEdit: false,
    maxLength: null,
  },
  file: {
    label: "File",
    allowEdit: false,
    maxLength: null,
  },
  link: {
    label: "Link",
    allowEdit: true,
    maxLength: 2000,
  },
  system: {
    label: "System",
    allowEdit: false,
    maxLength: 500,
  },
}

// File upload limits
export const FILE_UPLOAD_CONFIG = {
  image: {
    maxSize: 10 * 1024 * 1024, // 10 MB
    allowedTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    allowedExtensions: [".jpg", ".jpeg", ".png", ".gif", ".webp"],
  },
  video: {
    maxSize: 100 * 1024 * 1024, // 100 MB
    allowedTypes: ["video/mp4", "video/webm", "video/ogg"],
    allowedExtensions: [".mp4", ".webm", ".ogg"],
  },
  audio: {
    maxSize: 25 * 1024 * 1024, // 25 MB
    allowedTypes: ["audio/mpeg", "audio/wav", "audio/ogg"],
    allowedExtensions: [".mp3", ".wav", ".ogg"],
  },
  document: {
    maxSize: 50 * 1024 * 1024, // 50 MB
    allowedTypes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/plain",
    ],
    allowedExtensions: [
      ".pdf",
      ".doc",
      ".docx",
      ".xls",
      ".xlsx",
      ".ppt",
      ".pptx",
      ".txt",
    ],
  },
} as const

// Default settings
export const DEFAULT_SETTINGS = {
  messageRetentionDays: 365, // 1 year
  typingIndicatorTimeout: 5000, // 5 seconds
  messageEditWindow: 15 * 60 * 1000, // 15 minutes
  messageDeleteWindow: 60 * 60 * 1000, // 1 hour
  maxPinnedMessages: 5,
  maxReactionsPerMessage: 50,
  conversationInviteExpiryDays: 7,
  unreadBadgeMax: 99,
} as const

// Emoji reactions (common set)
export const COMMON_REACTIONS = [
  "👍",
  "❤️",
  "😂",
  "😮",
  "😢",
  "🙏",
  "👏",
  "🔥",
  "🎉",
  "✅",
  "❌",
  "⭐",
] as const

// System message templates
export const SYSTEM_MESSAGE_TEMPLATES = {
  participant_joined: (username: string) =>
    `${username} joined the conversation`,
  participant_left: (username: string) => `${username} left the conversation`,
  participant_added: (adder: string, added: string) =>
    `${adder} added ${added}`,
  participant_removed: (remover: string, removed: string) =>
    `${remover} removed ${removed}`,
  conversation_created: (creator: string) =>
    `${creator} created this conversation`,
  conversation_renamed: (username: string, newTitle: string) =>
    `${username} changed the title to "${newTitle}"`,
  conversation_archived: (username: string) =>
    `${username} archived this conversation`,
  message_pinned: (username: string) => `${username} pinned a message`,
  message_unpinned: (username: string) => `${username} unpinned a message`,
} as const

// Socket.IO event names
export const SOCKET_EVENTS = {
  MESSAGE_NEW: "message:new",
  MESSAGE_UPDATED: "message:updated",
  MESSAGE_DELETED: "message:deleted",
  MESSAGE_READ: "message:read",
  MESSAGE_REACTION: "message:reaction",
  CONVERSATION_NEW: "conversation:new",
  CONVERSATION_UPDATED: "conversation:updated",
  CONVERSATION_ARCHIVED: "conversation:archived",
  CONVERSATION_PARTICIPANT_ADDED: "conversation:participant_added",
  CONVERSATION_PARTICIPANT_REMOVED: "conversation:participant_removed",
  TYPING_START: "typing:start",
  TYPING_STOP: "typing:stop",
  CONVERSATION_INVITE: "conversation:invite",
} as const

// Paths
export const MESSAGES_PATH = "/messages"
export const CONVERSATION_PATH = (id: string) => `/messages/${id}`

// Role-based conversation creation permissions
export const CONVERSATION_CREATION_PERMISSIONS: Record<
  string,
  {
    canCreateDirect: boolean
    canCreateGroup: boolean
    canCreateClass: boolean
    canCreateDepartment: boolean
    canCreateAnnouncement: boolean
  }
> = {
  DEVELOPER: {
    canCreateDirect: true,
    canCreateGroup: true,
    canCreateClass: true,
    canCreateDepartment: true,
    canCreateAnnouncement: true,
  },
  ADMIN: {
    canCreateDirect: true,
    canCreateGroup: true,
    canCreateClass: true,
    canCreateDepartment: true,
    canCreateAnnouncement: true,
  },
  TEACHER: {
    canCreateDirect: true,
    canCreateGroup: true,
    canCreateClass: true,
    canCreateDepartment: false,
    canCreateAnnouncement: false,
  },
  STUDENT: {
    canCreateDirect: true,
    canCreateGroup: true,
    canCreateClass: false,
    canCreateDepartment: false,
    canCreateAnnouncement: false,
  },
  GUARDIAN: {
    canCreateDirect: true,
    canCreateGroup: false,
    canCreateClass: false,
    canCreateDepartment: false,
    canCreateAnnouncement: false,
  },
  ACCOUNTANT: {
    canCreateDirect: true,
    canCreateGroup: true,
    canCreateClass: false,
    canCreateDepartment: true,
    canCreateAnnouncement: false,
  },
  STAFF: {
    canCreateDirect: true,
    canCreateGroup: true,
    canCreateClass: false,
    canCreateDepartment: false,
    canCreateAnnouncement: false,
  },
  USER: {
    canCreateDirect: false,
    canCreateGroup: false,
    canCreateClass: false,
    canCreateDepartment: false,
    canCreateAnnouncement: false,
  },
} as const

// Helper functions
export function canUserCreateConversationType(
  role: string,
  type: ConversationType
): boolean {
  const permissions = CONVERSATION_CREATION_PERMISSIONS[role]
  if (!permissions) return false

  switch (type) {
    case "direct":
      return permissions.canCreateDirect
    case "group":
      return permissions.canCreateGroup
    case "class":
      return permissions.canCreateClass
    case "department":
      return permissions.canCreateDepartment
    case "announcement":
      return permissions.canCreateAnnouncement
    default:
      return false
  }
}

export function getFileTypeCategory(
  mimeType: string
): "image" | "video" | "audio" | "document" | "unknown" {
  if (mimeType.startsWith("image/")) return "image"
  if (mimeType.startsWith("video/")) return "video"
  if (mimeType.startsWith("audio/")) return "audio"
  if (
    mimeType.startsWith("application/pdf") ||
    mimeType.includes("word") ||
    mimeType.includes("excel") ||
    mimeType.includes("powerpoint") ||
    mimeType === "text/plain"
  ) {
    return "document"
  }
  return "unknown"
}

export function isFileTypeAllowed(
  mimeType: string,
  category: keyof typeof FILE_UPLOAD_CONFIG
): boolean {
  const config = FILE_UPLOAD_CONFIG[category]
  return (config.allowedTypes as readonly string[]).includes(mimeType)
}

export function isFileSizeAllowed(
  size: number,
  category: keyof typeof FILE_UPLOAD_CONFIG
): boolean {
  const config = FILE_UPLOAD_CONFIG[category]
  return size <= config.maxSize
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}
