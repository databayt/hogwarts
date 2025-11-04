import { db } from "@/lib/db"
import { Prisma, ConversationType, MessageStatus } from "@prisma/client"
import type {
  ConversationFilters,
  MessageFilters,
  PaginationParams,
  SortParam,
  ConversationQueryParams,
  MessageQueryParams,
  ConversationSortParams,
  MessageSortParams,
} from "./types"

// Type aliases for cleaner code
type ConversationListFilters = ConversationFilters
type MessageListFilters = MessageFilters

// Select types for optimized queries
export const conversationListSelect = {
  id: true,
  schoolId: true,
  type: true,
  title: true,
  description: true,
  avatarUrl: true,
  directParticipant1Id: true,
  directParticipant2Id: true,
  lastMessageAt: true,
  isArchived: true,
  createdById: true,
  createdBy: {
    select: {
      id: true,
      username: true,
      email: true,
      image: true,
    },
  },
  createdAt: true,
  updatedAt: true,
  participants: {
    select: {
      id: true,
      userId: true,
      role: true,
      nickname: true,
      joinedAt: true,
      lastReadAt: true,
      isMuted: true,
      mutedUntil: true,
      isPinned: true,
      user: {
        select: {
          id: true,
          username: true,
          email: true,
          image: true,
          role: true,
        },
      },
    },
  },
  _count: {
    select: {
      participants: true,
      messages: true,
    },
  },
} as const

export const messageListSelect = {
  id: true,
  conversationId: true,
  senderId: true,
  sender: {
    select: {
      id: true,
      username: true,
      email: true,
      image: true,
    },
  },
  content: true,
  contentType: true,
  status: true,
  replyToId: true,
  replyTo: {
    select: {
      id: true,
      content: true,
      senderId: true,
      sender: {
        select: {
          id: true,
          username: true,
        },
      },
    },
  },
  isEdited: true,
  editedAt: true,
  isDeleted: true,
  deletedAt: true,
  isSystem: true,
  metadata: true,
  createdAt: true,
  updatedAt: true,
  attachments: {
    select: {
      id: true,
      fileUrl: true,
      fileName: true,
      fileSize: true,
      fileType: true,
      thumbnailUrl: true,
      metadata: true,
      uploadedAt: true,
    },
  },
  reactions: {
    select: {
      id: true,
      userId: true,
      user: {
        select: {
          id: true,
          username: true,
          image: true,
        },
      },
      emoji: true,
      createdAt: true,
    },
  },
  readReceipts: {
    select: {
      id: true,
      userId: true,
      user: {
        select: {
          id: true,
          username: true,
          image: true,
        },
      },
      readAt: true,
    },
  },
  _count: {
    select: {
      attachments: true,
      reactions: true,
      readReceipts: true,
    },
  },
} as const

export const conversationDetailSelect = {
  ...conversationListSelect,
  metadata: true,
  messages: {
    take: 50,
    orderBy: { createdAt: "desc" as const },
    select: messageListSelect,
  },
  pinnedMessages: {
    select: {
      id: true,
      conversationId: true,
      messageId: true,
      pinnedById: true,
      pinnedBy: {
        select: {
          id: true,
          username: true,
        },
      },
      pinnedAt: true,
      message: {
        select: messageListSelect,
      },
    },
  },
} as const

// Query builders
export function buildConversationWhere(
  schoolId: string,
  userId: string,
  filters: ConversationListFilters = {}
): Prisma.ConversationWhereInput {
  const where: Prisma.ConversationWhereInput = {
    schoolId,
    participants: {
      some: {
        userId,
      },
    },
  }

  if (filters.type && filters.type.length > 0) {
    where.type = { in: filters.type }
  }

  if (filters.isArchived !== undefined) {
    where.isArchived = filters.isArchived
  }

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: Prisma.QueryMode.insensitive } },
      { description: { contains: filters.search, mode: Prisma.QueryMode.insensitive } },
    ]
  }

  if (filters.participantId) {
    where.participants = {
      some: {
        userId: filters.participantId,
      },
    }
  }

  return where
}

export function buildMessageWhere(
  schoolId: string,
  filters: MessageListFilters = {}
): Prisma.MessageWhereInput {
  const where: Prisma.MessageWhereInput = {
    conversation: {
      schoolId,
    },
  }

  if (filters.conversationId) {
    where.conversationId = filters.conversationId
  }

  if (filters.senderId) {
    where.senderId = filters.senderId
  }

  if (filters.contentType) {
    where.contentType = filters.contentType
  }

  if (filters.search) {
    where.content = { contains: filters.search, mode: Prisma.QueryMode.insensitive }
  }

  if (filters.startDate || filters.endDate) {
    where.createdAt = {}
    if (filters.startDate) {
      where.createdAt.gte = filters.startDate
    }
    if (filters.endDate) {
      where.createdAt.lte = filters.endDate
    }
  }

  if (filters.hasAttachments !== undefined) {
    if (filters.hasAttachments) {
      where.attachments = { some: {} }
    } else {
      where.attachments = { none: {} }
    }
  }

  return where
}

export function buildConversationOrderBy(
  sort?: SortParam[]
): Prisma.ConversationOrderByWithRelationInput[] {
  if (!sort || sort.length === 0) {
    return [{ lastMessageAt: "desc" }, { createdAt: "desc" }]
  }

  return sort.map((s) => ({
    [s.field]: s.order,
  }))
}

export function buildMessageOrderBy(
  sort?: SortParam[]
): Prisma.MessageOrderByWithRelationInput[] {
  if (!sort || sort.length === 0) {
    return [{ createdAt: "desc" }]
  }

  return sort.map((s) => ({
    [s.field]: s.order,
  }))
}

export function buildPagination(page: number, perPage: number) {
  return {
    skip: (page - 1) * perPage,
    take: perPage,
  }
}

/**
 * Get conversations list with filters and pagination
 */
export async function getConversationsList(
  schoolId: string,
  userId: string,
  params: Partial<ConversationQueryParams> = {}
) {
  const where = buildConversationWhere(schoolId, userId, params)
  const orderBy = buildConversationOrderBy(params.sort)
  const { skip, take } = buildPagination(params.page ?? 1, params.perPage ?? 20)

  const [rows, count] = await Promise.all([
    db.conversation.findMany({
      where,
      orderBy,
      skip,
      take,
      select: conversationListSelect,
    }),
    db.conversation.count({ where }),
  ])

  return { rows, count }
}

/**
 * Get single conversation with full details
 */
export async function getConversation(
  schoolId: string,
  userId: string,
  conversationId: string
) {
  return db.conversation.findFirst({
    where: {
      id: conversationId,
      schoolId,
      participants: {
        some: {
          userId,
        },
      },
    },
    select: conversationDetailSelect,
  })
}

/**
 * Get messages list with filters and pagination
 */
export async function getMessagesList(
  schoolId: string,
  params: Partial<MessageQueryParams> = {}
) {
  const where = buildMessageWhere(schoolId, params)
  const orderBy = buildMessageOrderBy(params.sort)
  const { skip, take } = buildPagination(params.page ?? 1, params.perPage ?? 50)

  const [rows, count] = await Promise.all([
    db.message.findMany({
      where,
      orderBy,
      skip,
      take,
      select: messageListSelect,
    }),
    db.message.count({ where }),
  ])

  return { rows, count }
}

/**
 * Get single message with full details
 */
export async function getMessage(schoolId: string, messageId: string) {
  return db.message.findFirst({
    where: {
      id: messageId,
      conversation: {
        schoolId,
      },
    },
    select: messageListSelect,
  })
}

/**
 * Get conversation statistics
 */
export async function getConversationStats(schoolId: string, userId: string) {
  const where = {
    schoolId,
    participants: {
      some: {
        userId,
      },
    },
  }

  const [total, archived, unread, byType] = await Promise.all([
    db.conversation.count({ where }),
    db.conversation.count({ where: { ...where, isArchived: true } }),
    db.conversationParticipant.count({
      where: {
        userId,
        conversation: {
          schoolId,
        },
        NOT: {
          conversation: {
            lastMessageAt: null,
          },
        },
      },
    }),
    db.conversation.groupBy({
      by: ["type"],
      where,
      _count: true,
    }),
  ])

  return {
    total,
    unread,
    archived,
    byType: Object.fromEntries(
      byType.map((item) => [item.type, item._count])
    ) as Record<ConversationType, number>,
  }
}

/**
 * Get message statistics
 */
export async function getMessageStats(schoolId: string, userId: string) {
  const where = {
    conversation: {
      schoolId,
    },
  }

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [total, sent, received, today, thisWeek] = await Promise.all([
    db.message.count({ where }),
    db.message.count({ where: { ...where, senderId: userId } }),
    db.message.count({
      where: {
        ...where,
        senderId: { not: userId },
        conversation: {
          schoolId,
          participants: {
            some: { userId },
          },
        },
      },
    }),
    db.message.count({ where: { ...where, createdAt: { gte: todayStart } } }),
    db.message.count({ where: { ...where, createdAt: { gte: weekStart } } }),
  ])

  // Get unread count (messages after user's last read in each conversation)
  const unreadMessages = await db.message.count({
    where: {
      conversation: {
        schoolId,
        participants: {
          some: {
            userId,
            lastReadAt: null,
          },
        },
      },
      senderId: { not: userId },
    },
  })

  return {
    total,
    sent,
    received,
    unread: unreadMessages,
    today,
    thisWeek,
  }
}

/**
 * Get unread message count for a user
 */
export async function getUnreadMessageCount(schoolId: string, userId: string) {
  const conversations = await db.conversationParticipant.findMany({
    where: {
      userId,
      conversation: {
        schoolId,
      },
    },
    select: {
      conversationId: true,
      lastReadAt: true,
    },
  })

  let unreadCount = 0

  for (const participant of conversations) {
    const count = await db.message.count({
      where: {
        conversationId: participant.conversationId,
        senderId: { not: userId },
        createdAt: {
          gt: participant.lastReadAt || new Date(0),
        },
      },
    })
    unreadCount += count
  }

  return unreadCount
}

/**
 * Get user's conversation participant record
 */
export async function getConversationParticipant(
  conversationId: string,
  userId: string
) {
  return db.conversationParticipant.findFirst({
    where: {
      conversationId,
      userId,
    },
  })
}

/**
 * Check if user is participant in conversation
 */
export async function isConversationParticipant(
  conversationId: string,
  userId: string
): Promise<boolean> {
  const count = await db.conversationParticipant.count({
    where: {
      conversationId,
      userId,
    },
  })
  return count > 0
}

/**
 * Get conversation participants
 */
export async function getConversationParticipants(conversationId: string) {
  return db.conversationParticipant.findMany({
    where: {
      conversationId,
    },
    select: {
      id: true,
      userId: true,
      role: true,
      nickname: true,
      createdAt: true,
      lastReadAt: true,
      isMuted: true,
      isPinned: true,
      user: {
        select: {
          id: true,
          username: true,
          email: true,
          image: true,
          role: true,
        },
      },
    },
  })
}

/**
 * Get pinned messages for a conversation
 */
export async function getPinnedMessages(conversationId: string) {
  return db.pinnedMessage.findMany({
    where: {
      conversationId,
    },
    orderBy: {
      pinnedAt: "desc",
    },
    select: {
      id: true,
      conversationId: true,
      messageId: true,
      pinnedById: true,
      pinnedBy: {
        select: {
          id: true,
          username: true,
        },
      },
      pinnedAt: true,
      message: {
        select: messageListSelect,
      },
    },
  })
}

/**
 * Get message attachments
 */
export async function getMessageAttachments(messageId: string) {
  return db.messageAttachment.findMany({
    where: {
      messageId,
    },
    orderBy: {
      uploadedAt: "asc",
    },
  })
}

/**
 * Get message reactions
 */
export async function getMessageReactions(messageId: string) {
  return db.messageReaction.findMany({
    where: {
      messageId,
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      userId: true,
      user: {
        select: {
          id: true,
          username: true,
          image: true,
        },
      },
      emoji: true,
      createdAt: true,
    },
  })
}

/**
 * Get message read receipts
 */
export async function getMessageReadReceipts(messageId: string) {
  return db.messageReadReceipt.findMany({
    where: {
      messageId,
    },
    orderBy: {
      readAt: "desc",
    },
    select: {
      id: true,
      userId: true,
      user: {
        select: {
          id: true,
          username: true,
          image: true,
        },
      },
      readAt: true,
    },
  })
}

/**
 * Get message drafts for a user
 */
export async function getMessageDrafts(userId: string) {
  return db.messageDraft.findMany({
    where: {
      userId,
    },
    orderBy: {
      updatedAt: "desc",
    },
  })
}

/**
 * Get message draft for a conversation
 */
export async function getMessageDraft(conversationId: string, userId: string) {
  return db.messageDraft.findFirst({
    where: {
      conversationId,
      userId,
    },
  })
}

/**
 * Get conversation invites for a user
 */
export async function getConversationInvites(userId: string) {
  return db.conversationInvite.findMany({
    where: {
      inviteeId: userId,
      status: "pending",
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      conversationId: true,
      conversation: {
        select: {
          id: true,
          type: true,
          title: true,
        },
      },
      inviterId: true,
      inviter: {
        select: {
          id: true,
          username: true,
          image: true,
        },
      },
      inviteeId: true,
      status: true,
      expiresAt: true,
      createdAt: true,
    },
  })
}

/**
 * Get typing indicators for a conversation
 */
export async function getTypingIndicators(conversationId: string) {
  const fiveSecondsAgo = new Date(Date.now() - 5000)

  return db.typingIndicator.findMany({
    where: {
      conversationId,
      startedAt: {
        gte: fiveSecondsAgo,
      },
    },
    select: {
      userId: true,
      user: {
        select: {
          id: true,
          username: true,
          image: true,
        },
      },
      startedAt: true,
    },
  })
}

/**
 * Search conversations
 */
export async function searchConversations(
  schoolId: string,
  userId: string,
  query: string,
  params: Partial<ConversationQueryParams> = {}
) {
  const where: Prisma.ConversationWhereInput = {
    schoolId,
    participants: {
      some: {
        userId,
      },
    },
    OR: [
      { title: { contains: query, mode: Prisma.QueryMode.insensitive } },
      { description: { contains: query, mode: Prisma.QueryMode.insensitive } },
    ],
  }

  if (params.type && params.type.length > 0) {
    where.type = { in: params.type }
  }

  const { skip, take } = buildPagination(params.page ?? 1, params.perPage ?? 20)

  const [rows, count] = await Promise.all([
    db.conversation.findMany({
      where,
      skip,
      take,
      select: conversationListSelect,
    }),
    db.conversation.count({ where }),
  ])

  return { rows, count }
}

/**
 * Search messages
 */
export async function searchMessages(
  schoolId: string,
  userId: string,
  query: string,
  params: Partial<MessageQueryParams> = {}
) {
  const where: Prisma.MessageWhereInput = {
    conversation: {
      schoolId,
      participants: {
        some: {
          userId,
        },
      },
    },
    content: { contains: query, mode: Prisma.QueryMode.insensitive },
  }

  if (params.conversationId) {
    where.conversationId = params.conversationId
  }

  if (params.senderId) {
    where.senderId = params.senderId
  }

  if (params.startDate || params.endDate) {
    where.createdAt = {}
    if (params.startDate) {
      where.createdAt.gte = params.startDate
    }
    if (params.endDate) {
      where.createdAt.lte = params.endDate
    }
  }

  const { skip, take } = buildPagination(params.page ?? 1, params.perPage ?? 50)

  const [rows, count] = await Promise.all([
    db.message.findMany({
      where,
      skip,
      take,
      select: messageListSelect,
    }),
    db.message.count({ where }),
  ])

  return { rows, count }
}

/**
 * Get direct conversation between two users
 */
export async function getDirectConversation(
  schoolId: string,
  user1Id: string,
  user2Id: string
) {
  return db.conversation.findFirst({
    where: {
      schoolId,
      type: "direct",
      OR: [
        {
          directParticipant1Id: user1Id,
          directParticipant2Id: user2Id,
        },
        {
          directParticipant1Id: user2Id,
          directParticipant2Id: user1Id,
        },
      ],
    },
    select: conversationDetailSelect,
  })
}

/**
 * Get or create direct conversation between two users
 */
export async function getOrCreateDirectConversation(
  schoolId: string,
  user1Id: string,
  user2Id: string
) {
  // Try to find existing direct conversation
  const existing = await getDirectConversation(schoolId, user1Id, user2Id)
  if (existing) return existing

  // Create new direct conversation
  const conversation = await db.conversation.create({
    data: {
      schoolId,
      type: "direct",
      directParticipant1Id: user1Id,
      directParticipant2Id: user2Id,
      createdById: user1Id,
      participants: {
        create: [
          {
            userId: user1Id,
            role: "member",
          },
          {
            userId: user2Id,
            role: "member",
          },
        ],
      },
    },
    select: conversationDetailSelect,
  })

  return conversation
}
