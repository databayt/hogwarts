import type {
  Conversation,
  ConversationInvite,
  ConversationParticipant,
  ConversationType,
  Message,
  MessageAttachment,
  MessageDraft,
  MessageReaction,
  MessageReadReceipt,
  MessageStatus,
  ParticipantRole,
  PinnedMessage,
  TypingIndicator,
} from "@prisma/client"

// DTO types for API responses

export type ConversationDTO = {
  id: string
  schoolId: string
  type: ConversationType
  title: string | null
  avatar: string | null
  directParticipant1Id: string | null
  directParticipant2Id: string | null
  lastMessageAt: Date
  isArchived: boolean
  createdAt: Date
  updatedAt: Date
  participantCount: number
  unreadCount: number
  lastMessage: MessageDTO | null
  participants: ConversationParticipantDTO[]
}

export type ConversationParticipantDTO = {
  id: string
  conversationId: string
  userId: string
  user: {
    id: string
    username: string | null
    email: string | null
    image: string | null
    role: string
  }
  role: ParticipantRole
  nickname: string | null
  isPinned: boolean
  lastReadAt: Date | null
  isMuted: boolean
  unreadCount: number
  isActive: boolean
  leftAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export type MessageDTO = {
  id: string
  conversationId: string
  senderId: string
  sender: {
    id: string
    username: string | null
    email: string | null
    image: string | null
  }
  content: string
  contentType: string
  status: MessageStatus
  replyToId: string | null
  replyTo: {
    id: string
    content: string
    senderId: string
    isDeleted: boolean
    sender: {
      id: string
      username: string | null
      email: string | null
    }
  } | null
  isEdited: boolean
  editedAt: Date | null
  isDeleted: boolean
  deletedAt: Date | null
  isSystem: boolean
  metadata: Record<string, unknown> | null
  createdAt: Date
  updatedAt: Date
  attachments: MessageAttachmentDTO[]
  reactions: MessageReactionDTO[]
  readReceipts: MessageReadReceiptDTO[]
  readCount: number
}

export type MessageAttachmentDTO = {
  id: string
  messageId: string
  url: string
  fileUrl: string
  name: string
  fileName: string
  size: number
  fileSize: number
  fileType: string
  thumbnailUrl: string | null
  metadata: Record<string, unknown> | null
  uploadedAt: Date
}

export type MessageReactionDTO = {
  id: string
  messageId: string
  userId: string
  user: {
    id: string
    username: string | null
    image: string | null
  }
  emoji: string
  createdAt: Date
}

export type MessageReadReceiptDTO = {
  id: string
  messageId: string
  userId: string
  user: {
    id: string
    username: string | null
    image: string | null
  }
  readAt: Date
}

export type TypingIndicatorDTO = {
  conversationId: string
  userId: string
  user: {
    id: string
    username: string | null
    image: string | null
  }
  startedAt: Date
}

export type MessageDraftDTO = {
  id: string
  conversationId: string
  userId: string
  content: string
  replyToId: string | null
  metadata: Record<string, unknown> | null
  createdAt: Date
  updatedAt: Date
}

export type PinnedMessageDTO = {
  id: string
  conversationId: string
  messageId: string
  message: MessageDTO
  pinnedById: string
  pinnedBy: {
    id: string
    username: string | null
  }
  pinnedAt: Date
}

export type ConversationInviteDTO = {
  id: string
  conversationId: string
  conversation: {
    id: string
    type: ConversationType
    title: string | null
  }
  inviterId: string
  inviter: {
    id: string
    username: string | null
    image: string | null
  }
  inviteeId: string
  invitee: {
    id: string
    username: string | null
    email: string | null
    image: string | null
  }
  status: string
  expiresAt: Date | null
  createdAt: Date
}

// Conversation list types
export type ConversationListItem = {
  id: string
  type: ConversationType
  title: string | null
  avatar: string | null
  lastMessageAt: Date
  unreadCount: number
  isArchived: boolean
  isPinned: boolean
  isMuted: boolean
  lastMessage: {
    id: string
    content: string
    senderId: string
    senderName: string | null
    createdAt: Date
  } | null
  otherParticipants: Array<{
    id: string
    username: string | null
    image: string | null
  }>
}

// Message list types
export type MessageListItem = {
  id: string
  content: string
  contentType: string
  senderId: string
  senderName: string | null
  senderImage: string | null
  status: MessageStatus
  isEdited: boolean
  isDeleted: boolean
  isSystem: boolean
  createdAt: Date
  replyToId: string | null
  replyToContent: string | null
  attachmentCount: number
  reactionCount: number
  isRead: boolean
}

// Statistics
export type ConversationStats = {
  total: number
  unread: number
  archived: number
  byType: Record<ConversationType, number>
}

export type MessageStats = {
  total: number
  sent: number
  received: number
  unread: number
  today: number
  thisWeek: number
}

// Filters
export type ConversationFilters = {
  type?: ConversationType[]
  isArchived?: boolean
  search?: string
  participantId?: string
}

export type MessageFilters = {
  conversationId?: string
  senderId?: string
  contentType?: string
  search?: string
  startDate?: Date
  endDate?: Date
  hasAttachments?: boolean
}

// Pagination and sorting
export type PaginationParams = {
  page?: number
  perPage?: number
}

export type SortParam = {
  field: string
  order: "asc" | "desc"
}

export type ConversationSortParams = {
  sort?: SortParam[]
}

export type MessageSortParams = {
  sort?: SortParam[]
}

export type ConversationQueryParams = ConversationFilters &
  PaginationParams &
  ConversationSortParams

export type MessageQueryParams = MessageFilters &
  PaginationParams &
  MessageSortParams

// Creation payloads
export type CreateConversationPayload = {
  type: ConversationType
  title?: string
  avatar?: string
  participantIds: string[]
}

export type CreateMessagePayload = {
  conversationId: string
  content: string
  contentType?: string
  replyToId?: string
  attachments?: Array<{
    fileUrl: string
    fileName: string
    fileSize: number
    fileType: string
    thumbnailUrl?: string
  }>
  metadata?: Record<string, unknown>
}

export type UpdateMessagePayload = {
  content?: string
  metadata?: Record<string, unknown>
}

export type CreateConversationInvitePayload = {
  conversationId: string
  inviteeIds: string[]
  expiresAt?: Date
}

// Socket.IO event types
export type MessageSocketEvents = {
  "message:new": MessageDTO
  "message:updated": { messageId: string; content: string; editedAt: Date }
  "message:deleted": { messageId: string; deletedAt: Date }
  "message:read": { messageId: string; userId: string; readAt: Date }
  "message:reaction": MessageReactionDTO
  "conversation:new": ConversationDTO
  "conversation:updated": {
    conversationId: string
    updates: Partial<ConversationDTO>
  }
  "conversation:archived": { conversationId: string }
  "conversation:participant_added": ConversationParticipantDTO
  "conversation:participant_removed": { conversationId: string; userId: string }
  "typing:start": TypingIndicatorDTO
  "typing:stop": { conversationId: string; userId: string }
  "conversation:invite": ConversationInviteDTO
}

// Context types for authorization
export type MessagingAuthContext = {
  userId: string
  schoolId: string
  role: string
}

export type ConversationContext = {
  id: string
  type: ConversationType
  participantIds: string[]
  createdById?: string | null
  description?: string | null
}

export type MessageContext = {
  id: string
  conversationId: string
  senderId: string
}

// Action types
export type MessagingAction =
  | "create_conversation"
  | "read_conversation"
  | "update_conversation"
  | "delete_conversation"
  | "archive_conversation"
  | "add_participant"
  | "remove_participant"
  | "send_message"
  | "read_message"
  | "edit_message"
  | "delete_message"
  | "react_to_message"
  | "pin_message"
  | "create_invite"
  | "send_broadcast"

// Re-export Prisma enums for convenience
export {
  ConversationType,
  ParticipantRole,
  MessageStatus,
} from "@prisma/client"
